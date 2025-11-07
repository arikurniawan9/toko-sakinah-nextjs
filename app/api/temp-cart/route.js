// app/api/temp-cart/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/temp-cart - Create a temporary shopping list for attendant
export async function POST(request) {
  try {
    const { attendantId, customerId, items } = await request.json();
    
    if (!attendantId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Attendant ID and items array are required' }, 
        { status: 400 }
      );
    }

    // Validate all products exist and have sufficient stock
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

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

    // Create temp cart entries
    const createdItems = [];
    for (const item of items) {
      const createdItem = await prisma.tempCart.create({
        data: {
          attendantId,
          productId: item.productId,
          quantity: item.quantity
        }
      });
      createdItems.push(createdItem);
    }

    return NextResponse.json({
      message: 'Temporary cart created successfully',
      items: createdItems
    });
  } catch (error) {
    console.error('Error creating temporary cart:', error);
    return NextResponse.json(
      { error: 'Failed to create temporary cart' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET /api/temp-cart - Get temporary shopping lists for cashier
export async function GET(request) {
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
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const totalCount = await prisma.tempCart.count({ where: whereClause });
    
    return NextResponse.json({
      tempCarts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching temporary carts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch temporary carts' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/temp-cart - Clear temporary cart
export async function DELETE(request) {
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
      // Delete specific item
      await prisma.tempCart.delete({
        where: { id }
      });
    } else {
      // Delete all items for attendant
      await prisma.tempCart.deleteMany({
        where: { attendantId }
      });
    }
    
    return NextResponse.json({ 
      message: 'Temporary cart cleared successfully' 
    });
  } catch (error) {
    console.error('Error clearing temporary cart:', error);
    
    // Handle not found error
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
  } finally {
    await prisma.$disconnect();
  }
}