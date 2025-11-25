// app/api/supplier/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// PUT: Update a supplier
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;
    const data = await request.json();

    // Get storeId based on user's assigned store
    const storeUser = await prisma.storeUser.findFirst({
      where: {
        userId: session.user.id,
        role: { in: ['ADMIN'] } // Only admin can update
      },
      select: {
        storeId: true
      }
    });

    if (!storeUser) {
      return NextResponse.json({ error: 'User does not have access to any store' }, { status: 400 });
    }

    // Validation
    if (!data.name || !data.phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    // Check if supplier exists and belongs to the store
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        id: id,
        storeId: storeUser.storeId
      }
    });

    if (!existingSupplier) {
      return NextResponse.json({ error: 'Supplier tidak ditemukan atau tidak memiliki akses' }, { status: 404 });
    }

    // Update supplier in database (excluding the code field)
    const updatedSupplier = await prisma.supplier.update({
      where: {
        id: id
      },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        contactPerson: data.contactPerson || null // Update contact person
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Supplier berhasil diperbarui',
      supplier: updatedSupplier
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Get a single supplier
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'CASHIER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;

    // Get storeId based on user's assigned store
    const storeUser = await prisma.storeUser.findFirst({
      where: {
        userId: session.user.id,
        role: { in: ['ADMIN', 'CASHIER'] }
      },
      select: {
        storeId: true
      }
    });

    if (!storeUser) {
      return NextResponse.json({ error: 'User does not have access to any store' }, { status: 400 });
    }

    // Get a single supplier
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: id,
        storeId: storeUser.storeId
      }
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier tidak ditemukan atau tidak memiliki akses' }, { status: 404 });
    }

    return NextResponse.json({
      supplier: supplier
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a single supplier
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = params;

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

    // Check if supplier exists and belongs to the store
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        id: id,
        storeId: storeUser.storeId
      }
    });

    if (!existingSupplier) {
      return NextResponse.json({ error: 'Supplier tidak ditemukan atau tidak memiliki akses' }, { status: 404 });
    }

    // Check if supplier has associated products
    const productsWithSupplier = await prisma.product.count({
      where: {
        supplierId: id
      }
    });

    if (productsWithSupplier > 0) {
      return NextResponse.json({
        error: 'Tidak dapat menghapus supplier karena masih terdapat produk yang terkait'
      }, { status: 400 });
    }

    // Delete supplier
    const deletedSupplier = await prisma.supplier.delete({
      where: {
        id: id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Supplier berhasil dihapus',
      supplier: deletedSupplier
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}