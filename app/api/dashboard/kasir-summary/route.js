// app/api/dashboard/kasir-summary/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request) {
  try {
    // Get session to determine store access
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow cashier, admin, and manager roles to access this data
    const allowedRoles = [ROLES.CASHIER, ROLES.ADMIN, ROLES.MANAGER];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // For multi-tenant system, get store ID from session
    const storeId = session.user.storeId;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID not found in session' }, { status: 400 });
    }

    // Get the start and end of the current day in UTC
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 1. Get total transactions today for this store
    const transactionsCount = await prisma.sale.count({
      where: {
        storeId, // Filter by store ID
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // 2. Get total revenue today for this store
    const totalRevenueResult = await prisma.sale.aggregate({
      _sum: {
        total: true,
      },
      where: {
        storeId, // Filter by store ID
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
    const totalRevenue = totalRevenueResult._sum.total || 0;

    // 3. Get total items sold today for this store
    const totalItemsSoldResult = await prisma.saleDetail.aggregate({
        _sum: {
            quantity: true,
        },
        where: {
            storeId, // Filter by store ID
            sale: {
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
        },
    });
    const totalItemsSold = totalItemsSoldResult._sum.quantity || 0;


    return NextResponse.json({
      transactionsCount,
      totalRevenue,
      totalItemsSold,
    });

  } catch (error) {
    console.error('Error fetching cashier summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summary data' },
      { status: 500 }
    );
  }
}
