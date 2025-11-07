// app/api/transaksi/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/transaksi - Process a sale transaction
export async function POST(request) {
  try {
    const { cashierId, memberId, items, total, payment, change } = await request.json();
    
    if (!cashierId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cashier ID and items array are required' }, 
        { status: 400 }
      );
    }

    // Validate cashier exists
    const cashier = await prisma.user.findUnique({
      where: { id: cashierId }
    });

    if (!cashier) {
      return NextResponse.json(
        { error: 'Cashier not found' }, 
        { status: 404 }
      );
    }

    // Validate member if provided
    let member = null;
    if (memberId) {
      member = await prisma.member.findUnique({
        where: { id: memberId }
      });

      if (!member) {
        return NextResponse.json(
          { error: 'Member not found' }, 
          { status: 404 }
        );
      }
    }

    // Validate all products exist and have sufficient stock
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product with id ${item.productId} not found` }, 
          { status: 404 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` }, 
          { status: 400 }
        );
      }
    }

    // Create the sale record
    const sale = await prisma.sale.create({
      data: {
        cashierId,
        memberId: member?.id || null,
        total: Math.round(total),
        payment: Math.round(payment),
        change: Math.round(change),
        date: new Date()
      }
    });

    // Create sale details and update stock
    for (const item of items) {
      // Create sale detail
      await prisma.saleDetail.create({
        data: {
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
          subtotal: item.price * item.quantity - (item.discount || 0) * item.quantity
        }
      });

      // Update product stock
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity }
        }
      });
    }

    // Fetch the created sale with details to return
    const createdSale = await prisma.sale.findUnique({
      where: { id: sale.id },
      include: {
        cashier: true,
        member: true,
        saleDetails: {
          include: {
            product: true
          }
        }
      }
    });

    return NextResponse.json(createdSale);
  } catch (error) {
    console.error('Error processing transaction:', error);
    return NextResponse.json(
      { error: 'Failed to process transaction' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET /api/transaksi - Get sales with pagination and optional filters
export async function GET(request) {
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
    
    if (cashierId) {
      whereClause.cashierId = cashierId;
    }
    
    if (memberId) {
      whereClause.memberId = memberId;
    }
    
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) {
        whereClause.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        whereClause.date.lte = new Date(dateTo);
      }
    }
    
    const sales = await prisma.sale.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      include: {
        cashier: {
          select: {
            id: true,
            name: true
          }
        },
        member: {
          select: {
            id: true,
            name: true
          }
        },
        saleDetails: {
          include: {
            product: {
              select: {
                id: true,
                name: true
              }
            }
          },
          take: 5 // Limit details for performance
        }
      },
      orderBy: { date: 'desc' }
    });
    
    const totalCount = await prisma.sale.count({ where: whereClause });
    
    return NextResponse.json({
      sales,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}