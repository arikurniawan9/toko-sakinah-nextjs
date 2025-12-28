// app/api/warehouse/route.js
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// GET - Get all warehouses
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['WAREHOUSE', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const warehouses = await prisma.warehouse.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ warehouses });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new warehouse
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['WAREHOUSE', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Nama gudang wajib diisi' }, { status: 400 });
    }

    // Validasi panjang nomor telepon
    if (body.phone && body.phone.trim() !== '' && body.phone.trim().length > 13) {
      return NextResponse.json({ error: 'Nomor telepon maksimal 13 karakter' }, { status: 400 });
    }

    // Create new warehouse
    const newWarehouse = await prisma.warehouse.create({
      data: {
        name: body.name,
        description: body.description || null,
        address: body.address || null,
        phone: body.phone || null,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      message: 'Gudang berhasil dibuat',
      warehouse: newWarehouse
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a warehouse
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['WAREHOUSE', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.id || !body.name) {
      return NextResponse.json({ error: 'ID dan nama gudang wajib diisi' }, { status: 400 });
    }

    // Validasi panjang nomor telepon
    if (body.phone && body.phone.trim() !== '' && body.phone.trim().length > 13) {
      return NextResponse.json({ error: 'Nomor telepon maksimal 13 karakter' }, { status: 400 });
    }

    // Update existing warehouse
    const updatedWarehouse = await prisma.warehouse.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description,
        address: body.address,
        phone: body.phone,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Gudang berhasil diperbarui',
      warehouse: updatedWarehouse
    });
  } catch (error) {
    console.error('Error updating warehouse:', error);

    // Check if it's a record not found error
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Gudang tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}