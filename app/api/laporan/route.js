// app/api/laporan/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const reportType = searchParams.get('type') || 'daily'; // daily, weekly, monthly, yearly

    let startDate = startDateParam ? new Date(startDateParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    let endDate = endDateParam ? new Date(endDateParam) : new Date();
    endDate.setHours(23, 59, 59, 999); // Ensure endDate includes the whole day

    // Fetch all sales within the date range
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: { name: true },
        },
        member: {
          select: { name: true },
        },
        saleItems: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // --- Aggregations ---
    let totalSales = 0;
    let totalTransactions = sales.length;
    let productSalesMap = new Map(); // { productId: { name, quantitySold } }
    let dailySalesMap = new Map(); // { date: { sales, transactions } }

    sales.forEach(sale => {
      totalSales += sale.totalAmount;

      // Aggregate product sales
      sale.saleItems.forEach(item => {
        const productId = item.productId;
        const productName = item.product.name;
        const quantity = item.quantity;

        if (productSalesMap.has(productId)) {
          productSalesMap.get(productId).quantitySold += quantity;
        } else {
          productSalesMap.set(productId, { name: productName, quantitySold: quantity });
        }
      });

      // Aggregate daily sales
      const saleDate = new Date(sale.createdAt).toISOString().split('T')[0]; // YYYY-MM-DD
      if (dailySalesMap.has(saleDate)) {
        dailySalesMap.get(saleDate).sales += sale.totalAmount;
        dailySalesMap.get(saleDate).transactions += 1;
      } else {
        dailySalesMap.set(saleDate, { sales: sale.totalAmount, transactions: 1 });
      }
    });

    const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Format product sales for Pie Chart
    const productSalesData = Array.from(productSalesMap.values())
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5) // Top 5 products
      .map(item => ({ name: item.name, value: item.quantitySold }));

    // Format daily sales for Bar Chart (ensure all days in range are present)
    const formattedDailySalesData = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const data = dailySalesMap.get(dateString) || { sales: 0, transactions: 0 };
      formattedDailySalesData.push({
        name: currentDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }), // e.g., "01 Nov"
        sales: data.sales,
        transactions: data.transactions,
        fullDate: dateString,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Recent transactions (last 5 sales)
    const recentTransactions = sales.slice(0, 5).map(sale => ({
      id: sale.id,
      cashierName: sale.user?.name || 'N/A',
      date: sale.createdAt,
      totalAmount: sale.totalAmount,
      paymentMethod: sale.paymentMethod || 'N/A', // Assuming paymentMethod exists on Sale model
    }));


    return NextResponse.json({
      totalSales,
      totalTransactions,
      averageTransaction,
      dailySalesData: formattedDailySalesData,
      productSalesData,
      recentTransactions,
    });

  } catch (error) {
    console.error('Error fetching report data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report data' }, 
      { status: 500 }
    );
  }
}
