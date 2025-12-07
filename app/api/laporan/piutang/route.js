// app/api/laporan/piutang/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request) {
  const session = await getSession();
  // Allow both ADMIN and CASHIER to access this endpoint
  if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Determine storeId for multi-tenant security
    const storeUser = await prisma.storeUser.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['ACTIVE', 'AKTIF'] },
      },
      select: { storeId: true }
    });

    if (!storeUser) {
      return NextResponse.json({ error: 'User does not have access to any store' }, { status: 403 });
    }

    const where = {
      AND: [
        { storeId: storeUser.storeId } // Ensure user only sees receivables from their store
      ],
    };

    if (status) {
      const statuses = status.split(',');
      if (statuses.length > 0) {
        where.AND.push({
          status: {
            in: statuses,
          },
        });
      }
    }

    if (search) {
      where.AND.push({
        OR: [
          {
            member: {
              name: {
                contains: search,
                mode: 'insensitive'
              },
            },
          },
          {
            sale: {
              id: {
                contains: search,
                mode: 'insensitive'
              },
            },
          },
        ]
      });
    }

    const [receivables, total] = await Promise.all([
      prisma.receivable.findMany({
        where: where.AND.length > 0 ? where : undefined,
        include: {
          member: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          sale: {
            select: {
              id: true,
              date: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.receivable.count({
        where: where.AND.length > 0 ? where : undefined,
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      receivables,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      }
    });
  } catch (error) {
    console.error('Error fetching receivables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receivables' },
      { status: 500 }
    );
  }
}
