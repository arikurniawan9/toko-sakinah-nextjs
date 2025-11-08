
// app/api/kategori/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/kategori - Get all categories with pagination, search, and filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;
    
    let categories;
    let totalCount;

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      
      // Fetch categories with raw query for case-insensitive search
      categories = await prisma.$queryRaw`
        SELECT * FROM Category
        WHERE LOWER(name) LIKE ${searchLower} OR LOWER(description) LIKE ${searchLower}
        ORDER BY createdAt DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      // Count total categories matching the search with raw query
      const countResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM Category
        WHERE LOWER(name) LIKE ${searchLower} OR LOWER(description) LIKE ${searchLower}
      `;
      totalCount = Number(countResult[0].count);

    } else {
      // Standard Prisma findMany when no search term
      categories = await prisma.category.findMany({
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      totalCount = await prisma.category.count();
    }
    
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
      { error: 'Failed to fetch categories' }, 
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
    const { name, description } = await request.json();
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Nama kategori wajib diisi' }, 
        { status: 400 }
      );
    }
    
    const existingCategory = await prisma.$queryRaw`
      SELECT * FROM Category WHERE LOWER(name) = LOWER(${name.trim()})
    `;
    
    if (existingCategory && existingCategory.length > 0) {
      return NextResponse.json(
        { error: 'Nama kategori sudah digunakan' }, 
        { status: 400 }
      );
    }
    
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });
    
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' }, 
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
    const { id, name, description } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID kategori wajib disediakan' }, 
        { status: 400 }
      );
    }
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Nama kategori wajib diisi' }, 
        { status: 400 }
      );
    }
    
    const existingCategory = await prisma.$queryRaw`
      SELECT * FROM Category WHERE LOWER(name) = LOWER(${name.trim()}) AND id != ${id}
    `;
    
    if (existingCategory && existingCategory.length > 0) {
      return NextResponse.json(
        { error: 'Nama kategori sudah digunakan' }, 
        { status: 400 }
      );
    }
    
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });
    
    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Kategori tidak ditemukan' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update category' }, 
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

    // Try to get IDs from request body (for multiple deletions)
    const requestBody = await request.json().catch(() => ({})); // Handle case where body is empty or not JSON
    if (requestBody.ids && Array.isArray(requestBody.ids) && requestBody.ids.length > 0) {
      idsToDelete = requestBody.ids;
    } else {
      // If not in body, try to get a single ID from query params (for single deletion)
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

    const categoriesWithProducts = await prisma.product.findMany({
      where: {
        categoryId: { in: idsToDelete },
      },
      select: {
        categoryId: true,
      },
    });

    if (categoriesWithProducts.length > 0) {
      const categoryIds = [...new Set(categoriesWithProducts.map((p) => p.categoryId))];
      return NextResponse.json(
        { 
          error: 'Tidak dapat menghapus kategori karena beberapa kategori masih memiliki produk terkait', 
          problematicIds: categoryIds,
        }, 
        { status: 400 }
      );
    }
    
    const deletedCategories = await prisma.category.deleteMany({
      where: {
        id: { in: idsToDelete },
      },
    });
    
    return NextResponse.json({ 
      message: `Berhasil menghapus ${deletedCategories.count} kategori`,
      deletedCount: deletedCategories.count,
    });
  } catch (error) {
    console.error('Error deleting categories:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Kategori tidak ditemukan' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete categories' }, 
      { status: 500 }
    );
  }
}
