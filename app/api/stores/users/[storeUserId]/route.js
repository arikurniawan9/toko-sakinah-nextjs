// app/api/stores/users/[storeUserId]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeUserId = params.storeUserId;

    // Ambil informasi storeUser untuk mengetahui toko mana
    const storeUser = await prisma.storeUser.findUnique({
      where: { id: storeUserId },
      include: {
        store: true
      }
    });

    if (!storeUser) {
      return NextResponse.json({ error: 'Relasi user-toko tidak ditemukan' }, { status: 404 });
    }

    // Hanya MANAGER atau ADMIN toko ini yang bisa menghapus user
    if (session.user.role !== ROLES.MANAGER) {
      if (session.user.role !== ROLES.ADMIN || session.user.storeId !== storeUser.storeId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Untuk keamanan, tidak benar-benar hapus, tapi set status ke INACTIVE
    await prisma.storeUser.update({
      where: { id: storeUserId },
      data: { status: 'INACTIVE' }
    });

    return NextResponse.json({ 
      success: true,
      message: 'User berhasil dihapus dari toko' 
    });
  } catch (error) {
    console.error('Error removing user from store:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}