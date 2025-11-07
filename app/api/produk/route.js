// app/api/produk/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/produk - Get all products with pagination, search, and filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build where clause for search - only search by name and product code
    let whereClause = {};
    if (search) {
      whereClause = {
        OR: [
          { name: { contains: search } },
          { productCode: { contains: search } }
        ]
      };
    }
    
    // Get products with pagination and search
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
    
    // Get total count for pagination
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
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/produk - Create a new product
export async function POST(request) {
  try {
    const { 
      name, 
      productCode, 
      categoryId, 
      supplierId, 
      stock, 
      purchasePrice, 
      sellingPrice, 
      discount1_3, 
      discount4_6, 
      discountMore,
      description,
      image
    } = await request.json();
    
    // Validation
    if (!name || !productCode || !categoryId || !supplierId || sellingPrice === undefined) {
      return NextResponse.json(
        { error: 'Nama, kode produk, kategori, supplier, dan harga jual wajib diisi' }, 
        { status: 400 }
      );
    }
    
    // Check if product code already exists
    const existingProduct = await prisma.product.findUnique({
      where: { productCode: productCode.trim() }
    });
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'Kode produk sudah digunakan' }, 
        { status: 400 }
      );
    }
    
    // Create the product
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        productCode: productCode.trim(),
        categoryId,
        supplierId,
        stock: parseInt(stock) || 0,
        purchasePrice: parseInt(purchasePrice) || 0,
        sellingPrice: parseInt(sellingPrice) || 0,
        discount1_3: parseInt(discount1_3) || 1000,
        discount4_6: parseInt(discount4_6) || 0,
        discountMore: discountMore ? parseInt(discountMore) : null,
        description: description?.trim() || null,
        image: image || null
      }
    });
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/produk - Update a product
export async function PUT(request) {
  try {
    const { 
      id,
      name, 
      productCode, 
      categoryId, 
      supplierId, 
      stock, 
      purchasePrice, 
      sellingPrice, 
      discount1_3, 
      discount4_6, 
      discountMore,
      description,
      image
    } = await request.json();
    
    // Validation
    if (!id) {
      return NextResponse.json(
        { error: 'ID produk wajib disediakan' }, 
        { status: 400 }
      );
    }
    
    if (!name || !productCode || !categoryId || !supplierId || sellingPrice === undefined) {
      return NextResponse.json(
        { error: 'Nama, kode produk, kategori, supplier, dan harga jual wajib diisi' }, 
        { status: 400 }
      );
    }
    
    // Check if product code already exists (excluding current product)
    const existingProduct = await prisma.product.findFirst({
      where: {
        productCode: productCode.trim(),
        id: { not: id }  // Exclude current product
      }
    });
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'Kode produk sudah digunakan' }, 
        { status: 400 }
      );
    }
    
    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name.trim(),
        productCode: productCode.trim(),
        categoryId,
        supplierId,
        stock: parseInt(stock) || 0,
        purchasePrice: parseInt(purchasePrice) || 0,
        sellingPrice: parseInt(sellingPrice) || 0,
        discount1_3: parseInt(discount1_3) || 1000,
        discount4_6: parseInt(discount4_6) || 0,
        discountMore: discountMore ? parseInt(discountMore) : null,
        description: description?.trim() || null,
        image: image || null
      }
    });
    
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    
    // Check if it's a Prisma error (e.g., record not found)
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
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/produk - Delete single or multiple products
export async function DELETE(request) {
  try {
    const requestBody = await request.text();
    let ids = null;
    
    // Try to parse JSON for bulk delete
    try {
      const parsedBody = JSON.parse(requestBody);
      ids = parsedBody.ids;
    } catch (e) {
      // Body might not be JSON, continue with query parameter
    }
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      // If no IDs array is provided, try to delete a single product by ID from query
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
      
      if (!id) {
        return NextResponse.json(
          { error: 'ID produk atau array ID harus disediakan' }, 
          { status: 400 }
        );
      }
      
      // Check if product has related sales
      const salesDetailsCount = await prisma.saleDetail.count({
        where: { productId: id }
      });
      
      if (salesDetailsCount > 0) {
        return NextResponse.json(
          { error: 'Tidak dapat menghapus produk karena masih memiliki transaksi terkait' }, 
          { status: 400 }
        );
      }
      
      // Delete single product
      await prisma.product.delete({
        where: { id }
      });
      
      return NextResponse.json({ message: 'Produk berhasil dihapus' });
    }
    
    // Bulk delete - check if any products have related sales
    const productsWithSales = await prisma.saleDetail.findMany({
      where: {
        productId: { in: ids }
      },
      select: {
        productId: true
      }
    });
    
    if (productsWithSales.length > 0) {
      const productIds = productsWithSales.map(p => p.productId);
      return NextResponse.json(
        { 
          error: 'Tidak dapat menghapus produk karena beberapa produk masih memiliki transaksi terkait', 
          problematicIds: productIds 
        }, 
        { status: 400 }
      );
    }
    
    // Delete multiple products
    const deletedProducts = await prisma.product.deleteMany({
      where: {
        id: { in: ids }
      }
    });
    
    return NextResponse.json({ 
      message: `Berhasil menghapus ${deletedProducts.count} produk`,
      deletedCount: deletedProducts.count
    });
  } catch (error) {
    console.error('Error deleting products:', error);
    
    // Return generic error if it's not a known Prisma error
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
  } finally {
    await prisma.$disconnect();
  }
}