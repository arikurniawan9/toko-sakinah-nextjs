// app/api/admin/distribution/batch-accept/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import { logAudit, AUDIT_ACTIONS } from '@/lib/auditLogger';

// PUT: Accept warehouse distribution batch by admin
// Accepts all distributions in the same batch (same date, same distributor, same store)
export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== ROLES.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has storeId
  if (!session.user.storeId) {
    return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { distributionId } = body; // Accept distribution ID to identify the batch

    if (!distributionId) {
      return NextResponse.json({ error: 'Distribution ID is required to identify the batch' }, { status: 400 });
    }

    // First, get the reference distribution to get the batch criteria (date, store, distributor)
    const referenceDistribution = await prisma.warehouseDistribution.findUnique({
      where: {
        id: distributionId,
        storeId: session.user.storeId, // Ensure it's from the user's store
      },
      include: {
        product: {
          include: {
            supplier: true,
            category: true,
          }
        },
      }
    });

    if (!referenceDistribution) {
      return NextResponse.json({ error: 'Reference distribution not found' }, { status: 404 });
    }

    // Get all distributions that belong to the same distribution batch/group
    // Based on the same invoice number
    // This ensures we only get distributions that were created together as a batch
    const distributionsToAccept = await prisma.warehouseDistribution.findMany({
      where: {
        storeId: referenceDistribution.storeId,
        invoiceNumber: referenceDistribution.invoiceNumber, // Group by invoice number
        status: 'PENDING_ACCEPTANCE',
      },
      include: {
        product: {
          include: {
            supplier: true,
            category: true,
          }
        },
      }
    });

    if (distributionsToAccept.length === 0) {
      return NextResponse.json({ error: 'No pending distributions found in this batch' }, { status: 404 });
    }

    // Group distributions by product code to handle duplicate products in the same batch
    const groupedDistributions = {};
    for (const distribution of distributionsToAccept) {
      const productCode = distribution.product.productCode;
      if (!groupedDistributions[productCode]) {
        groupedDistributions[productCode] = {
          ...distribution,
          totalQuantity: 0,
          totalAmount: 0,
          individualDistributions: [] // Keep track of individual distributions for updating their status
        };
      }

      groupedDistributions[productCode].totalQuantity += distribution.quantity;
      groupedDistributions[productCode].totalAmount += distribution.totalAmount;
      groupedDistributions[productCode].individualDistributions.push(distribution);
    }

    // Update distribution status in a separate transaction (this is the critical part that must be atomic)
    const updatedDistributions = await prisma.$transaction(async (tx) => {
      const results = [];

      // Process each unique product in the batch
      for (const productCode in groupedDistributions) {
        const groupedDist = groupedDistributions[productCode];

        // Update distribution status for all individual distributions of this product
        for (const individualDist of groupedDist.individualDistributions) {
          const updatedDist = await tx.warehouseDistribution.update({
            where: { id: individualDist.id },
            data: {
              status: 'ACCEPTED',
              notes: individualDist.notes ? `${individualDist.notes} | Accepted via batch accept` : 'Accepted via batch accept',
              updatedAt: new Date(),
            },
          });
          results.push(updatedDist);
        }
      }
      return results;
    }, {
      timeout: 10000, // 10 seconds for the critical status update
    });

    // Process the remaining operations outside the main transaction
    // These operations are important but not as critical for atomicity as status updates
    for (const productCode in groupedDistributions) {
      const groupedDist = groupedDistributions[productCode];
      const distribution = groupedDist.individualDistributions[0]; // Use the first distribution as reference

      // First, ensure the supplier exists in the target store (create if doesn't exist)
      const supplierInStore = await prisma.supplier.findFirst({
        where: {
          code: distribution.product.supplier.code, // Use supplier code to identify
          storeId: session.user.storeId
        }
      });

      let targetSupplierId = supplierInStore?.id;
      if (!supplierInStore) {
        // Create the supplier in the target store
        const newSupplier = await prisma.supplier.create({
          data: {
            storeId: session.user.storeId,
            code: distribution.product.supplier.code,
            name: distribution.product.supplier.name,
            contactPerson: distribution.product.supplier.contactPerson,
            address: distribution.product.supplier.address,
            phone: distribution.product.supplier.phone,
            email: distribution.product.supplier.email,
          }
        });
        targetSupplierId = newSupplier.id;
      } else {
        targetSupplierId = supplierInStore.id;
      }

      // Create a purchase record for the store to represent this accepted product in the batch
      await prisma.purchase.create({
        data: {
          storeId: session.user.storeId,
          supplierId: targetSupplierId,
          userId: session.user.id,
          purchaseDate: new Date(distribution.distributedAt),
          totalAmount: groupedDist.totalAmount, // Use total amount for all items of this product
          status: 'COMPLETED',
          items: {
            create: {
              storeId: session.user.storeId,
              productId: distribution.productId,
              quantity: groupedDist.totalQuantity, // Use total quantity for all items of this product
              purchasePrice: distribution.unitPrice,
              subtotal: groupedDist.totalAmount,
            }
          }
        },
      });

      // First, ensure the category exists in the target store (create if doesn't exist)
      const categoryInStore = await prisma.category.findFirst({
        where: {
          name: distribution.product.category.name, // Use category name to identify
          storeId: session.user.storeId
        }
      });

      let targetCategoryId = categoryInStore?.id;
      if (!categoryInStore) {
        // Create the category in the target store
        const newCategory = await prisma.category.create({
          data: {
            storeId: session.user.storeId,
            name: distribution.product.category.name,
            description: distribution.product.category.description,
            icon: distribution.product.category.icon, // Also copy the icon
          }
        });
        targetCategoryId = newCategory.id;
      } else {
        targetCategoryId = categoryInStore.id;
      }

      // Update product stock in the store using upsert to handle cases where product doesn't exist yet
      // Use the total quantity for all items of this product in the batch
      await prisma.product.upsert({
        where: {
          productCode_storeId: {
            productCode: distribution.product.productCode,
            storeId: session.user.storeId
          }
        },
        update: {
          stock: {
            increment: groupedDist.totalQuantity // Use total quantity for all items of this product
          },
          // Update other product fields if needed
          name: distribution.product.name,
          description: distribution.product.description,
          purchasePrice: distribution.product.purchasePrice,
          retailPrice: distribution.product.retailPrice,
          silverPrice: distribution.product.silverPrice,
          goldPrice: distribution.product.goldPrice,
          platinumPrice: distribution.product.platinumPrice,
          categoryId: targetCategoryId,
          supplierId: targetSupplierId,
        },
        create: {
          // Create new product record for this store
          // Use the productCode and storeId as the unique identifier instead of sharing IDs
          storeId: session.user.storeId,
          categoryId: targetCategoryId,
          name: distribution.product.name,
          productCode: distribution.product.productCode,
          stock: groupedDist.totalQuantity, // Set initial stock to the total distributed quantity for this product
          purchasePrice: distribution.product.purchasePrice,
          retailPrice: distribution.product.retailPrice,
          silverPrice: distribution.product.silverPrice,
          goldPrice: distribution.product.goldPrice,
          platinumPrice: distribution.product.platinumPrice,
          supplierId: targetSupplierId,
          description: distribution.product.description,
          image: distribution.product.image,
        }
      });
    }

    // Ambil IP address dan user agent dari request
    const requestHeaders = new Headers(request.headers);
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
    const userAgent = requestHeaders.get('user-agent') || '';

    // Log audit for the accepted batch setelah transaksi selesai
    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.WAREHOUSE_DISTRIBUTION_UPDATE,
      entity: 'WarehouseDistributionBatch',
      recordId: `${new Date(referenceDistribution.distributedAt).toISOString().split('T')[0]}-${referenceDistribution.distributedBy}-${referenceDistribution.storeId}`,
      newValue: { status: 'ACCEPTED', totalItemsAccepted: updatedDistributions.length, reason: 'Batch accept from detail modal' },
      storeId: session.user.storeId,
      ipAddress,
      userAgent,
      additionalData: { message: 'Distribution batch accepted by store admin via detail modal' }
    });

    return NextResponse.json({
      success: true,
      message: `${updatedDistributions.length} distribution(s) in the batch accepted successfully`,
      batchId: `${new Date(referenceDistribution.distributedAt).toISOString().split('T')[0]}-${referenceDistribution.distributedBy}`,
      distributions: updatedDistributions
    });
  } catch (error) {
    console.error('Error accepting warehouse distribution batch:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}