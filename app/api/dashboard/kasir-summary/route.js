// app/api/dashboard/kasir-summary/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Get the start and end of the current day in UTC
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 1. Get total transactions today
    const transactionsCount = await prisma.sale.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // 2. Get total revenue today
    const totalRevenueResult = await prisma.sale.aggregate({
      _sum: {
        total: true,
      },
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
    const totalRevenue = totalRevenueResult._sum.total || 0;

    // 3. Get total items sold today
    const totalItemsSoldResult = await prisma.saleDetail.aggregate({
        _sum: {
            quantity: true,
        },
        where: {
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
