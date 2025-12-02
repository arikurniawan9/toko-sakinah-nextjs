export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can access warehouse stats
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch total unique products in warehouse
    const totalUniqueProductsInWarehouse = await globalPrisma.warehouseProduct.count({
      distinct: ['productId'],
    });

    // Fetch total quantity of all products in warehouse
    const totalQuantityInWarehouse = await globalPrisma.warehouseProduct.aggregate({
        _sum: {
            quantity: true,
        },
    });

    // Fetch total stores that have received distributions
    const totalStoresLinked = await globalPrisma.warehouseDistribution.count({
        distinct: ['storeId'],
    });

    // Fetch pending distributions
    const pendingDistributions = await globalPrisma.warehouseDistribution.count({
        where: {
            status: {
                notIn: ['DELIVERED', 'CANCELLED'],
            },
        },
    });

    // Fetch low stock items in warehouse
    const lowStockItems = await globalPrisma.warehouseProduct.count({
        where: {
            quantity: {
                lte: 10, // Define low stock threshold as <= 10
            },
        },
    });

    // Fetch total distributed quantity
    const totalDistributedResult = await globalPrisma.warehouseDistribution.aggregate({
        _sum: {
            quantity: true,
        },
        where: {
            status: 'DELIVERED', // Only count successfully delivered items
        },
    });
    const totalDistributed = totalDistributedResult._sum.quantity || 0;

    return NextResponse.json({
      totalUniqueProductsInWarehouse: totalUniqueProductsInWarehouse || 0,
      totalQuantityInWarehouse: totalQuantityInWarehouse._sum.quantity || 0,
      totalStoresLinked: totalStoresLinked || 0,
      pendingDistributions: pendingDistributions || 0,
      lowStockItems: lowStockItems || 0,
      totalDistributed: totalDistributed || 0,
    });
  } catch (error) {
    console.error('Error fetching warehouse stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
