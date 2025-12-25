import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import { generateDistributionInvoiceNumber } from '@/utils/invoiceNumber';

// GET - Get grouped warehouse distributions with filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const distributionId = searchParams.get('id');
    const storeId = searchParams.get('storeId'); // Filter by specific store
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Parameter untuk filtering berdasarkan tanggal
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can access warehouse distributions
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get or create the central warehouse for the query
    let centralWarehouse = await prisma.warehouse.findFirst({
      where: { name: 'Gudang Pusat' }
    });

    if (!centralWarehouse) {
      // Create the central warehouse if it doesn't exist
      centralWarehouse = await prisma.warehouse.create({
        data: {
          name: 'Gudang Pusat',
          description: 'Gudang pusat untuk distribusi ke toko-toko',
          status: 'ACTIVE'
        }
      });
    }

    // If ID is provided, return specific distribution for receipt printing
    // We need to get all distribution records for the same distribution batch
    if (distributionId) {
      // First, get the reference distribution to get the distributedAt time, storeId, etc.
      const referenceDistribution = await prisma.warehouseDistribution.findFirst({
        where: {
          id: distributionId,
          warehouseId: centralWarehouse.id, // Ensure it's from the central warehouse
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
      });

      if (!referenceDistribution) {
        return NextResponse.json({ error: 'Distribusi tidak ditemukan' }, { status: 404 });
      }

      // Now get all distribution records with the same distributedAt, storeId, and warehouseId
      // This captures all items in the same distribution batch
      const allDistributionItems = await prisma.warehouseDistribution.findMany({
        where: {
          distributedAt: referenceDistribution.distributedAt,
          storeId: referenceDistribution.storeId,
          warehouseId: referenceDistribution.warehouseId,
          distributedBy: referenceDistribution.distributedBy,
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

      // Return the first record as the main reference but with all items
      return NextResponse.json({
        ...referenceDistribution,
        items: allDistributionItems
      });
    }

    // Otherwise, return grouped list of distributions with pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Parameter pagination tidak valid' }, { status: 400 });
    }

    // Get query parameters for additional filtering
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const offset = (page - 1) * limit;

    // Build the date filter separately
    const dateFilter = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Membangun klausa where untuk filtering
    const whereClause = {
      warehouseId: centralWarehouse.id, // Hanya distribusi dari gudang pusat
      ...(storeId && { storeId }), // Filter berdasarkan toko jika disediakan
      ...(status && { status }), // Filter berdasarkan status jika disediakan
      ...(search && {
        OR: [
          {
            product: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            store: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            store: {
              code: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        ],
      }),
      ...(Object.keys(dateFilter).length > 0 && { distributedAt: dateFilter }),
    };

    // Get all distributions matching the criteria
    const allDistributions = await prisma.warehouseDistribution.findMany({
      where: whereClause,
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
        distributedAt: 'desc',
      },
    });

    // Group distributions by distributedAt, storeId, and distributedBy
    const groupedDistributions = [];
    const distributionMap = new Map();

    allDistributions.forEach(distribution => {
      const key = `${distribution.distributedAt.getTime()}-${distribution.storeId}-${distribution.distributedBy}`;

      if (!distributionMap.has(key)) {
        // Generate a consistent invoice number for this distribution batch
        const dateStr = new Date(distribution.distributedAt).toISOString().split('T')[0].replace(/-/g, '');
        // Use store name, take first 3 characters and make uppercase
        const storeNameCode = distribution.store.name.substring(0, 3).replace(/\s+/g, '').toUpperCase();
        const userCode = distribution.distributedByUser.username.substring(0, 3) || distribution.distributedBy.substring(0, 3);

        // Create a unique but consistent identifier
        const invoiceNumber = `DIST-${dateStr}-${storeNameCode}-${userCode.toUpperCase()}`;

        distributionMap.set(key, {
          id: distribution.id, // Use the first distribution ID as the group ID
          invoiceNumber, // Add the invoice number
          distributedAt: distribution.distributedAt,
          storeId: distribution.storeId,
          store: distribution.store,
          distributedBy: distribution.distributedBy,
          distributedByUser: distribution.distributedByUser,
          warehouseId: distribution.warehouseId,
          warehouse: distribution.warehouse,
          status: distribution.status,
          notes: distribution.notes,
          items: [],
          totalItems: 0,
          totalAmount: 0
        });
      }

      const group = distributionMap.get(key);
      group.items.push(distribution);
      group.totalItems += distribution.quantity;
      group.totalAmount += distribution.totalAmount;
    });

    // Convert map to array and sort by distributedAt descending
    groupedDistributions.push(...distributionMap.values());
    groupedDistributions.sort((a, b) => b.distributedAt - a.distributedAt);

    // Apply pagination
    const startIndex = offset;
    const endIndex = Math.min(startIndex + limit, groupedDistributions.length);
    const paginatedDistributions = groupedDistributions.slice(startIndex, endIndex);

    const totalCount = groupedDistributions.length;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      distributions: paginatedDistributions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching grouped warehouse distributions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}