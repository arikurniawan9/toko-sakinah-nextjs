// app/api/monitor-all-stores/route.js
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'MANAGER') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';

    // Tentukan rentang waktu berdasarkan timeRange
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '90d':
        startDate.setMonth(now.getMonth() - 3);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Ambil semua toko
    const stores = await prisma.store.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        _count: {
          select: { sales: true }
        },
        sales: {
          where: {
            date: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
            }
          }
        }
      }
    });

    // Ambil data penjualan harian untuk semua toko
    const dailySales = await prisma.sale.groupBy({
      by: ['storeId'],
      where: {
        date: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        }
      },
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    });

    // Ambil data penjualan dalam rentang waktu
    const periodSales = await prisma.sale.groupBy({
      by: ['storeId'],
      where: {
        date: {
          gte: startDate
        }
      },
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    });

    // Ambil produk dengan stok rendah dari semua toko
    const lowStockProducts = await prisma.product.groupBy({
      by: ['storeId'],
      where: {
        stock: { lte: 5 }
      },
      _count: {
        id: true
      }
    });

    // Buat mapping dari hasil query
    const dailySalesMap = dailySales.reduce((acc, item) => {
      acc[item.storeId] = {
        sales: item._count.id,
        revenue: item._sum.total
      };
      return acc;
    }, {});

    const periodSalesMap = periodSales.reduce((acc, item) => {
      acc[item.storeId] = {
        sales: item._count.id,
        revenue: item._sum.total
      };
      return acc;
    }, {});

    const lowStockMap = lowStockProducts.reduce((acc, item) => {
      acc[item.storeId] = item._count.id;
      return acc;
    }, {});

    // Gabungkan data toko dengan statistiknya
    const storesWithStats = stores.map(store => ({
      id: store.id,
      name: store.name,
      address: store.address,
      status: store.status,
      totalSales: store._count.sales,
      dailySales: dailySalesMap[store.id]?.sales || 0,
      dailyRevenue: dailySalesMap[store.id]?.revenue || 0,
      periodSales: periodSalesMap[store.id]?.sales || 0,
      periodRevenue: periodSalesMap[store.id]?.revenue || 0,
      lowStockCount: lowStockMap[store.id] || 0
    }));

    // Ambil statistik keseluruhan
    const globalStats = {
      totalStores: stores.length,
      totalSales: stores.reduce((sum, store) => sum + store.dailySales, 0),
      totalRevenue: stores.reduce((sum, store) => sum + store.dailyRevenue, 0),
      totalActiveStores: stores.filter(store => store.status === 'ACTIVE').length
    };

    const responseData = {
      stores: storesWithStats,
      globalStats: globalStats
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching monitor all stores data:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}