// app/api/backup-restore/delete-all/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'MANAGER') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return new Response(JSON.stringify({ error: 'Store ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cek apakah toko ada
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return new Response(JSON.stringify({ error: 'Store not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cek apakah direktori backups ada
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      return new Response(JSON.stringify({ 
        message: 'Direktori backup tidak ditemukan, tidak ada file untuk dihapus' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Baca file dalam direktori backups
    const files = fs.readdirSync(backupDir);

    // Filter file backup berdasarkan storeId
    const backupFiles = files.filter(file => 
      file.startsWith(`backup_${storeId}_`) && file.endsWith('.sql')
    );

    // Hapus file-file backup
    const deletedFiles = [];
    const errors = [];
    
    for (const fileName of backupFiles) {
      try {
        const filePath = path.join(backupDir, fileName);
        fs.unlinkSync(filePath);
        deletedFiles.push(fileName);
      } catch (error) {
        errors.push({ fileName, error: error.message });
      }
    }

    return new Response(JSON.stringify({ 
      message: `${deletedFiles.length} file backup berhasil dihapus`,
      deletedFiles,
      errors: errors.length > 0 ? errors : undefined
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting all backup files:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}