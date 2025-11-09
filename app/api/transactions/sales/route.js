import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/authOptions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only allow admin access
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Fetch sales transactions with related data
    const sales = await prisma.sale.findMany({
      include: {
        cashier: true,
        attendant: true,
        member: true,
        saleDetails: {
          include: {
            product: true,
          }
        }
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Transform data to match frontend requirements
    const transformedSales = sales.map(sale => ({
      id: sale.id,
      cashierName: sale.cashier?.name || 'Unknown',
      attendantName: sale.attendant?.name || null,
      customerName: sale.member?.name || '-', // Using member as customer
      date: sale.date,
      totalAmount: sale.total,
      discount: sale.discount || 0, // Member discount
      additionalDiscount: sale.additionalDiscount || 0, // Additional discount
      tax: sale.tax || 0, // Tax if applicable
      payment: sale.payment || 0, // Amount paid
      change: sale.change || 0, // Change given
      status: 'completed', // All sales are completed by default
      items: sale.saleDetails.map(detail => ({
        productName: detail.product?.name || 'Unknown Product',
        quantity: detail.quantity,
        price: detail.price,
        subtotal: detail.subtotal,
      })),
    }));

    return NextResponse.json(transformedSales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}