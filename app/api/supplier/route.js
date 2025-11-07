// app/api/supplier/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      const allSuppliers = await prisma.supplier.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      const filteredSuppliers = allSuppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(search.toLowerCase()) ||
        (supplier.address && supplier.address.toLowerCase().includes(search.toLowerCase())) ||
        (supplier.phone && supplier.phone.toLowerCase().includes(search.toLowerCase())) ||
        (supplier.email && supplier.email.toLowerCase().includes(search.toLowerCase()))
      );
      
      suppliers = filteredSuppliers.slice(offset, offset + limit);
      totalCount = filteredSuppliers.length;
      
    } else {
      suppliers = await prisma.supplier.findMany({
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
      
      totalCount = await prisma.supplier.count();
    }
    
    return NextResponse.json({
      suppliers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/supplier - Create a new supplier
export async function POST(request) {
  try {
    const { name, address, phone, email } = await request.json();
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Nama supplier wajib diisi' }, 
        { status: 400 }
      );
    }
    
    const existingSupplier = await prisma.supplier.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } }
    });
    
    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Nama supplier sudah digunakan' }, 
        { status: 400 }
      );
    }
    
    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
      }
    });
    
    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/supplier - Update a supplier
export async function PUT(request) {
  try {
    const { id, name, address, phone, email } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID supplier wajib disediakan' }, 
        { status: 400 }
      );
    }
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Nama supplier wajib diisi' }, 
        { status: 400 }
      );
    }
    
    const existingSupplier = await prisma.supplier.findFirst({
      where: { 
        id: { not: id },
        name: { equals: name.trim(), mode: 'insensitive' }
      }
    });
    
    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Nama supplier sudah digunakan' }, 
        { status: 400 }
      );
    }
    
    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
      }
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
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/supplier - Delete single or multiple suppliers
export async function DELETE(request) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
      
      if (!id) {
        return NextResponse.json(
          { error: 'ID supplier atau array ID harus disediakan' }, 
          { status: 400 }
        );
      }
      
      const productsCount = await prisma.product.count({
        where: { supplierId: id }
      });
      
      if (productsCount > 0) {
        return NextResponse.json(
          { error: 'Tidak dapat menghapus supplier karena masih memiliki produk terkait' }, 
          { status: 400 }
        );
      }
      
      await prisma.supplier.delete({
        where: { id }
      });
      
      return NextResponse.json({ message: 'Supplier berhasil dihapus' });
    }
    
    const suppliersWithProducts = await prisma.product.findMany({
      where: {
        supplierId: { in: ids }
      },
      select: {
        supplierId: true
      }
    });
    
    if (suppliersWithProducts.length > 0) {
      const supplierIds = suppliersWithProducts.map(p => p.supplierId);
      return NextResponse.json(
        { 
          error: 'Tidak dapat menghapus supplier karena beberapa supplier masih memiliki produk terkait', 
          problematicIds: supplierIds 
        }, 
        { status: 400 }
      );
    }
    
    const deletedSuppliers = await prisma.supplier.deleteMany({
      where: {
        id: { in: ids }
      }
    });
    
    return NextResponse.json({ 
      message: `Berhasil menghapus ${deletedSuppliers.count} supplier`,
      deletedCount: deletedSuppliers.count
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
  } finally {
    await prisma.$disconnect();
  }
}
