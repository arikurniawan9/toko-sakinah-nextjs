// app/api/backup-restore/upload/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'MANAGER') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const storeId = formData.get('storeId');
    const filename = formData.get('filename');

    // Validasi input
    if (!file || !Buffer.isBuffer(file)) {
      return new Response(JSON.stringify({ error: 'File tidak valid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!filename) {
      return new Response(JSON.stringify({ error: 'Filename is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Jika storeId tidak diberikan, kita tetap lanjutkan upload
    // Validasi store akan dilakukan di route restore nanti
    if (storeId) {
      // Jika storeId diberikan, lakukan validasi seperti biasa
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

    // Validasi ekstensi file - sekarang hanya menerima .json
    const lowerCaseFilename = filename.toLowerCase();
    if (!lowerCaseFilename.endsWith('.json')) {
      return new Response(JSON.stringify({ error: 'Hanya file .json yang diperbolehkan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validasi ukuran file (maksimal 100MB)
    const maxFileSize = 100 * 1024 * 1024; // 100MB
    if (file.length > maxFileSize) {
      return new Response(JSON.stringify({ error: 'Ukuran file terlalu besar (maksimal 100MB)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Buat direktori backups jika belum ada
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Pastikan nama file aman
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(backupDir, sanitizedFilename);

    // Simpan file
    fs.writeFileSync(filePath, file);

    return new Response(JSON.stringify({ 
      message: 'File berhasil diupload', 
      filename: sanitizedFilename,
      filePath: filePath,
      storeId: storeId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error uploading backup file:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}