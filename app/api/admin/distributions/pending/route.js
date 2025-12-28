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

    // Instead of grouping distributions, return each distribution individually
    // This will ensure each distribution appears as a separate entry
    const individualDistributions = allPendingDistributions.map((dist, index) => {
      return {
        id: dist.id, // Use the original distribution ID from the database
        distributionId: dist.id, // Original distribution ID (same as id)
        distributedAt: dist.distributedAt,
        distributedByUserId: dist.distributedBy,
        distributedByUserName: dist.distributedByUser?.name || 'N/A',
        storeId: dist.storeId,
        quantity: dist.quantity, // Individual quantity
        unitPrice: dist.unitPrice, // Individual unit price
        totalAmount: dist.totalAmount, // Individual total amount
        productId: dist.productId, // Individual product ID
        productName: dist.product?.name || 'N/A', // Individual product name
        productCode: dist.product?.productCode || 'N/A', // Individual product code
        originalDistribution: dist, // Store original distribution data
      };
    });

    let distributions = individualDistributions;

    // Apply search filter to the individual distributions
    if (search) {
      const lowerCaseSearch = search.toLowerCase();
      distributions = distributions.filter(dist =>
        dist.distributedByUserName.toLowerCase().includes(lowerCaseSearch) ||
        new Date(dist.distributedAt).toLocaleDateString('id-ID').toLowerCase().includes(lowerCaseSearch)
      );
    }

    // Sort the final individual distributions by distributedAt (descending)
    distributions.sort((a, b) => new Date(b.distributedAt).getTime() - new Date(a.distributedAt).getTime());

    const totalDistributions = distributions.length;
    const offset = (page - 1) * limit; // Reintroduce offset calculation
    const paginatedDistributions = distributions.slice(offset, offset + limit);
    const totalPages = Math.ceil(totalDistributions / limit);

    return NextResponse.json({
      distributions: paginatedDistributions, // Return individual distributions
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        total: totalDistributions,
        itemsPerPage: limit,
        startIndex: offset + 1,
        endIndex: Math.min(offset + limit, totalDistributions)
      }
    });
  } catch (error) {
    console.error('Error fetching pending warehouse distributions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}