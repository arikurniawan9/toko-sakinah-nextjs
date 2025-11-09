
// app/api/transaksi/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// POST /api/transaksi - Process a sale transaction
export async function POST(request) {
  const session = await getSession();
  if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { cashierId, memberId, items, total, payment, change } = await request.json();

    if (!cashierId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cashier ID and items array are required' },
        { status: 400 }
      );
    }

    const createdSale = await prisma.$transaction(async (tx) => {
      const cashier = await tx.user.findUnique({ where: { id: cashierId } });
      if (!cashier) throw new Error('Cashier not found');

      if (memberId) {
        const member = await tx.member.findUnique({ where: { id: memberId } });
        if (!member) throw new Error('Member not found');
      }

      const productIds = items.map((item) => item.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) throw new Error(`Product with id ${item.productId} not found`);
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
        }
      }

      const sale = await tx.sale.create({
        data: {
          cashierId,
          memberId: memberId || null,
          total: Math.round(total),
          payment: Math.round(payment),
          change: Math.round(change),
          date: new Date(),
        },
      });

      await Promise.all(items.map(item => 
        tx.saleDetail.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
            subtotal: item.price * item.quantity - (item.discount || 0) * item.quantity,
          },
        })
      ));

      await Promise.all(items.map(item => 
        tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      ));

      return tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          cashier: true,
          member: true,
          saleDetails: { include: { product: true } },
        },
      });
    });

    return NextResponse.json(createdSale);
  } catch (error) {
    console.error('Error processing transaction:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process transaction' },
      { status: 500 }
    );
  }
}

// GET /api/transaksi - Get sales with pagination and optional filters
export async function GET(request) {
  const session = await getSession();
  if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const cashierId = searchParams.get('cashierId');
    const memberId = searchParams.get('memberId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    
    if (cashierId) whereClause.cashierId = cashierId;
    if (memberId) whereClause.memberId = memberId;
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) whereClause.date.gte = new Date(dateFrom);
      if (dateTo) whereClause.date.lte = new Date(dateTo);
    }
    
    const sales = await prisma.sale.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      include: {
        cashier: { select: { id: true, name: true } },
        member: { select: { id: true, name: true } },
        saleDetails: { include: { product: { select: { id: true, name: true } } }, take: 5 },
      },
      orderBy: { date: 'desc' },
    });
    
    const totalCount = await prisma.sale.count({ where: whereClause });
    
    return NextResponse.json({
      sales,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' }, 
      { status: 500 }
    );
  }
}
