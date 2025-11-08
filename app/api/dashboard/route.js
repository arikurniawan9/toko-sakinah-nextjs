// app/api/dashboard/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // --- Stats Overview ---
    const totalProducts = await prisma.product.count();
    const totalMembers = await prisma.member.count();
    const totalCashiers = await prisma.user.count({ where: { role: 'CASHIER' } });
    const totalAttendants = await prisma.user.count({ where: { role: 'ATTENDANT' } });
    const activeEmployees = totalCashiers + totalAttendants;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const transactionsToday = await prisma.sale.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // --- Sales Chart Data (Last 7 days) ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Include today, so 7 days total
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const salesDataRaw = await prisma.$queryRaw`
      SELECT
        strftime('%Y-%m-%d', createdAt) as saleDate,
        SUM(total) as totalSales,
        COUNT(id) as totalTransactions
      FROM Sale
      WHERE createdAt >= ${sevenDaysAgo.toISOString()} AND createdAt <= ${new Date().toISOString()}
      GROUP BY saleDate
      ORDER BY saleDate ASC;
    `;

    const dailySalesChartData = [];
    let currentDate = new Date(sevenDaysAgo);
    while (currentDate <= new Date()) {
      const dateString = currentDate.toISOString().split('T')[0];
      const salesForDay = salesDataRaw.find(
        (s) => s.saleDate === dateString
      );
      dailySalesChartData.push({
        name: currentDate.toLocaleDateString('id-ID', { weekday: 'short' }), // e.g., "Sen"
        sales: Number(salesForDay?.totalSales || 0),
        transactions: Number(salesForDay?.totalTransactions || 0),
        fullDate: dateString,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // --- Recent Activity Log (Last 5 transactions) ---
    const recentTransactions = await prisma.sale.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        cashier: {
          select: { name: true },
        },
      },
    });

    const formattedRecentTransactions = recentTransactions.map(sale => ({
      id: sale.id,
      cashierName: sale.user?.name || 'N/A',
      date: sale.createdAt,
      totalAmount: sale.totalAmount,
      paymentMethod: sale.paymentMethod || 'N/A', // Assuming paymentMethod exists on Sale model
    }));


    return NextResponse.json({
      totalProducts,
      totalMembers,
      transactionsToday,
      activeEmployees,
      dailySalesChartData,
      recentTransactions: formattedRecentTransactions,
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' }, 
      { status: 500 }
    );
  }
}
