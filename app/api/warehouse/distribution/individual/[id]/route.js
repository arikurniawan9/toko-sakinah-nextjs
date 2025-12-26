// app/api/warehouse/distribution/individual/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

// GET - Get specific distribution by ID (single distribution, not grouped)
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

    // Get the specific distribution record
    const distribution = await prisma.warehouseDistribution.findUnique({
      where: {
        id: id,
        storeId: session.user.storeId, // Ensure it's from the user's store
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

    if (!distribution) {
      return NextResponse.json({ error: 'Distribution not found' }, { status: 404 });
    }

    // Create a readable distribution ID
    const distDate = new Date(distribution.distributedAt);
    const year = distDate.getFullYear().toString();
    const month = (distDate.getMonth() + 1).toString().padStart(2, '0');
    const day = distDate.getDate().toString().padStart(2, '0');
    const datePart = `${year}${month}${day}`;
    
    // Use a simple sequence based on the distribution ID for uniqueness
    const distIdSuffix = distribution.id.substring(distribution.id.length - 5).toUpperCase();
    const distributionId = `DIST-${datePart}-${distIdSuffix}`;

    // Format the distribution data to match what the DataTable expects
    // Flatten product properties to avoid nested property access issues in DataTable
    const formattedDistribution = {
      id: distribution.id,
      invoiceNumber: distributionId, // Use the readable ID as invoice number
      distributedAt: distribution.distributedAt,
      distributedByUser: distribution.distributedByUser,
      store: distribution.store,
      warehouse: distribution.warehouse,
      status: distribution.status,
      notes: distribution.notes,
      productId: distribution.productId,
      product: distribution.product, // Include the full product object for compatibility
      productName: distribution.product?.name, // Flattened property
      productCode: distribution.product?.productCode, // Flattened property
      quantity: distribution.quantity,
      unitPrice: distribution.unitPrice,
      totalAmount: distribution.totalAmount,
      distributedBy: distribution.distributedBy,
    };

    // Return the distribution with a single formatted item
    return NextResponse.json({
      id: distributionId, // Generate readable ID for this specific distribution
      distributionId: distribution.id, // Original distribution ID
      distributedAt: distribution.distributedAt,
      store: distribution.store,
      distributedByUser: distribution.distributedByUser,
      warehouse: distribution.warehouse,
      status: distribution.status,
      notes: distribution.notes,
      items: [formattedDistribution], // Single-item array with properly formatted distribution
      itemCount: 1,
      totalQuantity: distribution.quantity,
      totalAmount: distribution.totalAmount,
    });
  } catch (error) {
    console.error('Error fetching individual distribution details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}