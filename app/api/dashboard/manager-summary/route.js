// app/api/dashboard/manager-summary/route.js
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

    // Ambil data statistik keseluruhan
    const totalStores = await prisma.store.count({
      where: { status: 'ACTIVE' }
    });

    const activeStores = await prisma.store.count({
      where: { status: 'ACTIVE' }
    });

    // Ambil data penjualan terbaru (dari semua toko)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalSales = await prisma.sale.count({
      where: {
        date: {
          gte: today,
        }
      }
    });

    const totalRevenue = await prisma.sale.aggregate({
      where: {
        date: {
          gte: today,
        }
      },
      _sum: {
        total: true
      }
    });

    // Ambil aktivitas terbaru (dari semua toko)
    const recentActivity = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        store: true
      }
    });

    // Ambil produk dengan stok rendah dari semua toko
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: { lte: 5 }
      },
      include: {
        store: true
      },
      take: 5
    });

    const summaryData = {
      stats: {
        totalStores,
        activeStores,
        totalSales,
        totalRevenue: totalRevenue._sum.total || 0
      },
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        storeName: activity.store.name,
        description: activity.action,
        time: activity.createdAt.toLocaleString('id-ID'),
        type: activity.entity
      })),
      lowStockProducts: lowStockProducts.map(product => ({
        id: product.id,
        name: product.name,
        stock: product.stock,
        storeName: product.store.name
      }))
    };

    return new Response(JSON.stringify(summaryData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching manager dashboard data:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}