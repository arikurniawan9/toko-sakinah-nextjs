// app/api/suspended-sales/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/suspended-sales - Fetch all suspended sales
export async function GET(request) {
  const session = await getSession();
  if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const suspendedSales = await prisma.suspendedSale.findMany({
      where: {
        storeId: session.user.storeId, // Filter by store of the current user
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Deserialize cartItems for each sale
    const salesWithParsedCart = suspendedSales.map(sale => ({
      ...sale,
      cartItems: JSON.parse(sale.cartItems),
    }));

    return NextResponse.json({ suspendedSales: salesWithParsedCart });
  } catch (error) {
    console.error('Error fetching suspended sales:', error);
    return NextResponse.json({ error: 'Failed to fetch suspended sales' }, { status: 500 });
  }
}

// POST /api/suspended-sales - Create a new suspended sale
export async function POST(request) {
  const session = await getSession();
  if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, cartItems, memberId, notes } = await request.json();

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart items are required' }, { status: 400 });
    }

    const newSuspendedSale = await prisma.suspendedSale.create({
      data: {
        name,
        notes,
        memberId,
        cartItems: JSON.stringify(cartItems), // Serialize cart items to a string
        storeId: session.user.storeId, // Tambahkan storeId dari session user
      },
    });

    return NextResponse.json(newSuspendedSale, { status: 201 });
  } catch (error) {
    console.error('Error creating suspended sale:', error);
    return NextResponse.json({ error: 'Failed to create suspended sale' }, { status: 500 });
  }
}

// DELETE /api/suspended-sales - Delete a suspended sale
export async function DELETE(request) {
  const session = await getSession();
  if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Suspended sale ID is required' }, { status: 400 });
    }

    await prisma.suspendedSale.delete({
      where: {
        id,
        storeId: session.user.storeId, // Pastikan hanya menghapus suspended sale dari toko yang sesuai
      },
    });

    return NextResponse.json({ message: 'Suspended sale deleted successfully' });
  } catch (error) {
    console.error('Error deleting suspended sale:', error);
    return NextResponse.json({ error: 'Failed to delete suspended sale' }, { status: 500 });
  }
}
