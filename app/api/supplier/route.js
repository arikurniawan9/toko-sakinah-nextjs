// app/api/supplier/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

// Zod Schemas for Supplier
const supplierSchema = z.object({
  name: z.string().trim().min(1, { message: 'Nama supplier wajib diisi' }),
  address: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().email({ message: 'Format email tidak valid' }).optional().nullable(),
});

const supplierUpdateSchema = supplierSchema.extend({
  id: z.string().min(1, { message: 'ID supplier wajib disediakan' }),
});

// GET /api/supplier - Get all suppliers with pagination and search
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
            { address: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {};

    const suppliersWithProductCount = await prisma.supplier.findMany({
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

    const suppliers = suppliersWithProductCount.map(sup => ({
      ...sup,
      productCount: sup._count.products
    }));
    
    const totalCount = await prisma.supplier.count({ where });
    
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
    return NextResponse.json({ error: 'Gagal mengambil data supplier' }, { status: 500 });
  }
}

// POST /api/supplier - Create a new supplier
export async function POST(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = supplierSchema.parse(body);
    
    const existingSupplier = await prisma.supplier.findFirst({
      where: { name: { equals: data.name } },
    });
    
    if (existingSupplier) {
      return NextResponse.json({ error: 'Nama supplier sudah digunakan' }, { status: 409 });
    }
    
    const supplier = await prisma.supplier.create({ data });
    
    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal membuat supplier' }, { status: 500 });
  }
}

// PUT /api/supplier - Update a supplier
export async function PUT(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...data } = supplierUpdateSchema.parse(body);
    
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        name: { equals: data.name },
        id: { not: id },
      },
    });
    
    if (existingSupplier) {
      return NextResponse.json({ error: 'Nama supplier sudah digunakan' }, { status: 409 });
    }
    
    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data,
    });
    
    return NextResponse.json(updatedSupplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Supplier tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Gagal memperbarui supplier' }, { status: 500 });
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

    try {
      const body = await request.json();
      if (body.ids && Array.isArray(body.ids)) {
        idsToDelete = body.ids;
      }
    } catch (e) {
      // Ignore if body is empty
    }

    if (idsToDelete.length === 0) {
      const singleId = searchParams.get('id');
      if (singleId) idsToDelete = [singleId];
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json({ error: 'ID supplier harus disediakan' }, { status: 400 });
    }

    const productCount = await prisma.product.count({
      where: { supplierId: { in: idsToDelete } },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus karena ${productCount} produk masih terkait dengan supplier ini.` },
        { status: 400 }
      );
    }
    
    const { count } = await prisma.supplier.deleteMany({
      where: { id: { in: idsToDelete } },
    });

    if (count === 0) {
      return NextResponse.json({ error: 'Supplier tidak ditemukan' }, { status: 404 });
    }
    
    return NextResponse.json({ message: `Berhasil menghapus ${count} supplier.` });
  } catch (error) {
    console.error('Error deleting suppliers:', error);
    return NextResponse.json({ error: 'Gagal menghapus supplier' }, { status: 500 });
  }
}