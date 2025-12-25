export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES, WAREHOUSE_STORE_ID } from '@/lib/constants';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can access this API
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all stores except the warehouse store itself
    // The warehouse master store is identified by WAREHOUSE_STORE_ID code
    // We exclude it from the list to prevent warehouse from distributing to itself
    const stores = await globalPrisma.store.findMany({
      where: {
        code: {
          not: WAREHOUSE_STORE_ID,
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log(`Fetched ${stores.length} stores for warehouse distribution (excluding warehouse master store)`);

    return NextResponse.json({ stores });
  } catch (error) {
    console.error('Error fetching stores for warehouse distribution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
