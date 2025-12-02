// app/api/laporan/labarugi/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.storeId) {
    return NextResponse.json({ error: 'Unauthorized. No store selected or user not authorized.' }, { status: 401 });
  }
  
  // Hanya ADMIN toko yang dapat mengakses laporan ini
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden. Access is restricted to ADMINs.' }, { status: 403 });
  }

  const storeId = session.user.storeId;

  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let startDate = startDateParam ? new Date(startDateParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    let endDate = endDateParam ? new Date(endDateParam) : new Date();
    endDate.setHours(23, 59, 59, 999); // Ensure endDate includes the whole day

    // Fetch total sales within the date range for the specific store
    const salesResult = await prisma.$queryRaw`
      SELECT 
        COALESCE(SUM(total), 0) as totalSales,
        COUNT(*) as totalTransactions
      FROM "Sale"
      WHERE "createdAt" >= ${startDate} 
      AND "createdAt" <= ${endDate}
      AND "storeId" = ${storeId}
    `;

    const totalSales = Number(salesResult[0]?.totalSales || 0);
    const totalTransactions = Number(salesResult[0]?.totalTransactions || 0);

    // Fetch total expenses within the date range for the specific store
    const expensesResult = await prisma.$queryRaw`
      SELECT 
        COALESCE(SUM(amount), 0) as totalExpenses
      FROM "Expense"
      WHERE date >= ${startDate} 
      AND date <= ${endDate}
      AND "storeId" = ${storeId}
    `;

    const totalExpenses = Number(expensesResult[0]?.totalExpenses || 0);

    // Calculate net profit/loss
    const netProfit = totalSales - totalExpenses;

    // Fetch daily sales and expenses for chart for the specific store
    const salesByDay = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as saleDate,
        SUM(total) as dailySales,
        COUNT(*) as transactionCount
      FROM "Sale"
      WHERE "createdAt" >= ${startDate} 
      AND "createdAt" <= ${endDate}
      AND "storeId" = ${storeId}
      GROUP BY DATE("createdAt")
      ORDER BY saleDate ASC
    `;

    const expensesByDay = await prisma.$queryRaw`
      SELECT 
        DATE(date) as expenseDate,
        SUM(amount) as dailyExpenses
      FROM "Expense"
      WHERE date >= ${startDate} 
      AND date <= ${endDate}
      AND "storeId" = ${storeId}
      GROUP BY DATE(date)
      ORDER BY expenseDate ASC
    `;
    
    // Combine sales and expenses data by date using a Map
    const dailyDataMap = new Map();

    salesByDay.forEach(s => {
      if (s.saleDate) {
        const dateStr = s.saleDate.toISOString().split('T')[0];
        if (!dailyDataMap.has(dateStr)) {
          dailyDataMap.set(dateStr, { date: dateStr, sales: 0, expenses: 0, transactions: 0 });
        }
        const dayData = dailyDataMap.get(dateStr);
        dayData.sales += Number(s.dailySales);
        dayData.transactions += Number(s.transactionCount);
      }
    });

    expensesByDay.forEach(e => {
      if (e.expenseDate) {
        const dateStr = e.expenseDate.toISOString().split('T')[0];
        if (!dailyDataMap.has(dateStr)) {
          dailyDataMap.set(dateStr, { date: dateStr, sales: 0, expenses: 0, transactions: 0 });
        }
        dailyDataMap.get(dateStr).expenses += Number(e.dailyExpenses);
      }
    });

    const combinedData = Array.from(dailyDataMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));

    combinedData.forEach(d => {
      d.profit = d.sales - d.expenses;
    });

    // Format the daily data for charts
    const chartData = combinedData.map(day => ({
      name: new Date(day.date + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }), // Add T00:00:00 to ensure correct date parsing
      sales: day.sales,
      expenses: day.expenses,
      profit: day.profit,
      transactions: day.transactions,
      fullDate: day.date
    }));

    return NextResponse.json({
      summary: {
        totalSales,
        totalExpenses,
        netProfit,
        totalTransactions
      },
      dailyData: chartData
    });

  } catch (error) {
    console.error('Error fetching profit/loss report:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data laporan laba rugi. ' + error.message },
      { status: 500 }
    );
  }
}