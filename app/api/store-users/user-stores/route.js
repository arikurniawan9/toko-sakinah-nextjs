// app/api/store-users/user-stores/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['MANAGER', 'WAREHOUSE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Ambil semua akses toko untuk user ini
    const userStoreAccesses = await prisma.storeUser.findMany({
      where: {
        userId: userId,
        status: { in: ['ACTIVE', 'AKTIF'] }
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true
          }
        }
      }
    });

    // Format data untuk dikembalikan
    const formattedStores = userStoreAccesses.map(access => ({
      id: access.store.id,
      name: access.store.name,
      code: access.store.code,
      status: access.store.status,
      role: access.role,
      assignedAt: access.assignedAt,
      assignedBy: access.assignedBy
    }));

    return NextResponse.json(formattedStores);
  } catch (error) {
    console.error('Error fetching user stores:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}