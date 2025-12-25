import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

// GET: Get individual items for a specific distribution batch
export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== ROLES.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has storeId
  if (!session.user.storeId) {
    return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // YYYY-MM-DD format
    const distributedByUserId = searchParams.get('distributedByUserId');
    const storeId = searchParams.get('storeId');

    if (!date || !distributedByUserId || !storeId) {
      return NextResponse.json({ error: 'Missing batch identification parameters (date, distributedByUserId, storeId)' }, { status: 400 });
    }

    // Ensure the requested storeId matches the user's storeId for authorization
    if (storeId !== session.user.storeId) {
      return NextResponse.json({ error: 'Forbidden: Cannot access distributions for other stores' }, { status: 403 });
    }

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0); // Set to start of the day in UTC
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999); // Set to end of the day in UTC

    const batchItems = await prisma.warehouseDistribution.findMany({
      where: {
        storeId: storeId,
        distributedBy: distributedByUserId,
        status: 'PENDING_ACCEPTANCE',
        distributedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            productCode: true,
            retailPrice: true,
            purchasePrice: true,
            silverPrice: true,
            goldPrice: true,
            platinumPrice: true,
            image: true,
          }
        },
        distributedByUser: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        },
        warehouse: {
          select: {
            name: true,
          }
        },
        store: {
          select: {
            name: true,
          }
        },
      },
      orderBy: {
        product: { name: 'asc' },
      },
    });

    if (batchItems.length === 0) {
      return NextResponse.json({ error: 'Distribution batch not found or already processed' }, { status: 404 });
    }

    // Create a readable batch ID in format: DIST-YYYYMMDD-XXXXX
    // For consistency, we'll use the first distribution item's timestamp to generate a deterministic ID
    const batchDate = new Date(batchItems[0].distributedAt);
    const year = batchDate.getFullYear().toString();
    const month = (batchDate.getMonth() + 1).toString().padStart(2, '0');
    const day = batchDate.getDate().toString().padStart(2, '0');
    const datePart = `${year}${month}${day}`;

    // Use a hash of the distributedByUserId to generate a consistent sequence number
    let hash = 0;
    for (let i = 0; i < distributedByUserId.length; i++) {
      const char = distributedByUserId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const sequenceNum = Math.abs(hash) % 99999 + 1; // Ensure it's within 5 digits
    const batchId = `DIST-${datePart}-${sequenceNum.toString().padStart(5, '0')}`;

    // Return the batch details along with some summary info
    return NextResponse.json({
      batchId: batchId, // A readable unique identifier for this batch
      distributedAt: batchItems[0].distributedAt,
      distributedBy: batchItems[0].distributedByUser,
      storeName: batchItems[0].store.name,
      items: batchItems,
      totalItems: batchItems.length,
      totalQuantity: batchItems.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: batchItems.reduce((sum, item) => sum + item.totalAmount, 0),
    });
  } catch (error) {
    console.error('Error fetching distribution batch details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
