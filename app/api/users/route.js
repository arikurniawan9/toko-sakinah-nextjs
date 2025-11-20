// app/api/users/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hanya MANAGER atau ADMIN per toko yang bisa melihat semua user
    if (session.user.role !== ROLES.MANAGER && session.user.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Jika ADMIN per toko, hanya tampilkan user yang tidak memiliki role global
    let users;
    if (session.user.role === ROLES.ADMIN) {
      users = await prisma.user.findMany({
        where: {
          role: {
            notIn: [ROLES.MANAGER, ROLES.WAREHOUSE]  // Admin toko tidak bisa mengelola user global
          }
        },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          status: true,
        },
        orderBy: { name: 'asc' }
      });
    } else { // MANAGER
      users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          status: true,
        },
        orderBy: { name: 'asc' }
      });
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}