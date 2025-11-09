
// app/api/temp-cart/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// POST /api/temp-cart - Create a temporary shopping list for attendant
export async function POST(request) {
  const session = await getSession();
  if (!session || !['ADMIN', 'ATTENDANT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { attendantId, items } = await request.json();
    
    if (!attendantId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Attendant ID and items array are required' }, 
        { status: 400 }
      );
    }

    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product with id ${item.productId} not found` }, 
          { status: 404 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` }, 
          { status: 400 }
        );
      }
    }

    const createdItems = await prisma.$transaction(async (tx) => {
      const created = await tx.tempCart.createMany({
        data: items.map(item => ({
          attendantId,
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
      return created;
    });

    return NextResponse.json({
      message: 'Temporary cart created successfully',
      items: createdItems,
    });
  } catch (error) {
    console.error('Error creating temporary cart:', error);
    return NextResponse.json(
      { error: 'Failed to create temporary cart' }, 
      { status: 500 }
    );
  }
}

// GET /api/temp-cart - Get temporary shopping lists for cashier
export async function GET(request) {
  const session = await getSession();
  if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const attendantId = searchParams.get('attendantId');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (attendantId) {
      whereClause = { attendantId };
    }
    
    const tempCarts = await prisma.tempCart.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      include: {
        attendant: true,
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    const totalCount = await prisma.tempCart.count({ where: whereClause });
    
    return NextResponse.json({
      tempCarts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching temporary carts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch temporary carts' }, 
      { status: 500 }
    );
  }
}

// DELETE /api/temp-cart - Clear temporary cart
export async function DELETE(request) {
  const session = await getSession();
  if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const attendantId = searchParams.get('attendantId');
    const id = searchParams.get('id');
    
    if (!attendantId && !id) {
      return NextResponse.json(
        { error: 'Either attendantId or specific cart item ID must be provided' }, 
        { status: 400 }
      );
    }
    
    if (id) {
      await prisma.tempCart.delete({
        where: { id },
      });
    } else {
      await prisma.tempCart.deleteMany({
        where: { attendantId },
      });
    }
    
    return NextResponse.json({ 
      message: 'Temporary cart cleared successfully' 
    });
  } catch (error) {
    console.error('Error clearing temporary cart:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Item not found' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to clear temporary cart' }, 
      { status: 500 }
    );
  }
}
