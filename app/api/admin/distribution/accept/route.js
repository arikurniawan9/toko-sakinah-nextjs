import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES, WAREHOUSE_STORE_ID } from '@/lib/constants';
import { logAudit, AUDIT_ACTIONS } from '@/lib/auditLogger';

// PUT: Accept warehouse distribution by store admin
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
    const { date, distributedByUserId, storeId, reason } = body; // Expect batch identifiers

    if (!date || !distributedByUserId || !storeId) {
      return NextResponse.json({ error: 'Batch identification parameters (date, distributedByUserId, storeId) are required' }, { status: 400 });
    }

    // Ensure the requested storeId matches the user's storeId for authorization
    if (storeId !== session.user.storeId) {
      return NextResponse.json({ error: 'Forbidden: Cannot accept distributions for other stores' }, { status: 403 });
    }

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Find all pending distributions for this batch
    const distributionsToAccept = await prisma.warehouseDistribution.findMany({
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
          include: {
            supplier: true,
            category: true,
          }
        },
      }
    });

    if (distributionsToAccept.length === 0) {
      return NextResponse.json({ error: 'Distribution batch not found or already processed' }, { status: 404 });
    }

    // Use transaction to ensure atomicity for all distributions in the batch
    const updatedDistributions = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const distribution of distributionsToAccept) {
        // Update distribution status to ACCEPTED
        const updatedDist = await tx.warehouseDistribution.update({
          where: { id: distribution.id },
          data: {
            status: 'ACCEPTED',
            notes: reason ? `${distribution.notes || ''} | Accepted with reason: ${reason}` : distribution.notes,
            updatedAt: new Date(),
          },
        });

        // First, ensure the supplier exists in the target store (create if doesn't exist)
        const supplierInStore = await tx.supplier.findFirst({
          where: {
            code: distribution.product.supplier.code, // Use supplier code to identify
            storeId: session.user.storeId
          }
        });

        let targetSupplierId = supplierInStore?.id;
        if (!supplierInStore) {
          // Create the supplier in the target store
          const newSupplier = await tx.supplier.create({
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
        await tx.purchase.create({
          data: {
            storeId: session.user.storeId,
            supplierId: targetSupplierId,
            userId: session.user.id,
            purchaseDate: new Date(distribution.distributedAt),
            totalAmount: distribution.totalAmount,
            status: 'COMPLETED',
            items: {
              create: {
                storeId: session.user.storeId,
                productId: distribution.productId,
                quantity: distribution.quantity,
                purchasePrice: distribution.unitPrice,
                subtotal: distribution.totalAmount,
              }
            }
          },
        });

        // First, ensure the category exists in the target store (create if doesn't exist)
        const categoryInStore = await tx.category.findFirst({
          where: {
            name: distribution.product.category.name, // Use category name to identify
            storeId: session.user.storeId
          }
        });

        let targetCategoryId = categoryInStore?.id;
        if (!categoryInStore) {
          // Create the category in the target store
          const newCategory = await tx.category.create({
            data: {
              storeId: session.user.storeId,
              name: distribution.product.category.name,
              description: distribution.product.category.description,
            }
          });
          targetCategoryId = newCategory.id;
        } else {
          targetCategoryId = categoryInStore.id;
        }

        // Update product stock in the store using upsert to handle cases where product doesn't exist yet
        await tx.product.upsert({
          where: {
            productCode_storeId: {
              productCode: distribution.product.productCode,
              storeId: session.user.storeId
            }
          },
          update: {
            stock: {
              increment: distribution.quantity
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
            stock: distribution.quantity, // Set initial stock to the distributed quantity
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
        results.push(updatedDist);
      }
      return results;
    });

    // Log audit for the accepted batch
    const requestHeaders = new Headers(request.headers);
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
    const userAgent = requestHeaders.get('user-agent') || '';

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.WAREHOUSE_DISTRIBUTION_UPDATE,
      entity: 'WarehouseDistributionBatch', // New entity type for batch
      recordId: `${date}-${distributedByUserId}-${storeId}`, // Use batch ID as recordId
      newValue: { status: 'ACCEPTED', totalItemsAccepted: updatedDistributions.length, reason: reason },
      storeId: session.user.storeId,
      ipAddress,
      userAgent,
      additionalData: { message: 'Distribution batch accepted by store admin' }
    });

    return NextResponse.json({
      success: true,
      message: 'Distribution batch accepted successfully',
      batchId: `${date}-${distributedByUserId}-${storeId}`,
      distributions: updatedDistributions
    });
  } catch (error) {
    console.error('Error accepting warehouse distribution batch:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT: Reject warehouse distribution by store admin
export async function PATCH(request) {
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
    const { date, distributedByUserId, storeId, reason } = body; // Expect batch identifiers

    if (!date || !distributedByUserId || !storeId) {
      return NextResponse.json({ error: 'Batch identification parameters (date, distributedByUserId, storeId) are required' }, { status: 400 });
    }

    // Ensure the requested storeId matches the user's storeId for authorization
    if (storeId !== session.user.storeId) {
      return NextResponse.json({ error: 'Forbidden: Cannot reject distributions for other stores' }, { status: 403 });
    }

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Find all pending distributions for this batch
    const distributionsToReject = await prisma.warehouseDistribution.findMany({
      where: {
        storeId: storeId,
        distributedBy: distributedByUserId,
        status: 'PENDING_ACCEPTANCE',
        distributedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (distributionsToReject.length === 0) {
      return NextResponse.json({ error: 'Distribution batch not found or already processed' }, { status: 404 });
    }

    // Use transaction to ensure atomicity for all distributions in the batch
    const updatedDistributions = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const distribution of distributionsToReject) {
        // Update distribution status to REJECTED
        const updatedDist = await tx.warehouseDistribution.update({
          where: { id: distribution.id },
          data: {
            status: 'REJECTED',
            notes: reason ? `${distribution.notes || ''} | Rejected with reason: ${reason}` : distribution.notes,
            updatedAt: new Date(),
          },
        });
        results.push(updatedDist);
      }
      return results;
    });

    // Log audit for the rejected batch
    const requestHeaders = new Headers(request.headers);
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
    const userAgent = requestHeaders.get('user-agent') || '';

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.WAREHOUSE_DISTRIBUTION_UPDATE,
      entity: 'WarehouseDistributionBatch', // New entity type for batch
      recordId: `${date}-${distributedByUserId}-${storeId}`, // Use batch ID as recordId
      newValue: { status: 'REJECTED', totalItemsRejected: updatedDistributions.length, reason: reason },
      storeId: session.user.storeId,
      ipAddress,
      userAgent,
      additionalData: { message: 'Distribution batch rejected by store admin', reason: reason }
    });

    return NextResponse.json({
      success: true,
      message: 'Distribution batch rejected successfully',
      batchId: `${date}-${distributedByUserId}-${storeId}`,
      distributions: updatedDistributions
    });
  } catch (error) {
    console.error('Error rejecting warehouse distribution batch:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}