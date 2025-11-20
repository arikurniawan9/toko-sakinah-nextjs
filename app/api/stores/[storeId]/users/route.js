// app/api/stores/[storeId]/users/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = params.storeId;

    // Hanya MANAGER atau ADMIN toko ini yang bisa mengakses
    if (session.user.role !== ROLES.MANAGER) {
      // Untuk ADMIN per toko, pastikan hanya bisa mengakses toko mereka sendiri
      if (session.user.role !== ROLES.ADMIN || session.user.storeId !== storeId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Ambil semua user yang memiliki akses ke toko ini
    const storeUsers = await prisma.storeUser.findMany({
      where: {
        storeId: storeId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        }
      },
      orderBy: {
        assignedAt: 'desc',
      }
    });

    return NextResponse.json({ users: storeUsers });
  } catch (error) {
    console.error('Error fetching store users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}