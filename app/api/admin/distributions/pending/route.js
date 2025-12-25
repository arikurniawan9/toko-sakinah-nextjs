import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// GET: Get pending warehouse distributions for the store
export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has storeId
  if (!session.user.storeId) {
    return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || ''; // Get search term

    // Define base where clause for pending distributions
    const baseWhereClause = {
      storeId: session.user.storeId,
      status: 'PENDING_ACCEPTANCE',
    };

    // First, get all pending distributions to then group them
    const allPendingDistributions = await prisma.warehouseDistribution.findMany({
      where: baseWhereClause,
      include: {
        distributedByUser: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        distributedAt: 'desc',
      },
    });

    // Track sequence numbers per date for batch IDs
    const batchSequenceCounters = {};

    // Grouping in-memory for now to avoid complex Prisma groupBy with relations and date manipulation
    // This will group by date (YYYY-MM-DD) and distributedByUserId
    const groupedDistributions = allPendingDistributions.reduce((acc, dist) => {
      const dateKey = dist.distributedAt.toISOString().split('T')[0];
      const datePrefix = dateKey.replace(/-/g, ''); // Convert YYYY-MM-DD to YYYYMMDD
      const batchKey = `${dateKey}-${dist.distributedBy}`;

      if (!acc[batchKey]) {
        // Create a readable batch ID in format: DIST-YYYYMMDD-XXXXX
        const batchDate = new Date(dist.distributedAt);
        const year = batchDate.getFullYear().toString();
        const month = (batchDate.getMonth() + 1).toString().padStart(2, '0');
        const day = batchDate.getDate().toString().padStart(2, '0');
        const datePart = `${year}${month}${day}`;

        // Increment sequence counter for this date
        if (!batchSequenceCounters[datePart]) {
          batchSequenceCounters[datePart] = 1;
        } else {
          batchSequenceCounters[datePart]++;
        }

        const batchId = `DIST-${datePart}-${batchSequenceCounters[datePart].toString().padStart(5, '0')}`;

        acc[batchKey] = {
          id: batchId, // Use readable batch ID instead of composite key
          distributedAt: dist.distributedAt, // Use the actual distributedAt of the first item
          distributedByUserId: dist.distributedBy,
          distributedByUserName: dist.distributedByUser?.name || 'N/A',
          storeId: dist.storeId, // Add storeId to the batch object
          totalQuantity: 0,
          totalAmount: 0,
          itemCount: 0,
          originalDistributions: [], // Keep original for potential later use if needed
        };
      }

      acc[batchKey].totalQuantity += dist.quantity;
      acc[batchKey].totalAmount += dist.totalAmount;
      acc[batchKey].itemCount += 1;
      acc[batchKey].originalDistributions.push(dist); // Store original distributions for batch
      return acc;
    }, {});

    let batches = Object.values(groupedDistributions);

    // Apply search filter to the grouped batches
    if (search) {
      const lowerCaseSearch = search.toLowerCase();
      batches = batches.filter(batch => 
        batch.distributedByUserName.toLowerCase().includes(lowerCaseSearch) ||
        new Date(batch.distributedAt).toLocaleDateString('id-ID').toLowerCase().includes(lowerCaseSearch)
      );
    }

    // Sort the final grouped batches by distributedAt (descending)
    batches.sort((a, b) => new Date(b.distributedAt).getTime() - new Date(a.distributedAt).getTime());

    const totalBatches = batches.length;
    const offset = (page - 1) * limit; // Reintroduce offset calculation
    const paginatedBatches = batches.slice(offset, offset + limit);
    const totalPages = Math.ceil(totalBatches / limit);

    return NextResponse.json({
      distributions: paginatedBatches, // Renamed key to match frontend expectation
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        total: totalBatches,
        itemsPerPage: limit,
        startIndex: offset + 1,
        endIndex: Math.min(offset + limit, totalBatches)
      }
    });
  } catch (error) {
    console.error('Error fetching pending warehouse distributions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}