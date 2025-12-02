// app/api/manager/users/[userId]/activate/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id || session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = params;

    // Periksa apakah user ada
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Aktifkan kembali user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'AKTIF'
      }
    });

    // Jika user sebelumnya tidak memiliki hubungan aktif dengan toko, 
    // kita mungkin perlu mengembalikan status hubungan storeUser ke ACTIVE
    await prisma.storeUser.updateMany({
      where: {
        userId: userId,
      },
      data: {
        status: 'ACTIVE'
      }
    });

    // Jangan kembalikan password hash
    const { password, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error activating user:', error);
    return NextResponse.json(
      { error: 'Failed to activate user' },
      { status: 500 }
    );
  }
}