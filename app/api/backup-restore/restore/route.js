// app/api/backup-restore/restore/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { ROLES } from '@/lib/constants';
import { restoreBackup, getBackupList } from '@/lib/backupRestore';
import fs from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cek apakah request berisi FormData atau JSON
    const contentType = request.headers.get('content-type');

    let fileName, storeId;

    if (contentType && contentType.includes('multipart/form-data')) {
      // Jika FormData, kita tidak bisa menggunakannya langsung di edge runtime
      // Jadi kita perlu mengubah pendekatan
      // Kita akan menerima fileName dari FormData
      const formData = await request.formData();
      fileName = formData.get('backupFile');
      storeId = formData.get('storeId');
    } else {
      // Jika JSON
      const { fileName: jsonFileName, storeId: jsonStoreId } = await request.json();
      fileName = jsonFileName;
      storeId = jsonStoreId;
    }

    // Validasi input
    if (!fileName || !storeId) {
      return new Response(JSON.stringify({
        error: 'File name and store ID are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validasi nama file untuk mencegah directory traversal
    if (fileName.includes('..') || fileName.includes('/')) {
      return new Response(JSON.stringify({
        error: 'Invalid file name'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cek apakah toko ada
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return new Response(JSON.stringify({
        error: 'Store not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Dapatkan daftar backup yang tersedia untuk toko ini
    const backups = await getBackupList(storeId);
    const backupExists = backups.some(backup => backup.fileName === fileName);

    if (!backupExists) {
      return new Response(JSON.stringify({
        error: 'Backup file not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const backupDir = path.join(process.cwd(), 'backups');
    const backupFilePath = path.join(backupDir, fileName);

    // Cek apakah file benar-benar ada
    try {
      await fs.access(backupFilePath);
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Backup file not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Lakukan restore
    const result = await restoreBackup(backupFilePath);

    return new Response(JSON.stringify({
      success: true,
      ...result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}