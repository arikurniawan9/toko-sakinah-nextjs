import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has storeId
    if (!session.user.storeId) {
      return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
    }

    // Count pending warehouse distributions for this store
    const pendingDistributions = await prisma.warehouseDistribution.count({
      where: {
        storeId: session.user.storeId,
        status: 'PENDING_ACCEPTANCE',
      },
    });

    return NextResponse.json({ 
      pendingDistributions: pendingDistributions || 0 
    });
  } catch (error) {
    console.error('Error fetching pending distributions count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}