// app/api/store-users/[id]/activate/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== ROLES.ADMIN && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const storeId = session.user.storeId;
    const { id: userId } = params;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID not found in session' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Periksa apakah user memiliki hubungan dengan toko ini
    const storeUser = await prisma.storeUser.findFirst({
      where: {
        userId: userId,
        storeId: storeId,
      }
    });

    if (!storeUser) {
      return NextResponse.json({ error: 'User tidak ditemukan di toko ini' }, { status: 404 });
    }

    // Aktifkan kembali hubungan user-toko
    const updatedStoreUser = await prisma.storeUser.update({
      where: {
        userId_storeId: {
          userId: userId,
          storeId: storeId,
        }
      },
      data: {
        status: 'ACTIVE'
      }
    });

    // Juga aktifkan user di tabel utama jika user sekarang aktif di salah satu toko
    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        status: 'AKTIF' // Set user status to active in main table
      }
    });

    return NextResponse.json({
      message: 'User berhasil diaktifkan kembali di toko ini',
      storeUser: updatedStoreUser
    });
  } catch (error) {
    console.error('Error activating user:', error);
    return NextResponse.json(
      { error: 'Failed to activate user' },
      { status: 500 }
    );
  }
}