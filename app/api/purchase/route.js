import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/purchase - Get all purchases with filtering
export async function GET(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const supplierId = searchParams.get('supplierId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const whereClause = {};
  if (supplierId) {
    whereClause.supplierId = supplierId;
  }
  if (startDate && endDate) {
    whereClause.purchaseDate = {
      gte: new Date(startDate),
      lte: new Date(new Date(endDate).getTime() + 86400000), // include the whole end day
    };
  } else if (startDate) {
    whereClause.purchaseDate = {
      gte: new Date(startDate),
    };
  } else if (endDate) {
    whereClause.purchaseDate = {
      lte: new Date(new Date(endDate).getTime() + 86400000),
    };
  }

  try {
    const purchases = await prisma.purchase.findMany({
      where: whereClause,
      orderBy: {
        purchaseDate: 'desc',
      },
      include: {
        supplier: true, // Include supplier details
        user: { // Include user (creator) details
          select: {
            name: true,
          }
        },
      },
    });
    return NextResponse.json({ purchases });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchases.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { supplierId, purchaseDate, items } = await request.json();

    if (!supplierId || !purchaseDate || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Supplier, purchase date, and items are required.' },
        { status: 400 }
      );
    }

    let totalAmount = 0;
    const purchaseItemsData = [];

    for (const item of items) {
      if (!item.productId || !item.quantity || !item.purchasePrice) {
        return NextResponse.json(
          { error: 'Each item must have a productId, quantity, and purchasePrice.' },
          { status: 400 }
        );
      }
      const subtotal = item.quantity * item.purchasePrice;
      totalAmount += subtotal;
      purchaseItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        subtotal: subtotal,
      });
    }

    const newPurchase = await prisma.$transaction(async (prisma) => {
      // Create the Purchase record
      const purchase = await prisma.purchase.create({
        data: {
          supplierId,
          userId: session.user.id,
          purchaseDate: new Date(purchaseDate),
          totalAmount,
          items: {
            createMany: {
              data: purchaseItemsData,
            },
          },
        },
      });

      // Update product stock for each item
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
            purchasePrice: item.purchasePrice, // Update purchase price to the latest
          },
        });
      }
      return purchase;
    });

    return NextResponse.json(newPurchase, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json(
      { error: 'Failed to create purchase.' },
      { status: 500 }
    );
  }
}
