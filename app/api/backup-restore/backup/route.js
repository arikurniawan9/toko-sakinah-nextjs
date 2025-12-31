// app/api/backup-restore/backup/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { ROLES } from '@/lib/constants';
import { createSelectiveBackup, getBackupList } from '@/lib/backupRestore';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Dapatkan daftar backup yang tersedia
    const backups = await getBackupList();

    return new Response(JSON.stringify({ 
      success: true, 
      backups 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting backup list:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { type, storeId } = await request.json();

    // Validasi storeId
    if (!storeId) {
      return new Response(JSON.stringify({
        error: 'Store ID is required for backup'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let result;
    if (type === 'full') {
      // Untuk full backup, kita perlu pg_dump yang mungkin tidak tersedia di semua lingkungan
      // Jadi kita gunakan selective backup sebagai gantinya
      result = await createSelectiveBackup(storeId);
    } else {
      result = await createSelectiveBackup(storeId);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      ...result 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}