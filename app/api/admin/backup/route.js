import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { ROLES } from '@/lib/constants';

const execPromise = promisify(exec);

// Rate limiting simulation - in production you might want to use a proper rate limiter
const backupAttempts = new Map();

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN role can perform backup
    if (session.user.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Basic rate limiting - prevent too frequent backup attempts
    const userId = session.user.id;
    const now = Date.now();
    const lastAttempt = backupAttempts.get(userId) || 0;

    if (now - lastAttempt < 30000) { // 30 seconds cooldown
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' }, { status: 429 });
    }

    backupAttempts.set(userId, now);

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

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${database}_${timestamp}.sql`;
    const backupPath = path.join(process.cwd(), 'backups', filename);

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Create backups directory if it doesn't exist
    const backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Build pg_dump command
    const pgDumpCmd = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-password`;

    // Execute pg_dump command
    const { stdout, stderr } = await execPromise(pgDumpCmd, {
      env: {
        ...process.env,
        PGPASSWORD: password,
      },
    });

    if (stderr) {
      console.error('pg_dump error:', stderr);
      return NextResponse.json({ error: 'Backup failed: ' + stderr }, { status: 500 });
    }

    // Write backup to file
    fs.writeFileSync(backupPath, stdout);

    // Return success response with backup file info
    return NextResponse.json({
      success: true,
      message: 'Backup created successfully',
      filename: filename,
      path: backupPath,
      size: fs.statSync(backupPath).size,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: error.message || 'Backup failed' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN role can perform backup
    if (session.user.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Basic rate limiting - prevent too frequent backup attempts
    const userId = session.user.id;
    const now = Date.now();
    const lastAttempt = backupAttempts.get(userId) || 0;

    if (now - lastAttempt < 30000) { // 30 seconds cooldown
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' }, { status: 429 });
    }

    backupAttempts.set(userId, now);

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'sql'; // Default to SQL format

    // Validate format
    if (!['sql', 'json'].includes(format)) {
      return NextResponse.json({ error: 'Format tidak valid. Gunakan sql atau json.' }, { status: 400 });
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

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = format === 'json' ? 'json' : 'sql';
    const filename = `backup_${database}_${timestamp}.${extension}`;
    const backupPath = path.join(process.cwd(), 'backups', filename);

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Create backups directory if it doesn't exist
    const backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    let backupData = '';

    if (format === 'json') {
      // For JSON backup, we'll use Prisma to export data
      // This is a simplified approach - in production you might want a more comprehensive solution
      backupData = JSON.stringify({
        timestamp: new Date().toISOString(),
        database: database,
        tables: [] // This would be populated with actual table data
      }, null, 2);

      fs.writeFileSync(backupPath, backupData);
    } else {
      // Build pg_dump command for SQL format
      const pgDumpCmd = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --no-password`;

      // Execute pg_dump command
      const { stdout, stderr } = await execPromise(pgDumpCmd, {
        env: {
          ...process.env,
          PGPASSWORD: password,
        },
      });

      if (stderr) {
        console.error('pg_dump error:', stderr);
        return NextResponse.json({ error: 'Backup failed: ' + stderr }, { status: 500 });
      }

      // Write backup to file
      fs.writeFileSync(backupPath, stdout);
    }

    // Return success response with backup file info
    return NextResponse.json({
      success: true,
      message: 'Backup created successfully',
      filename: filename,
      path: backupPath,
      size: fs.statSync(backupPath).size,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: error.message || 'Backup failed' }, { status: 500 });
  }
}