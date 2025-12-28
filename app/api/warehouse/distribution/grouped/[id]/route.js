// app/api/warehouse/distribution/grouped/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

// GET - Get all distributions in the same batch/group as a specific distribution
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN role can access this endpoint
    if (session.user.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user has storeId
    if (!session.user.storeId) {
      return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
    }

    const { id } = params; // Distribution ID

    if (!id) {
      return NextResponse.json({ error: 'Distribution ID is required' }, { status: 400 });
    }

    // First, get the reference distribution to get the distributedAt time, storeId, and distributedBy
    const referenceDistribution = await prisma.warehouseDistribution.findUnique({
      where: {
        id: id,
        storeId: session.user.storeId, // Ensure it's from the user's store
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            productCode: true,
          }
        },
        distributedByUser: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        warehouse: {
          select: {
            id: true,
            name: true,
          }
        },
      },
    });

    if (!referenceDistribution) {
      return NextResponse.json({ error: 'Distribution not found' }, { status: 404 });
    }

    // Now get all distribution records with the same distributedAt date (same day), storeId, and distributedBy
    // This captures all items in the same distribution batch
    const startOfDay = new Date(referenceDistribution.distributedAt);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(referenceDistribution.distributedAt);
    endOfDay.setHours(23, 59, 59, 999);

    const allDistributionItems = await prisma.warehouseDistribution.findMany({
      where: {
        distributedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        storeId: referenceDistribution.storeId,
        distributedBy: referenceDistribution.distributedBy,
        status: 'PENDING_ACCEPTANCE', // Only get pending items in the same batch
      },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            productCode: true,
            purchasePrice: true,
          }
        },
        distributedByUser: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        },
      },
      orderBy: {
        product: { name: 'asc' }
      }
    });

    // Generate a consistent invoice number for this distribution batch
    const dateStr = new Date(referenceDistribution.distributedAt).toISOString().split('T')[0].replace(/-/g, '');
    const storeCode = referenceDistribution.store.code.replace(/\s+/g, '').toUpperCase();

    // Use a consistent identifier for this batch
    const batchTime = referenceDistribution.distributedAt.getTime();
    const suffix = String(batchTime % 10000).padStart(4, '0');
    const invoiceNumber = `D-${dateStr}-${storeCode}-${suffix}`;

    // Calculate totals for the batch
    const totalQuantity = allDistributionItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = allDistributionItems.reduce((sum, item) => sum + item.totalAmount, 0);

    return NextResponse.json({
      id: referenceDistribution.id, // Use the first distribution ID as the group identifier
      invoiceNumber,
      distributedAt: referenceDistribution.distributedAt,
      store: referenceDistribution.store,
      distributedByUser: referenceDistribution.distributedByUser,
      warehouse: referenceDistribution.warehouse,
      status: referenceDistribution.status,
      notes: referenceDistribution.notes,
      items: allDistributionItems,
      itemCount: allDistributionItems.length,
      totalQuantity,
      totalAmount,
    });
  } catch (error) {
    console.error('Error fetching distribution batch details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}