import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import fs from 'fs';
import path from 'path';
import { ROLES } from '@/lib/constants';

// Rate limiting simulation - in production you might want to use a proper rate limiter
const deleteAttempts = new Map();

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN role can delete backup files
    if (session.user.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Basic rate limiting - prevent too frequent delete attempts
    const userId = session.user.id;
    const now = Date.now();
    const lastAttempt = deleteAttempts.get(userId) || 0;

    if (now - lastAttempt < 10000) { // 10 seconds cooldown
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' }, { status: 429 });
    }

    deleteAttempts.set(userId, now);

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename not provided' }, { status: 400 });
    }

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'backups', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if file is in the backups directory (security check)
    const backupsDir = path.join(process.cwd(), 'backups');
    const resolvedFilePath = path.resolve(filePath);
    const resolvedBackupsDir = path.resolve(backupsDir);

    if (!resolvedFilePath.startsWith(resolvedBackupsDir)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Additional security: validate file extension
    const allowedExtensions = ['.sql', '.json', '.dump'];
    const fileExtension = path.extname(filename).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 403 });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    return NextResponse.json({
      success: true,
      message: 'Backup file deleted successfully',
      filename: filename,
    });
  } catch (error) {
    console.error('Delete backup error:', error);
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }
}