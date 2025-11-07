
// app/api/produk/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/produk - Get all products with pagination, search, and filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    if (search) {
      whereClause = {
        OR: [
          { name: { contains: search } },
          { productCode: { contains: search } }
        ]
      };
    }
    
    const products = await prisma.product.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      include: {
        category: true,
        supplier: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const totalCount = await prisma.product.count({ where: whereClause });
    
    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' }, 
      { status: 500 }
    );
  }
}

// POST /api/produk - Create a new product
export async function POST(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    if (!data.name || !data.productCode || !data.categoryId || !data.supplierId || data.sellingPrice === undefined) {
      return NextResponse.json(
        { error: 'Nama, kode produk, kategori, supplier, dan harga jual wajib diisi' }, 
        { status: 400 }
      );
    }
    
    const existingProduct = await prisma.product.findUnique({
      where: { productCode: data.productCode.trim() }
    });
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'Kode produk sudah digunakan' }, 
        { status: 400 }
      );
    }
    
    const product = await prisma.product.create({
      data: {
        ...data,
        name: data.name.trim(),
        productCode: data.productCode.trim(),
        stock: parseInt(data.stock) || 0,
        purchasePrice: parseInt(data.purchasePrice) || 0,
        sellingPrice: parseInt(data.sellingPrice) || 0,
        discount1_3: parseInt(data.discount1_3) || 1000,
        discount4_6: parseInt(data.discount4_6) || 0,
        discountMore: data.discountMore ? parseInt(data.discountMore) : null,
        description: data.description?.trim() || null,
      }
    });
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' }, 
      { status: 500 }
    );
  }
}

// PUT /api/produk - Update a product
export async function PUT(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'ID produk wajib disediakan' }, 
        { status: 400 }
      );
    }
    
    if (!data.name || !data.productCode || !data.categoryId || !data.supplierId || data.sellingPrice === undefined) {
      return NextResponse.json(
        { error: 'Nama, kode produk, kategori, supplier, dan harga jual wajib diisi' }, 
        { status: 400 }
      );
    }
    
    const existingProduct = await prisma.product.findFirst({
      where: {
        productCode: data.productCode.trim(),
        id: { not: data.id }  
      }
    });
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'Kode produk sudah digunakan' }, 
        { status: 400 }
      );
    }
    
    const updatedProduct = await prisma.product.update({
      where: { id: data.id },
      data: {
        ...data,
        name: data.name.trim(),
        productCode: data.productCode.trim(),
        stock: parseInt(data.stock) || 0,
        purchasePrice: parseInt(data.purchasePrice) || 0,
        sellingPrice: parseInt(data.sellingPrice) || 0,
        discount1_3: parseInt(data.discount1_3) || 1000,
        discount4_6: parseInt(data.discount4_6) || 0,
        discountMore: data.discountMore ? parseInt(data.discountMore) : null,
        description: data.description?.trim() || null,
      }
    });
    
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update product' }, 
      { status: 500 }
    );
  }
}

// DELETE /api/produk - Delete single or multiple products
export async function DELETE(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let ids = [];

    // Try to get IDs from request body first
    try {
      const body = await request.json();
      if (body.ids && Array.isArray(body.ids)) {
        ids = body.ids;
      }
    } catch (e) {
      // Ignore error if body is empty or not valid JSON
    }

    // If no IDs from body, try query string
    if (ids.length === 0) {
      const id = searchParams.get('id');
      const idsParam = searchParams.get('ids');
      if (id) {
        ids = [id];
      } else if (idsParam) {
        ids = idsParam.split(',');
      }
    }

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'ID produk atau array ID harus disediakan' }, 
        { status: 400 }
      );
    }

    const productsWithSales = await prisma.saleDetail.findMany({
      where: {
        productId: { in: ids }
      },
      select: {
        productId: true
      }
    });
    
    if (productsWithSales.length > 0) {
      const productIds = [...new Set(productsWithSales.map(p => p.productId))];
      return NextResponse.json(
        { 
          error: `Tidak dapat menghapus karena ${productIds.length} produk masih memiliki riwayat transaksi.`, 
          problematicIds: productIds 
        }, 
        { status: 400 }
      );
    }
    
    const deletedProducts = await prisma.product.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    if (deletedProducts.count === 0) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan atau sudah dihapus' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: `Berhasil menghapus ${deletedProducts.count} produk`,
      deletedCount: deletedProducts.count
    });
  } catch (error) {
    console.error('Error deleting products:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete products' }, 
      { status: 500 }
    );
  }
}
