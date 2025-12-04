// app/api/products/route.js (contoh implementasi RBAC)
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    // Ambil session langsung
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cek permission manual dengan fallback ke storeId dari session untuk role per toko
    const { user } = session;

    // Cek apakah user memiliki akses PRODUCT_READ
    const allowedRoles = ['MANAGER', 'ADMIN', 'CASHIER', 'ATTENDANT', 'WAREHOUSE'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // Ambil storeId dari session
    let storeId = user.storeId;

    // Jika storeId tidak ditemukan dari session, cek dari relasi langsung
    if (!storeId && !['MANAGER', 'WAREHOUSE'].includes(user.role)) {
      const storeUsers = await prisma.storeUser.findMany({
        where: {
          userId: user.id,
          status: 'AKTIF', // Pastikan menggunakan 'AKTIF' bukan 'ACTIVE'
        },
        include: {
          store: true,
        },
      });

      if (storeUsers.length > 0) {
        storeId = storeUsers[0].storeId; // Gunakan toko pertama yang aktif
      }
    }

    // Jika tetap tidak ada storeId untuk role non-global, tolak akses
    if (!storeId && !['MANAGER', 'WAREHOUSE'].includes(user.role)) {
      console.error('No storeId found for user:', user.id, 'Role:', user.role);
      return NextResponse.json({ error: 'Toko tidak ditemukan untuk akun ini' }, { status: 400 });
    }

    let whereClause = {};

    // Filter berdasarkan toko
    if (['MANAGER', 'WAREHOUSE'].includes(user.role)) {
      // Untuk global roles, filter bisa berdasarkan storeId dalam parameter (jika disediakan) atau tampilkan semua toko milik mereka
      if (request.url.includes('storeId=')) {
        const paramStoreId = searchParams.get('storeId');
        if (paramStoreId) {
          whereClause.storeId = paramStoreId;
        }
      } else {
        // Jika tidak ada storeId dalam parameter, bisa tampilkan semua toko milik mereka
        // Tapi untuk kasus spesifik ini, kita bisa gunakan storeId dari session jika tersedia
        if (storeId) {
          whereClause.storeId = storeId;
        }
      }
    } else {
      // Untuk role per toko, hanya tampilkan produk dari toko yang diakses
      whereClause.storeId = storeId;
    }

    // Tambahkan filter berdasarkan kategori jika disediakan
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    // Tambahkan filter berdasarkan search term
    const search = searchParams.get('search');
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { productCode: { contains: search, mode: 'insensitive' } },
      ];
    }



    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        supplier: true,
        priceTiers: true,
      },
      orderBy: { name: 'asc' },
    });

    // Jika permintaan termasuk pagination, kembalikan dengan pagination
    const page = parseInt(searchParams.get('page')) || 0;
    const limit = parseInt(searchParams.get('limit')) || 0;

    if (page && limit) {
      const totalProducts = await prisma.product.count({
        where: whereClause,
      });

      const totalPages = Math.ceil(totalProducts / limit);

      // Terapkan pagination
      const paginatedProducts = products.slice(
        (page - 1) * limit,
        page * limit
      );

      return NextResponse.json({
        products: paginatedProducts,
        storeId: storeId,
        pagination: {
          total: totalProducts,
          totalPages: totalPages,
          page: page,
          limit: limit
        }
      });
    } else {
      // Jika tidak ada pagination, kembalikan semua produk dengan format yang kompatibel
      return NextResponse.json({
        products,
        storeId: storeId,
        pagination: {
          total: products.length,
          totalPages: 1,
          page: 1,
          limit: products.length
        }
      });
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { logProductCreation } from '@/lib/auditLogger';

export async function POST(request) {
  try {
    // Ambil session langsung
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cek permission manual
    const { user } = session;
    const allowedRoles = ['MANAGER', 'ADMIN'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { storeId, name, categoryId, productCode, stock, purchasePrice, supplierId, image, description } = body;

    // Validasi input
    if (!name || !categoryId || !productCode || purchasePrice === undefined) {
      return NextResponse.json({ error: 'Nama, kategori, kode produk, dan harga pembelian wajib diisi' }, { status: 400 });
    }

    // Untuk role MANAGER dan WAREHOUSE, bisa memilih toko mana untuk membuat produk
    // Untuk mereka yang bukan MANAGER/WAREHOUSE, tidak boleh membuat produk
    let targetStoreId;
    if (['MANAGER', 'WAREHOUSE'].includes(user.role)) {
      targetStoreId = storeId;
    } else {
      return NextResponse.json({ error: 'Tidak memiliki cukup izin untuk membuat produk' }, { status: 403 });
    }

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

    // Log aktivitas pembuatan produk
    const requestHeaders = new Headers(request.headers);
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
    const userAgent = requestHeaders.get('user-agent') || '';

    await logProductCreation(user.id, newProduct, targetStoreId, ipAddress, userAgent);

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