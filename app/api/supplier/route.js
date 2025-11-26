// app/api/supplier/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import {
  getFromCache,
  setToCache,
  invalidateSupplierCache
} from '@/lib/redis'; // Tambahkan import fungsi cache

// GET: Fetch all suppliers
export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'CASHIER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    const page = parseInt(searchParams.get('page')) || 1;
    const search = searchParams.get('search') || '';

    // Validasi parameter
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Parameter pagination tidak valid' }, { status: 400 });
    }

    // Get storeId based on user's assigned store
    const storeUser = await prisma.storeUser.findFirst({
      where: {
        userId: session.user.id,
        role: { in: ['ADMIN', 'CASHIER'] } // Include cashier role for fetch
      },
      select: {
        storeId: true
      }
    });

    if (!storeUser) {
      return NextResponse.json({ error: 'User does not have access to any store' }, { status: 400 });
    }

    // Buat cache key berdasarkan parameter
    const cacheKey = `suppliers:${storeUser.storeId}:${page}:${limit}:${search}`;

    // Coba ambil dari cache dulu
    const cachedData = await getFromCache(cacheKey);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build query conditions
    const whereCondition = {
      storeId: storeUser.storeId, // Only suppliers for this store
      AND: search ? [
        {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
            { address: { contains: search } }
          ]
        }
      ] : []
    };

    // Ambil data dan hitung total dalam satu operasi
    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where: whereCondition,
        skip: offset,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          address: true,
          contactPerson: true,
          code: true,
          createdAt: true,
          updatedAt: true,
          products: {
            select: {
              id: true
            }
          }
        }
      }),
      prisma.supplier.count({
        where: whereCondition
      })
    ]);

    // Transform data to include product count
    const suppliersWithProductCount = suppliers.map(supplier => ({
      ...supplier,
      productCount: supplier.products.length
    }));

    const totalPages = Math.ceil(total / limit);

    const result = {
      suppliers: suppliersWithProductCount,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        totalPages: totalPages,
        hasMore: page < totalPages
      }
    };

    // Simpan ke cache
    await setToCache(cacheKey, JSON.stringify(result), 600); // Cache selama 10 menit

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new supplier
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Validation
    if (!data.name || !data.phone || !data.code) {
      return NextResponse.json({ error: 'Name, phone, and code are required' }, { status: 400 });
    }

    // Get storeId based on user's assigned store
    const storeUser = await prisma.storeUser.findFirst({
      where: {
        userId: session.user.id,
        role: { in: ['ADMIN', 'MANAGER'] } // Only admin/manager can add suppliers
      },
      select: {
        storeId: true
      }
    });

    if (!storeUser) {
      return NextResponse.json({ error: 'User does not have access to any store' }, { status: 400 });
    }

    // Create supplier in database
    const newSupplier = await prisma.supplier.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        contactPerson: data.contactPerson || null, // Add contactPerson
        code: data.code, // Use manual code
        storeId: storeUser.storeId
      }
    });

    // Hapus cache supplier untuk toko ini karena ada perubahan data
    await invalidateSupplierCache(storeUser.storeId);

    return NextResponse.json({
      success: true,
      message: 'Supplier berhasil ditambahkan',
      supplier: newSupplier
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    // Check if it's a unique constraint error
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Kode atau nama supplier sudah digunakan' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete multiple suppliers
export async function DELETE(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty IDs list' }, { status: 400 });
    }

    // Get storeId based on user's assigned store
    const storeUser = await prisma.storeUser.findFirst({
      where: {
        userId: session.user.id,
        role: { in: ['ADMIN'] } // Only admin can delete
      },
      select: {
        storeId: true
      }
    });

    if (!storeUser) {
      return NextResponse.json({ error: 'User does not have access to any store' }, { status: 400 });
    }

    // Check if any suppliers have associated products
    const productsWithSuppliers = await prisma.product.count({
      where: {
        supplierId: {
          in: ids
        }
      }
    });

    if (productsWithSuppliers > 0) {
      return NextResponse.json({
        error: 'Tidak dapat menghapus beberapa supplier karena masih terdapat produk yang terkait'
      }, { status: 400 });
    }

    // Delete suppliers
    const deletedSuppliers = await prisma.supplier.deleteMany({
      where: {
        id: {
          in: ids
        },
        storeId: storeUser.storeId // Only delete suppliers from this store
      }
    });

    // Hapus cache supplier untuk toko ini karena ada perubahan data
    await invalidateSupplierCache(storeUser.storeId);

    return NextResponse.json({
      success: true,
      message: `${deletedSuppliers.count} supplier berhasil dihapus`,
      count: deletedSuppliers.count
    });
  } catch (error) {
    console.error('Error deleting suppliers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}