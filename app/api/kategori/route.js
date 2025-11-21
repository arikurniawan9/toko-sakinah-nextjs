// app/api/kategori/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

// Zod Schemas
const categorySchema = z.object({
  name: z.string().trim().min(1, { message: 'Nama kategori wajib diisi' }),
  description: z.string().trim().optional().nullable(),
  icon: z.string().trim().optional().nullable(),
});

const categoryUpdateSchema = categorySchema.extend({
  id: z.string().min(1, { message: 'ID kategori wajib disediakan' }),
});

// GET /api/kategori - Get all categories with pagination, search, and filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {};

    // Dapatkan kategori dengan jumlah produk masing-masing
    const categoriesWithProductCount = await prisma.category.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    // Sesuaikan nama field agar sesuai dengan nama yang digunakan di UI
    const categories = categoriesWithProductCount.map(cat => ({
      ...cat,
      productCount: cat._count.products
    }));

    const totalCount = await prisma.category.count({ where });

    return NextResponse.json({
      categories,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data kategori' },
      { status: 500 }
    );
  }
}

// POST /api/kategori - Create a new category
export async function POST(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, icon } = categorySchema.parse(body);
    const storeId = session.user.storeId;

    if (!storeId) {
      return NextResponse.json(
        { error: 'User tidak terkait dengan toko manapun' },
        { status: 400 }
      );
    }

    const existingCategory = await prisma.category.findFirst({
      where: { 
        name: { equals: name },
        storeId: storeId,
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Nama kategori sudah digunakan' },
        { status: 409 } // 409 Conflict is more appropriate
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        icon,
        storeId,
      },
    });

    return NextResponse.json(category, { status: 201 }); // 201 Created
  } catch (error) {
    console.error('Error creating category:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Gagal membuat kategori' },
      { status: 500 }
    );
  }
}

// PUT /api/kategori - Update a category
export async function PUT(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, description, icon } = categoryUpdateSchema.parse(body);
    const storeId = session.user.storeId;

    if (!storeId) {
      return NextResponse.json(
        { error: 'User tidak terkait dengan toko manapun' },
        { status: 400 }
      );
    }

    // Check for name uniqueness within the store
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: { equals: name },
        id: { not: id },
        storeId: storeId,
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Nama kategori sudah digunakan' },
        { status: 409 }
      );
    }

    // Use updateMany to ensure tenancy
    const result = await prisma.category.updateMany({
      where: {
        id: id,
        storeId: storeId,
      },
      data: {
        name,
        description,
        icon,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Kategori tidak ditemukan atau Anda tidak memiliki akses' },
        { status: 404 }
      );
    }

    // Fetch the updated category to return it
    const updatedCategory = await prisma.category.findUnique({ where: { id } });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    // P2025 is for `update` not `updateMany`. A count of 0 is the equivalent check.
    // So we can remove the specific P2025 check.

    return NextResponse.json(
      { error: 'Gagal memperbarui kategori' },
      { status: 500 }
    );
  }
}

// DELETE /api/kategori - Delete single or multiple categories
export async function DELETE(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let idsToDelete = [];

    const storeId = session.user.storeId;
    if (!storeId) {
      return NextResponse.json(
        { error: 'User tidak terkait dengan toko manapun' },
        { status: 400 }
      );
    }

    // Unified way to get IDs from either body or query params
    try {
      const body = await request.json();
      if (body.ids && Array.isArray(body.ids)) {
        idsToDelete = body.ids;
      }
    } catch (e) {
      // Ignore error if body is empty or not valid JSON
    }

    if (idsToDelete.length === 0) {
      const singleId = searchParams.get('id');
      if (singleId) {
        idsToDelete = [singleId];
      }
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { error: 'ID kategori atau array ID harus disediakan' },
        { status: 400 }
      );
    }

    const productsInCategory = await prisma.product.count({
      where: {
        categoryId: { in: idsToDelete },
        storeId: storeId, // Ensure we only check products in the user's store
      },
    });

    if (productsInCategory > 0) {
      return NextResponse.json(
        {
          error: `Tidak dapat menghapus karena ${productsInCategory} produk masih terkait dengan kategori ini.`,
        },
        { status: 400 }
      );
    }

    const { count } = await prisma.category.deleteMany({
      where: {
        id: { in: idsToDelete },
        storeId: storeId, // Ensure we only delete categories from the user's store
      },
    });

    if (count === 0) {
      return NextResponse.json(
        { error: 'Tidak ada kategori yang ditemukan untuk dihapus' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Berhasil menghapus ${count} kategori.`,
      deletedCount: count,
    });
  } catch (error) {
    console.error('Error deleting categories:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus kategori' },
      { status: 500 }
    );
  }
}