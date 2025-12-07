// app/api/backup-restore/backup/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { backupStoreData, createCompressedBackup, encryptBackup, ensureBackupDirectory } from '@/utils/backupRestore';
import { logAudit, AUDIT_ACTIONS } from '@/lib/auditLogger';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['MANAGER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId, includeUsers = false, encrypt = false } = await request.json();

    // Validasi input
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    // Cek apakah toko ada dan pengguna memiliki akses
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Untuk role selain MANAGER, pastikan pengguna memiliki akses ke toko ini
    if (session.user.role !== 'MANAGER') {
      const storeUser = await prisma.storeUser.findFirst({
        where: {
          userId: session.user.id,
          storeId: storeId,
          status: { in: ['ACTIVE', 'AKTIF'] }
        }
      });

      if (!storeUser) {
        return NextResponse.json({ error: 'Unauthorized to backup this store' }, { status: 401 });
      }
    }

    // Buat direktori backup jika belum ada
    const backupDir = ensureBackupDirectory();

    // Dapatkan data backup
    const backupData = await backupStoreData(storeId, includeUsers);

    // Konversi ke JSON
    const jsonData = JSON.stringify(backupData, null, 2);

    // Jika diminta, kompres data
    let backupBuffer = Buffer.from(jsonData);
    if (process.env.BACKUP_COMPRESSION === 'true') {
      backupBuffer = await createCompressedBackup(backupBuffer);
    }

    // Jika diminta, enkripsi data
    let finalBuffer = backupBuffer;
    if (encrypt && process.env.BACKUP_ENCRYPTION_KEY) {
      finalBuffer = await encryptBackup(backupBuffer, process.env.BACKUP_ENCRYPTION_KEY);
    }

    // Buat nama file dengan format: backup_storeId_timestamp.json[.gz][.enc]
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
    let fileName = `backup_${storeId}_${timestamp}.json`;

    if (process.env.BACKUP_COMPRESSION === 'true') {
      fileName += '.gz';
    }

    if (encrypt) {
      fileName += '.enc';
    }

    const filePath = path.join(backupDir, fileName);

    // Simpan file backup
    fs.writeFileSync(filePath, finalBuffer);

    // Log aktivitas backup
    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.SECURITY_ALERT, // Gunakan action khusus untuk backup
      tableName: 'Backup',
      recordId: fileName,
      newValue: { storeId, fileName, includeUsers, encrypt },
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'unknown',
      storeId: storeId,
    });

    return NextResponse.json({
      message: 'Backup created successfully',
      fileName: fileName,
      filePath: filePath,
      storeName: store.name,
      fileSize: finalBuffer.length,
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}