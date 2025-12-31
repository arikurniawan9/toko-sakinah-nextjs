import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import { logWarehouseDistribution } from '@/lib/auditLogger';
import { notificationManager, NOTIFICATION_TYPES, SEVERITY_LEVELS } from '@/lib/notificationManager';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can create warehouse distributions
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { storeId, distributionDate, items, distributedBy, status: distributionStatus } = body;

    if (!storeId || !distributionDate || !items || items.length === 0) {
      return NextResponse.json({ error: 'Data distribusi tidak lengkap' }, { status: 400 });
    }

    // Ensure the target store exists
    const targetStore = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!targetStore) {
      return NextResponse.json({ error: 'Toko tujuan tidak ditemukan' }, { status: 404 });
    }

    // Get or create the central warehouse
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

    // Use a transaction to ensure atomicity with the maximum allowed timeout for Accelerate
    const newDistribution = await prisma.$transaction(async (tx) => {
      let calculatedTotalAmount = 0;

      // First, check stock and calculate total amount - do this in parallel
      const warehouseProducts = await Promise.all(
        items.map(async (item) => {
          const warehouseProduct = await tx.warehouseProduct.findUnique({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: centralWarehouse.id,
              },
            },
            include: {
              Product: true // Include the actual product to get purchase price
            }
          });

          if (!warehouseProduct) {
            throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan di gudang`);
          }

          if (warehouseProduct.quantity < item.quantity) {
            throw new Error(`Stok produk ${warehouseProduct.Product.name} tidak mencukupi di gudang. Tersedia: ${warehouseProduct.quantity}, Diminta: ${item.quantity}`);
          }

          return {
            ...warehouseProduct,
            requestedQuantity: item.quantity,
            requestedPrice: item.purchasePrice
          };
        })
      );

      // Calculate total amount
      for (const wp of warehouseProducts) {
        calculatedTotalAmount += wp.requestedQuantity * (wp.requestedPrice || wp.Product.purchasePrice);
      }

      // Generate invoice number for this distribution batch using store code
      const dateStr = new Date(distributionDate).toISOString().split('T')[0].replace(/-/g, '');
      const storeCode = targetStore.code.replace(/\s+/g, '').toUpperCase();
      const timestamp = new Date(distributionDate).getTime().toString().slice(-4); // Use last 4 digits of timestamp
      const invoiceNumber = `D-${dateStr}-${storeCode}-${timestamp}`;

      // Prepare all warehouse stock updates and distribution records
      const stockUpdates = warehouseProducts.map(wp =>
        tx.warehouseProduct.update({
          where: {
            productId_warehouseId: {
              productId: wp.productId,
              warehouseId: centralWarehouse.id,
            },
          },
          data: {
            quantity: {
              decrement: wp.requestedQuantity,
            },
          },
        })
      );

      const distributionRecords = warehouseProducts.map(wp =>
        tx.warehouseDistribution.create({
          data: {
            warehouseId: centralWarehouse.id, // Central warehouse
            storeId,
            productId: wp.productId,
            quantity: wp.requestedQuantity,
            unitPrice: wp.requestedPrice || wp.Product.purchasePrice, // Use provided price or product's purchase price
            totalAmount: wp.requestedQuantity * (wp.requestedPrice || wp.Product.purchasePrice),
            status: distributionStatus || 'PENDING_ACCEPTANCE',
            notes: body.notes || null,
            distributedAt: new Date(distributionDate),
            distributedBy,
            invoiceNumber: invoiceNumber, // <-- SAVING TO DATABASE
          },
        })
      );

      // Execute all operations in parallel
      await Promise.all([...stockUpdates, ...distributionRecords]);

      // Get the created distribution records
      const createdDistributions = await Promise.all(distributionRecords);

      // Return the first distribution record with invoice number
      return {
        ...createdDistributions[0],
        totalAmount: calculatedTotalAmount, // Include the calculated total amount in the response
        invoiceNumber: invoiceNumber // Ensure invoice number is included in the returned object
      };
    }, {
      timeout: 15000, // 15 seconds timeout - maximum for Accelerate
    });

    // Ambil data distribusi lengkap setelah transaksi selesai untuk memastikan informasi produk tersedia
    const completeDistribution = await prisma.warehouseDistribution.findFirst({
      where: {
        invoiceNumber: newDistribution.invoiceNumber,
        storeId: storeId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            productCode: true,
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            code: true,
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
            id: true,
            name: true,
          }
        }
      }
    });

    // Ambil IP address dan user agent dari request
    const requestHeaders = new Headers(request.headers);
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
    const userAgent = requestHeaders.get('user-agent') || '';

    // Log aktivitas distribusi gudang setelah transaksi selesai
    await logWarehouseDistribution(
      session.user.id,
      completeDistribution,
      ipAddress,
      userAgent,
      storeId // log ke store tujuan
    );

    // Jika status distribusi adalah PENDING_ACCEPTANCE, buat notifikasi
    if (completeDistribution.status === 'PENDING_ACCEPTANCE') {
      await notificationManager.createNotification({
        type: NOTIFICATION_TYPES.WAREHOUSE_DISTRIBUTION_PENDING,
        title: `Distribusi Gudang Tertunda ke ${targetStore.name}`,
        message: `Produk '${completeDistribution.product?.name || 'N/A'}' sejumlah ${completeDistribution.quantity} unit siap didistribusikan ke toko '${targetStore.name}'. Menunggu konfirmasi.`,
        storeId: storeId, // Notifikasi untuk toko tujuan
        userId: null, // Notifikasi bersifat umum untuk admin toko
        severity: SEVERITY_LEVELS.MEDIUM,
        data: {
          distributionId: completeDistribution.id,
          productId: completeDistribution.productId,
          productName: completeDistribution.product?.name || 'N/A',
          storeName: targetStore.name,
          quantity: completeDistribution.quantity,
        },
      });
    }

    return NextResponse.json({
      success: true,
      distribution: completeDistribution,
      message: 'Distribusi produk berhasil disimpan dan stok diperbarui',
    });
  } catch (error) {
    console.error('Error creating warehouse distribution:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// GET - Get warehouse distributions with filtering or get specific distribution by ID
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
    // The current implementation creates individual records for each product
    // So we'll find all records with the same distributedAt time, storeId, and warehouseId
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

      // Generate a consistent invoice number for this distribution batch
      // based on the distribution date and store code
      const dateStr = new Date(referenceDistribution.distributedAt).toISOString().split('T')[0].replace(/-/g, '');
      // Use store code for invoice number
      const storeCode = referenceDistribution.store.code.replace(/\s+/g, '').toUpperCase();

      // Create a unique identifier using date, store code, and a timestamp for uniqueness
      const timestamp = referenceDistribution.distributedAt.getTime().toString().slice(-4); // Use last 4 digits of timestamp
      const invoiceNumber = `D-${dateStr}-${storeCode}-${timestamp}`;

      // Return the first record as the main reference but with all items and invoice number
      return NextResponse.json({
        ...referenceDistribution,
        invoiceNumber,
        items: allDistributionItems.map(item => ({
          ...item,
          invoiceNumber // Add invoice number to each item as well
        }))
      });
    }

    // Otherwise, return list of distributions with pagination
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

    const [distributions, totalCount] = await Promise.all([
      prisma.warehouseDistribution.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
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
      }),
      prisma.warehouseDistribution.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      distributions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching warehouse distributions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
