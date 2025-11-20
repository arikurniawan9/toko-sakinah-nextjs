// app/api/products/route.js (contoh implementasi RBAC)
import { NextResponse } from 'next/server';
import { requireAuthAndPermission } from '@/utils/rbac';
import prisma from '@/lib/prisma';

export async function GET(request) {
  // Validasi permission untuk membaca produk
  const authResult = await requireAuthAndPermission(request, 'PRODUCT_READ');
  
  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { session, storeId } = authResult;
    let products;

    // Jika user adalah MANAGER atau WAREHOUSE, mereka bisa melihat semua produk
    if (['MANAGER', 'WAREHOUSE'].includes(session.user.role)) {
      // Jika storeId disediakan, filter berdasarkan toko tertentu
      if (storeId) {
        products = await prisma.product.findMany({
          where: { storeId },
          include: {
            category: true,
            supplier: true,
            priceTiers: true,
          },
          orderBy: { name: 'asc' },
        });
      } else {
        // Jika tidak ada storeId, kembalikan semua produk (mungkin terlalu banyak)
        // Dalam praktiknya, mungkin ingin menampilkan semua produk dari semua toko
        // atau menampilkan produk dari semua toko yang diizinkan
        products = await prisma.product.findMany({
          include: {
            category: true,
            supplier: true,
            priceTiers: true,
          },
          orderBy: { name: 'asc' },
        });
      }
    } else {
      // Untuk role per toko, hanya tampilkan produk dari toko yang diakses
      products = await prisma.product.findMany({
        where: { storeId },
        include: {
          category: true,
          supplier: true,
          priceTiers: true,
        },
        orderBy: { name: 'asc' },
      });
    }

    return NextResponse.json({ products, storeId });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  // Validasi permission untuk membuat produk
  const authResult = await requireAuthAndPermission(request, 'PRODUCT_CREATE');
  
  if (!authResult.authorized) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await request.json();
    const { storeId, name, categoryId, productCode, stock, purchasePrice, supplierId, image, description } = body;
    
    // Validasi input
    if (!name || !categoryId || !productCode || purchasePrice === undefined) {
      return NextResponse.json({ error: 'Nama, kategori, kode produk, dan harga pembelian wajib diisi' }, { status: 400 });
    }

    const { session } = authResult;
    
    // Untuk role per toko, pastikan produk dibuat di toko yang diakses
    const targetStoreId = ['MANAGER', 'WAREHOUSE'].includes(session.user.role) 
      ? storeId 
      : authResult.storeId;

    if (!targetStoreId) {
      return NextResponse.json({ error: 'Store ID harus ditentukan' }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        storeId: targetStoreId,
        name,
        categoryId,
        productCode,
        stock: stock || 0,
        purchasePrice,
        supplierId,
        image: image || null,
        description: description || null,
      },
      include: {
        category: true,
        supplier: true,
        priceTiers: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      product: newProduct,
      message: 'Produk berhasil ditambahkan' 
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}