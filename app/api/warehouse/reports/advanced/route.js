
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

async function getInventoryReport(startDate, endDate) {
  const warehouseProducts = await prisma.warehouseProduct.findMany({
    include: {
      Product: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      quantity: 'desc',
    },
    take: 10, // Limit to top 10 for performance
  });

  return warehouseProducts.map(wp => ({
    name: wp.Product.name,
    currentStock: wp.quantity,
    minStock: 0, // Not available in schema
    maxStock: wp.quantity + 50, // Placeholder
  }));
}

async function getDistributionReport(startDate, endDate) {
  const distributions = await prisma.warehouseDistribution.groupBy({
    by: ['distributedAt'],
    _sum: {
      quantity: true,
    },
    where: {
      distributedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      distributedAt: 'asc',
    },
  });

  const purchases = await prisma.purchase.groupBy({
    by: ['purchaseDate'],
    _sum: {
      totalAmount: true, // Assuming totalAmount can represent received value, or use a count
    },
     where: {
      purchaseDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      purchaseDate: 'asc',
    },
  });

  //  Combine and format the data for the chart
  const reportData = {};

  distributions.forEach(d => {
    const date = d.distributedAt.toISOString().split('T')[0];
    if (!reportData[date]) {
      reportData[date] = { date, distributed: 0, received: 0 };
    }
    reportData[date].distributed += d._sum.quantity || 0;
  });

  purchases.forEach(p => {
    const date = p.purchaseDate.toISOString().split('T')[0];
    if (!reportData[date]) {
      reportData[date] = { date, distributed: 0, received: 0 };
    }
    //  This is not a 1:1 comparison, quantity vs amount, but it's for demonstration
    reportData[date].received += p._sum.totalAmount || 0;
  });

  return Object.values(reportData).sort((a, b) => new Date(a.date) - new Date(b.date));
}

async function getSupplierReport(startDate, endDate) {
    const suppliers = await prisma.supplier.findMany({
        include: {
            _count: {
                select: {
                    purchases: {
                        where: {
                            purchaseDate: {
                                gte: startDate,
                                lte: endDate,
                            },
                        },
                    },
                },
            },
        },
    });

    return suppliers.map(s => ({
        name: s.name,
        totalOrders: s._count.purchases,
        //  Mock data for fields not in the schema
        onTimeDeliveries: Math.floor(Math.random() * (98 - 85 + 1)) + 85, // Random % between 85-98
        qualityRating: (Math.random() * (4.9 - 4.0) + 4.0).toFixed(1), // Random rating between 4.0-4.9
    }));
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== ROLES.WAREHOUSE) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const reportType = searchParams.get('type');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!reportType || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    let data;
    switch (reportType) {
      case 'inventory':
        data = await getInventoryReport(new Date(startDate), new Date(endDate));
        break;
      case 'distribution':
        data = await getDistributionReport(new Date(startDate), new Date(endDate));
        break;
      case 'supplier':
        data = await getSupplierReport(new Date(startDate), new Date(endDate));
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching ${reportType} report:`, error);
    return NextResponse.json({ error: 'Failed to fetch report data.' }, { status: 500 });
  }
}
