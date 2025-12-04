// app/api/purchase/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { logCreate, logDelete } from '@/lib/auditLogger';

// GET: Fetch all purchase transactions with filtering and pagination
export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cek apakah pengguna memiliki storeId
  if (!session.user.storeId) {
    return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const supplierId = searchParams.get('supplierId');

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build where condition for filtering
    const whereCondition = {
      AND: [
        // Filter hanya untuk toko yang sesuai dengan session user
        { storeId: session.user.storeId },

        // Search condition - search in purchase number, supplier name, or user name
        search ? {
          OR: [
            { id: { contains: search } },
            { supplier: { name: { contains: search } } },
            { user: { name: { contains: search } } }
          ]
        } : {},

        // Date range condition
        ...(startDate && endDate ? [{
          purchaseDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }] : startDate ? [{
          purchaseDate: { gte: new Date(startDate) }
        }] : endDate ? [{
          purchaseDate: { lte: new Date(endDate) }
        }] : []),

        // Supplier filter
        supplierId ? { supplierId } : {}
      ]
    };

    // Get purchases with pagination and include related data
    const purchases = await prisma.purchase.findMany({
      where: whereCondition,
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        supplier: true,
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.purchase.count({
      where: whereCondition
    });

    const totalPages = Math.ceil(totalCount / limit);

    // Format the data to include computed fields
    const formattedPurchases = purchases.map(purchase => ({
      ...purchase,
      totalAmount: purchase.items.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0)
    }));

    return NextResponse.json({
      purchases: formattedPurchases,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        total: totalCount,
        itemsPerPage: limit,
        startIndex: offset + 1,
        endIndex: Math.min(offset + limit, totalCount)
      }
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new purchase transaction
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Validate required fields
    if (!data.supplierId || !data.items || data.items.length === 0) {
      return NextResponse.json({ error: 'Supplier ID dan item pembelian wajib diisi' }, { status: 400 });
    }

    // Calculate total amount
    const totalAmount = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Convert date string to proper Date object if needed
    let purchaseDate = new Date();
    if (data.purchaseDate) {
      // If purchaseDate is already a Date object, use it
      if (data.purchaseDate instanceof Date) {
        purchaseDate = data.purchaseDate;
      } else {
        // If it's a string, try to parse it
        const parsedDate = new Date(data.purchaseDate);
        if (!isNaN(parsedDate.getTime())) {
          purchaseDate = parsedDate;
        } else {
          // If parsing fails, default to current date
          purchaseDate = new Date();
        }
      }
    }

    // Create purchase with items
    const newPurchase = await prisma.purchase.create({
      data: {
        storeId: session.user.storeId, // Tambahkan storeId dari session user
        supplierId: data.supplierId,
        userId: session.user.id,
        purchaseDate: purchaseDate,
        totalAmount: totalAmount,
        items: {
          create: data.items.map(item => ({
            storeId: session.user.storeId, // Tambahkan storeId ke item juga
            productId: item.productId,
            quantity: item.quantity,
            purchasePrice: item.price,
            subtotal: item.quantity * item.price  // Calculate subtotal automatically
          }))
        }
      },
      include: {
        supplier: true,
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Update product stock
    for (const item of data.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity
          }
        }
      });
    }

    // Log audit untuk pembuatan pembelian
    await logCreate(session.user.id, 'Purchase', newPurchase.id, newPurchase, request, session.user.storeId);

    return NextResponse.json({
      success: true,
      message: 'Pembelian berhasil disimpan',
      purchase: newPurchase
    });
  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a purchase transaction
export async function DELETE(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Purchase ID is required' }, { status: 400 });
    }

    // Check if purchase exists
    const existingPurchase = await prisma.purchase.findUnique({
      where: {
        id,
        storeId: session.user.storeId  // Hanya bisa menghapus pembelian dari toko sendiri
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!existingPurchase) {
      return NextResponse.json({ error: 'Pembelian tidak ditemukan' }, { status: 404 });
    }

    // First, reduce product stock for each item in the purchase
    for (const item of existingPurchase.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });
    }

    // Then delete the purchase
    await prisma.purchase.delete({
      where: {
        id,
        storeId: session.user.storeId  // Pastikan hanya menghapus pembelian dari toko sendiri
      }
    });

    // Log audit untuk penghapusan pembelian
    await logDelete(session.user.id, 'Purchase', existingPurchase.id, existingPurchase, request, session.user.storeId);

    return NextResponse.json({
      success: true,
      message: 'Pembelian berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}