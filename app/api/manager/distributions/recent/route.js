export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only MANAGER role can access this API
    if (session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const recentDistributions = await globalPrisma.warehouseDistribution.findMany({
      take: 5, // Get the 5 most recent distributions
      orderBy: {
        distributedAt: 'desc',
      },
      include: {
        product: {
          select: {
            name: true,
            productCode: true,
          },
        },
        store: {
          select: {
            name: true,
          },
        },
        distributedByUser: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ recentDistributions });
  } catch (error) {
    console.error('Error fetching recent warehouse distributions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
