// app/api/backup-restore/delete/route.js
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
    const fileName = searchParams.get('fileName');
    const storeId = searchParams.get('storeId');

    if (!fileName) {
      return new Response(JSON.stringify({ error: 'File name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validasi bahwa storeId diberikan dan toko ada
    if (storeId) {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
      });

      if (!store) {
        return new Response(JSON.stringify({ error: 'Store not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Validasi nama file untuk mencegah directory traversal
    if (fileName.includes('..') || fileName.includes('/')) {
      return new Response(JSON.stringify({ error: 'Invalid file name' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cek apakah file ada di direktori backups
    const backupDir = path.join(process.cwd(), 'backups');
    const filePath = path.join(backupDir, fileName);

    if (!fs.existsSync(filePath)) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hapus file
    fs.unlinkSync(filePath);

    return new Response(JSON.stringify({ 
      message: 'File backup deleted successfully',
      fileName: fileName
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting backup file:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}