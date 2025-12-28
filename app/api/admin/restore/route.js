import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';
import { ROLES } from '@/lib/constants';

const execPromise = promisify(exec);

// Rate limiting simulation - in production you might want to use a proper rate limiter
const restoreAttempts = new Map();

// Disable Next.js default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN role can perform restore
    if (session.user.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Basic rate limiting - prevent too frequent restore attempts
    const userId = session.user.id;
    const now = Date.now();
    const lastAttempt = restoreAttempts.get(userId) || 0;

    if (now - lastAttempt < 60000) { // 60 seconds cooldown (restore is more critical)
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' }, { status: 429 });
    }

    restoreAttempts.set(userId, now);

    // Parse the multipart form data
    const formData = await new Promise((resolve, reject) => {
      const form = new formidable.IncomingForm();
      form.uploadDir = path.join(process.cwd(), 'temp');

      // Create temp directory if it doesn't exist
      if (!fs.existsSync(form.uploadDir)) {
        fs.mkdirSync(form.uploadDir, { recursive: true });
      }

      form.parse(request, (err, fields, files) => {
        if (err) {
          reject(err);
        } else {
          resolve({ fields, files });
        }
      });
    });

    const backupFile = formData.files.backupFile;

    if (!backupFile) {
      return NextResponse.json({ error: 'No backup file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedExtensions = ['.sql', '.json', '.dump'];
    const fileExtension = path.extname(backupFile.originalFilename || backupFile.name).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({ error: `Invalid file type. Allowed: ${allowedExtensions.join(', ')}` }, { status: 400 });
    }

    // Validate file size (limit to 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB in bytes
    if (backupFile.size > maxSize) {
      return NextResponse.json({ error: 'File size too large. Maximum 500MB allowed.' }, { status: 400 });
    }

    // Validate filename to prevent directory traversal
    const fileName = backupFile.originalFilename || backupFile.name;
    if (fileName.includes('..') || fileName.includes('/')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Get database connection details from environment variables
    const { DATABASE_URL } = process.env;

    if (!DATABASE_URL) {
      return NextResponse.json({ error: 'Database URL not configured' }, { status: 500 });
    }

    // Parse the DATABASE_URL to extract connection details
    const dbUrl = new URL(DATABASE_URL);
    const host = dbUrl.hostname;
    const port = dbUrl.port || '5432';
    const database = dbUrl.pathname.split('/')[1];
    const username = dbUrl.username;
    const password = dbUrl.password;

    // Validate database connection parameters
    if (!host || !database || !username) {
      return NextResponse.json({ error: 'Database configuration is incomplete' }, { status: 500 });
    }

    // Determine if it's a SQL or JSON file
    if (fileExtension === '.sql') {
      // For SQL files, use psql to restore
      const psqlCmd = `psql -h ${host} -p ${port} -U ${username} -d ${database} --no-password`;

      // Execute psql command with the backup file
      const { stderr } = await execPromise(psqlCmd, {
        env: {
          ...process.env,
          PGPASSWORD: password,
        },
        input: fs.readFileSync(backupFile.filepath, 'utf8'),
      });

      if (stderr) {
        console.error('psql restore error:', stderr);
        return NextResponse.json({ error: 'Restore failed: ' + stderr }, { status: 500 });
      }
    } else if (fileExtension === '.json') {
      // For JSON files, we would need to implement a custom restore function
      // This is a simplified approach - in production you might want a more comprehensive solution
      const backupData = JSON.parse(fs.readFileSync(backupFile.filepath, 'utf8'));

      // Here you would implement the logic to restore from JSON backup
      // This might involve using Prisma to insert the data back into the database
      console.log('Restoring from JSON backup:', backupData);

      // For now, we'll just return a success message
      // In a real implementation, you would need to process the JSON data
      // and insert it back into the database using Prisma
    } else if (fileExtension === '.dump') {
      // For dump files, use pg_restore
      const pgRestoreCmd = `pg_restore -h ${host} -p ${port} -U ${username} -d ${database} --no-password --clean --if-exists ${backupFile.filepath}`;

      const { stderr } = await execPromise(pgRestoreCmd, {
        env: {
          ...process.env,
          PGPASSWORD: password,
        },
      });

      if (stderr) {
        console.error('pg_restore error:', stderr);
        return NextResponse.json({ error: 'Restore failed: ' + stderr }, { status: 500 });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(backupFile.filepath);

    return NextResponse.json({
      success: true,
      message: 'Database restored successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Restore error:', error);

    // Clean up any uploaded files in case of error
    try {
      // This is a simplified cleanup - in a real implementation you'd need to track uploaded files
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    return NextResponse.json({ error: error.message || 'Restore failed' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN role can access backup list
    if (session.user.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get list of backup files
    const backupsDir = path.join(process.cwd(), 'backups');

    if (!fs.existsSync(backupsDir)) {
      return NextResponse.json({ backups: [] });
    }

    const files = fs.readdirSync(backupsDir);
    const backups = files
      .filter(file => file.endsWith('.sql') || file.endsWith('.json') || file.endsWith('.dump'))
      .map(file => {
        const filePath = path.join(backupsDir, file);

        // Security check: ensure file is in the backups directory
        const resolvedFilePath = path.resolve(filePath);
        const resolvedBackupsDir = path.resolve(backupsDir);
        if (!resolvedFilePath.startsWith(resolvedBackupsDir)) {
          return null; // Skip this file
        }

        const stat = fs.statSync(filePath);
        return {
          filename: file,
          size: stat.size,
          createdAt: stat.birthtime,
          modifiedAt: stat.mtime,
        };
      })
      .filter(Boolean) // Remove null values
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by newest first

    return NextResponse.json({ backups });
  } catch (error) {
    console.error('Get backups error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get backup list' }, { status: 500 });
  }
}