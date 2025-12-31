// app/api/admin/distribution/item-accept/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import { logAudit, AUDIT_ACTIONS } from '@/lib/auditLogger';

// PUT: Accept individual warehouse distribution item by admin
// Accepts a single distribution item (one product) while leaving others in the batch pending
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
    const { distributionId } = body; // Accept individual distribution item ID

    if (!distributionId) {
      return NextResponse.json({ error: 'Distribution ID is required' }, { status: 400 });
    }

    // Get the specific distribution item to accept
    const distributionItem = await prisma.warehouseDistribution.findUnique({
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

    if (!distributionItem) {
      return NextResponse.json({ error: 'Distribution item not found' }, { status: 404 });
    }

    if (distributionItem.status !== 'PENDING_ACCEPTANCE') {
      return NextResponse.json({ error: 'Distribution item is not pending acceptance' }, { status: 400 });
    }

    // Use transaction to ensure atomicity
    const updatedDistribution = await prisma.$transaction(async (tx) => {
      // Update distribution status to ACCEPTED
      const updatedDist = await tx.warehouseDistribution.update({
        where: { id: distributionItem.id },
        data: {
          status: 'ACCEPTED',
          notes: distributionItem.notes ? `${distributionItem.notes} | Accepted individually` : 'Accepted individually',
          updatedAt: new Date(),
        },
      });

      // First, ensure the supplier exists in the target store (create if doesn't exist)
      const supplierInStore = await tx.supplier.findFirst({
        where: {
          code: distributionItem.product.supplier.code, // Use supplier code to identify
          storeId: session.user.storeId
        }
      });

      let targetSupplierId = supplierInStore?.id;
      if (!supplierInStore) {
        // Create the supplier in the target store
        const newSupplier = await tx.supplier.create({
          data: {
            storeId: session.user.storeId,
            code: distributionItem.product.supplier.code,
            name: distributionItem.product.supplier.name,
            contactPerson: distributionItem.product.supplier.contactPerson,
            address: distributionItem.product.supplier.address,
            phone: distributionItem.product.supplier.phone,
            email: distributionItem.product.supplier.email,
          }
        });
        targetSupplierId = newSupplier.id;
      } else {
        targetSupplierId = supplierInStore.id;
      }

      // Create a purchase record for the store to represent this accepted product
      await tx.purchase.create({
        data: {
          storeId: session.user.storeId,
          supplierId: targetSupplierId,
          userId: session.user.id,
          purchaseDate: new Date(distributionItem.distributedAt),
          totalAmount: distributionItem.totalAmount,
          status: 'COMPLETED',
          items: {
            create: {
              storeId: session.user.storeId,
              productId: distributionItem.productId,
              quantity: distributionItem.quantity,
              purchasePrice: distributionItem.unitPrice,
              subtotal: distributionItem.totalAmount,
            }
          }
        },
      });

      // First, ensure the category exists in the target store (create if doesn't exist)
      const categoryInStore = await tx.category.findFirst({
        where: {
          name: distributionItem.product.category.name, // Use category name to identify
          storeId: session.user.storeId
        }
      });

      let targetCategoryId = categoryInStore?.id;
      if (!categoryInStore) {
        // Create the category in the target store
        const newCategory = await tx.category.create({
          data: {
            storeId: session.user.storeId,
            name: distributionItem.product.category.name,
            description: distributionItem.product.category.description,
            icon: distributionItem.product.category.icon, // Also copy the icon
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
            productCode: distributionItem.product.productCode,
            storeId: session.user.storeId
          }
        },
        update: {
          stock: {
            increment: distributionItem.quantity
          },
          // Update other product fields if needed
          name: distributionItem.product.name,
          description: distributionItem.product.description,
          purchasePrice: distributionItem.product.purchasePrice,
          retailPrice: distributionItem.product.retailPrice,
          silverPrice: distributionItem.product.silverPrice,
          goldPrice: distributionItem.product.goldPrice,
          platinumPrice: distributionItem.product.platinumPrice,
          categoryId: targetCategoryId,
          supplierId: targetSupplierId,
        },
        create: {
          // Create new product record for this store
          storeId: session.user.storeId,
          categoryId: targetCategoryId,
          name: distributionItem.product.name,
          productCode: distributionItem.product.productCode,
          stock: distributionItem.quantity, // Set initial stock to the distributed quantity
          purchasePrice: distributionItem.product.purchasePrice,
          retailPrice: distributionItem.product.retailPrice,
          silverPrice: distributionItem.product.silverPrice,
          goldPrice: distributionItem.product.goldPrice,
          platinumPrice: distributionItem.product.platinumPrice,
          supplierId: targetSupplierId,
          description: distributionItem.product.description,
          image: distributionItem.product.image,
        }
      });

      return updatedDist;
    });

    // Log audit for the accepted item
    const requestHeaders = new Headers(request.headers);
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
    const userAgent = requestHeaders.get('user-agent') || '';

    await logAudit({
      userId: session.user.id,
      action: AUDIT_ACTIONS.WAREHOUSE_DISTRIBUTION_UPDATE,
      entity: 'WarehouseDistribution',
      recordId: distributionItem.id,
      newValue: { status: 'ACCEPTED', reason: 'Individual item accept from admin' },
      storeId: session.user.storeId,
      ipAddress,
      userAgent,
      additionalData: { message: 'Individual distribution item accepted by store admin' }
    });

    return NextResponse.json({
      success: true,
      message: 'Distribution item accepted successfully',
      distribution: updatedDistribution
    });
  } catch (error) {
    console.error('Error accepting individual warehouse distribution item:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}