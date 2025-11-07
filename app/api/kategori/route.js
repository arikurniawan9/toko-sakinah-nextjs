// app/api/kategori/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/kategori - Get all categories with pagination, search, and filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    if (search) {
      // If search term exists, handle case-insensitive search manually
      // Get all categories that match the search term (case-insensitive)
      const allCategories = await prisma.category.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      // Filter results case-insensitively
      const filteredCategories = allCategories.filter(category => 
        category.name.toLowerCase().includes(search.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(search.toLowerCase()))
      );
      
      // Apply pagination to filtered results
      const paginatedCategories = filteredCategories.slice(offset, offset + limit);
      const totalCount = filteredCategories.length;
      
      return NextResponse.json({
        categories: paginatedCategories,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    } else {
      // If no search term, use normal query with pagination
      const categories = await prisma.category.findMany({
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
      
      const totalCount = await prisma.category.count();
      
      return NextResponse.json({
        categories,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/kategori - Create a new category
export async function POST(request) {
  try {
    const { name, description } = await request.json();
    
    // Validation
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Nama kategori wajib diisi' }, 
        { status: 400 }
      );
    }
    
    // Check if category name already exists (case-insensitive)
    const allCategories = await prisma.category.findMany();
    const existingCategory = allCategories.find(cat => 
      cat.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Nama kategori sudah digunakan' }, 
        { status: 400 }
      );
    }
    
    // Create the category
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null
      }
    });
    
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/kategori - Update a category
export async function PUT(request) {
  try {
    const { id, name, description } = await request.json();
    
    // Validation
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
    
    // Check if category name already exists (excluding current category) - case-insensitive
    const allCategories = await prisma.category.findMany();
    const existingCategory = allCategories.find(cat => 
      cat.id !== id && cat.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Nama kategori sudah digunakan' }, 
        { status: 400 }
      );
    }
    
    // Update the category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null
      }
    });
    
    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    
    // Check if it's a Prisma error (e.g., record not found)
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
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/kategori - Delete single or multiple categories
export async function DELETE(request) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      // If no IDs array is provided, try to delete a single category by ID from query
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
      
      if (!id) {
        return NextResponse.json(
          { error: 'ID kategori atau array ID harus disediakan' }, 
          { status: 400 }
        );
      }
      
      // Check if category has related products
      const productsCount = await prisma.product.count({
        where: { categoryId: id }
      });
      
      if (productsCount > 0) {
        return NextResponse.json(
          { error: 'Tidak dapat menghapus kategori karena masih memiliki produk terkait' }, 
          { status: 400 }
        );
      }
      
      // Delete single category
      await prisma.category.delete({
        where: { id }
      });
      
      return NextResponse.json({ message: 'Kategori berhasil dihapus' });
    }
    
    // Bulk delete - check if any categories have related products
    const categoriesWithProducts = await prisma.product.findMany({
      where: {
        categoryId: { in: ids }
      },
      select: {
        categoryId: true
      }
    });
    
    if (categoriesWithProducts.length > 0) {
      const categoryIds = categoriesWithProducts.map(p => p.categoryId);
      return NextResponse.json(
        { 
          error: 'Tidak dapat menghapus kategori karena beberapa kategori masih memiliki produk terkait', 
          problematicIds: categoryIds 
        }, 
        { status: 400 }
      );
    }
    
    // Delete multiple categories
    const deletedCategories = await prisma.category.deleteMany({
      where: {
        id: { in: ids }
      }
    });
    
    return NextResponse.json({ 
      message: `Berhasil menghapus ${deletedCategories.count} kategori`,
      deletedCount: deletedCategories.count
    });
  } catch (error) {
    console.error('Error deleting categories:', error);
    
    // Check if it's a Prisma error (e.g., record not found)
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
  } finally {
    await prisma.$disconnect();
  }
}