// app/api/supplier/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/supplier - Get all suppliers with pagination, search, and filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;
    
    let suppliers;
    let totalCount;

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      
      // Fetch suppliers with raw query for case-insensitive search
      suppliers = await prisma.$queryRaw`
        SELECT * FROM Supplier
        WHERE LOWER(name) LIKE ${searchLower} 
           OR LOWER(address) LIKE ${searchLower}
           OR LOWER(phone) LIKE ${searchLower}
           OR LOWER(email) LIKE ${searchLower}
        ORDER BY createdAt DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      // Count total suppliers matching the search with raw query
      const countResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM Supplier
        WHERE LOWER(name) LIKE ${searchLower} 
           OR LOWER(address) LIKE ${searchLower}
           OR LOWER(phone) LIKE ${searchLower}
           OR LOWER(email) LIKE ${searchLower}
      `;
      totalCount = Number(countResult[0].count);

    } else {
      // Standard Prisma findMany when no search term
      suppliers = await prisma.supplier.findMany({
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      totalCount = await prisma.supplier.count();
    }
    
    return NextResponse.json({
      suppliers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' }, 
      { status: 500 }
    );
  }
}

// POST /api/supplier - Create a new supplier
export async function POST(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    if (!data.name || data.name.trim() === '') {
      return NextResponse.json(
        { error: 'Nama supplier wajib diisi' }, 
        { status: 400 }
      );
    }
    
    const existingSupplier = await prisma.$queryRaw`
      SELECT * FROM Supplier WHERE LOWER(name) = LOWER(${data.name.trim()})
    `;
    
    if (existingSupplier && existingSupplier.length > 0) {
      return NextResponse.json(
        { error: 'Nama supplier sudah digunakan' }, 
        { status: 400 }
      );
    }
    
    const supplier = await prisma.supplier.create({
      data: {
        ...data,
        name: data.name.trim(),
        address: data.address?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
      },
    });
    
    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier' }, 
      { status: 500 }
    );
  }
}

// PUT /api/supplier - Update a supplier
export async function PUT(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'ID supplier wajib disediakan' }, 
        { status: 400 }
      );
    }
    
    if (!data.name || data.name.trim() === '') {
      return NextResponse.json(
        { error: 'Nama supplier wajib diisi' }, 
        { status: 400 }
      );
    }
    
    const existingSupplier = await prisma.$queryRaw`
      SELECT * FROM Supplier WHERE LOWER(name) = LOWER(${data.name.trim()}) AND id != ${data.id}
    `;
    
    if (existingSupplier && existingSupplier.length > 0) {
      return NextResponse.json(
        { error: 'Nama supplier sudah digunakan' }, 
        { status: 400 }
      );
    }
    
    const updatedSupplier = await prisma.supplier.update({
      where: { id: data.id },
      data: {
        ...data,
        name: data.name.trim(),
        address: data.address?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
      },
    });
    
    return NextResponse.json(updatedSupplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Supplier tidak ditemukan' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update supplier' }, 
      { status: 500 }
    );
  }
}

// DELETE /api/supplier - Delete single or multiple suppliers
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
        { error: 'ID supplier atau array ID harus disediakan' }, 
        { status: 400 }
      );
    }

    const suppliersWithProducts = await prisma.product.findMany({
      where: {
        supplierId: { in: idsToDelete },
      },
      select: {
        supplierId: true,
      },
    });

    if (suppliersWithProducts.length > 0) {
      const supplierIds = [...new Set(suppliersWithProducts.map((p) => p.supplierId))];
      return NextResponse.json(
        { 
          error: 'Tidak dapat menghapus supplier karena beberapa supplier masih memiliki produk terkait', 
          problematicIds: supplierIds,
        }, 
        { status: 400 }
      );
    }
    
    const deletedSuppliers = await prisma.supplier.deleteMany({
      where: {
        id: { in: idsToDelete },
      },
    });
    
    return NextResponse.json({ 
      message: `Berhasil menghapus ${deletedSuppliers.count} supplier`,
      deletedCount: deletedSuppliers.count,
    });
  } catch (error) {
    console.error('Error deleting suppliers:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Supplier tidak ditemukan' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete suppliers' }, 
      { status: 500 }
    );
  }
}