// app/api/warehouse/stock/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get a single warehouse product
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['WAREHOUSE', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const warehouseProduct = await prisma.warehouseProduct.findUnique({
      where: {
        id: params.id,
      },
      include: {
        product: {
          include: {
            category: true,
          }
        },
      },
    });

    if (!warehouseProduct) {
      return NextResponse.json({ error: 'Warehouse product not found' }, { status: 404 });
    }

    return NextResponse.json({ warehouseProduct });
  } catch (error) {
    console.error('Error fetching warehouse product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update warehouse product
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['WAREHOUSE', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { quantity, reserved } = body;

    // Validasi input
    if (typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    if (typeof reserved !== 'number' || reserved < 0) {
      return NextResponse.json({ error: 'Invalid reserved quantity' }, { status: 400 });
    }

    // Dapatkan data warehouse product yang lama untuk mendapatkan productId dan warehouseId
    const existingWarehouseProduct = await prisma.warehouseProduct.findUnique({
      where: { id: params.id },
    });

    if (!existingWarehouseProduct) {
      return NextResponse.json({ error: 'Warehouse product not found' }, { status: 404 });
    }

    // Update warehouse product
    const updatedWarehouseProduct = await prisma.warehouseProduct.update({
      where: {
        id: params.id,
      },
      data: {
        quantity,
        reserved,
        updatedAt: new Date(),
      },
    });

    // Ambil data terbaru untuk response
    const warehouseProductWithDetails = await prisma.warehouseProduct.findUnique({
      where: {
        id: params.id,
      },
      include: {
        product: {
          include: {
            category: true,
          }
        },
      },
    });

    return NextResponse.json({
      message: 'Warehouse product updated successfully',
      warehouseProduct: warehouseProductWithDetails
    });
  } catch (error) {
    console.error('Error updating warehouse product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete warehouse product
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['WAREHOUSE', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const warehouseProduct = await prisma.warehouseProduct.findUnique({
      where: { id: params.id },
    });

    if (!warehouseProduct) {
      return NextResponse.json({ error: 'Warehouse product not found' }, { status: 404 });
    }

    await prisma.warehouseProduct.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: 'Warehouse product deleted successfully' });
  } catch (error) {
    console.error('Error deleting warehouse product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}