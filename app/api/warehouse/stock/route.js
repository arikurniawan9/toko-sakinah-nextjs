// app/api/warehouse/stock/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get all warehouse products
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !['WAREHOUSE', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId');

    const whereClause = warehouseId ? { warehouseId } : {};

    const warehouseProducts = await prisma.warehouseProduct.findMany({
      where: whereClause,
      include: {
        product: {
          include: {
            category: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ warehouseProducts });
  } catch (error) {
    console.error('Error fetching warehouse products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new warehouse product
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['WAREHOUSE', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, quantity, reserved = 0, warehouseId = 'default-warehouse-id' } = body;

    // Validasi input
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    if (typeof reserved !== 'number' || reserved < 0) {
      return NextResponse.json({ error: 'Invalid reserved quantity' }, { status: 400 });
    }

    // Pastikan produk ada
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Cek apakah produk sudah ada di warehouse ini
    const existingWarehouseProduct = await prisma.warehouseProduct.findFirst({
      where: {
        productId,
        warehouseId,
      },
    });

    if (existingWarehouseProduct) {
      return NextResponse.json({ error: 'Product already exists in this warehouse' }, { status: 400 });
    }

    // Dapatkan warehouse default jika tidak disediakan
    let targetWarehouseId = warehouseId;
    if (warehouseId === 'default-warehouse-id') {
      const defaultWarehouse = await prisma.warehouse.findFirst({
        select: { id: true },
      });

      if (defaultWarehouse) {
        targetWarehouseId = defaultWarehouse.id;
      } else {
        // Buat warehouse default jika tidak ada
        const newWarehouse = await prisma.warehouse.create({
          data: {
            name: 'Gudang Pusat',
            description: 'Gudang utama untuk menyimpan produk',
          },
        });
        targetWarehouseId = newWarehouse.id;
      }
    }

    // Buat warehouse product
    const newWarehouseProduct = await prisma.warehouseProduct.create({
      data: {
        productId,
        warehouseId: targetWarehouseId,
        quantity,
        reserved,
      },
    });

    // Ambil data lengkap untuk response
    const warehouseProductWithDetails = await prisma.warehouseProduct.findUnique({
      where: {
        id: newWarehouseProduct.id,
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
      message: 'Warehouse product created successfully',
      warehouseProduct: warehouseProductWithDetails
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating warehouse product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}