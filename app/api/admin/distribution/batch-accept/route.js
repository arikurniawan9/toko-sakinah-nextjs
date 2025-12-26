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
    // Based on the same distributedAt time, storeId, and distributedBy
    // This ensures we only get distributions that were created together as a batch
    const distributionsToAccept = await prisma.warehouseDistribution.findMany({
      where: {
        storeId: referenceDistribution.storeId,
        distributedBy: referenceDistribution.distributedBy,
        distributedAt: referenceDistribution.distributedAt, // Exact same time to ensure it's the same batch
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

    // Use transaction to ensure atomicity for all distributions in the batch
    const updatedDistributions = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const distribution of distributionsToAccept) {
        // Update distribution status to ACCEPTED
        const updatedDist = await tx.warehouseDistribution.update({
          where: { id: distribution.id },
          data: {
            status: 'ACCEPTED',
            notes: distribution.notes ? `${distribution.notes} | Accepted via batch accept` : 'Accepted via batch accept',
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