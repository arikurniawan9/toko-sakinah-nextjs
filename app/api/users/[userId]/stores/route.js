// app/api/users/[userId]/stores/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.id !== params.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ambil semua toko yang bisa diakses oleh user ini
    const storeUsers = await prisma.storeUser.findMany({
      where: {
        userId: params.userId,
        status: 'ACTIVE',
      },
      include: {
        store: true,
      },
    });

    const stores = storeUsers.map(storeUser => ({
      id: storeUser.store.id,
      name: storeUser.store.name,
      role: storeUser.role,
      status: storeUser.status,
    }));

    return NextResponse.json({ stores });
  } catch (error) {
    console.error('Error fetching user stores:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}