export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES, WAREHOUSE_STORE_ID } from '@/lib/constants';
import { getTenantPrismaClient } from '@/utils/tenantUtils';

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

    const stores = await globalPrisma.store.findMany({
      where: {
        id: {
          not: WAREHOUSE_STORE_ID, // Exclude the warehouse store from store monitoring
        },
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    const storeSummaries = await Promise.all(stores.map(async (store) => {
      // Use getTenantPrismaClient for store-specific data
      const prisma = getTenantPrismaClient(store.id);

      const totalSalesResult = await prisma.sale.aggregate({
        _sum: {
          total: true,
        },
        where: { storeId: store.id },
      });
      const totalSales = totalSalesResult._sum.total || 0;

      const totalTransactions = await prisma.sale.count({
        where: { storeId: store.id },
      });

      const activeEmployees = await prisma.storeUser.count({
        where: {
          storeId: store.id,
          status: 'ACTIVE',
          role: {
            not: ROLES.MANAGER, // Manager is global, not an employee of a specific store
          },
        },
      });

      const lowStockProducts = await prisma.product.count({
        where: {
          storeId: store.id,
          stock: {
            lte: 10, // Define low stock threshold as <= 10
          },
        },
      });

      return {
        id: store.id,
        name: store.name,
        status: store.status,
        totalSales,
        totalTransactions,
        activeEmployees,
        lowStockProducts,
      };
    }));

    return NextResponse.json({ storeSummaries });
  } catch (error) {
    console.error('Error fetching store summaries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
