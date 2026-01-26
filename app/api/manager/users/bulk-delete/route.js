// app/api/manager/users/bulk-delete/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import { logActivity } from '@/lib/auditTrail';

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { ids } = await request.json();

    // Validasi input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify({ error: 'ID pengguna tidak valid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ambil data pengguna sebelum dihapus
    const usersToDelete = await prisma.user.findMany({
      where: {
        id: { in: ids }
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true
      }
    });

    // Jangan hapus user manager
    const managerUsers = usersToDelete.filter(user => user.role === ROLES.MANAGER);
    if (managerUsers.length > 0) {
      return new Response(JSON.stringify({ 
        error: `Tidak dapat menghapus pengguna dengan role MANAGER: ${managerUsers.map(u => u.name).join(', ')}` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update status menjadi INAKTIF alih-alih menghapus
    const updatedUsers = await prisma.user.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        status: 'INAKTIF'
      }
    });

    // Catat aktivitas untuk setiap pengguna
    for (const user of usersToDelete) {
      await logActivity(
        session.user.id,
        'DELETE',
        'USER',
        user.id,
        `Pengguna "${user.name}" dinonaktifkan`,
        { ...user },
        { ...user, status: 'INAKTIF' },
        null // Tidak ada storeId karena ini adalah operasi manager
      );
    }

    return new Response(JSON.stringify({ 
      message: `Berhasil menonaktifkan ${updatedUsers.count} pengguna`,
      deletedCount: updatedUsers.count
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error bulk deleting users:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}