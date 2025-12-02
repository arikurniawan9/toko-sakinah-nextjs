import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/authOptions';
import { PrismaClient } from '@prisma/client';

// Tell Next.js this route is dynamic and should not be statically generated
export const dynamic = 'force-dynamic';

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

    // Only allow cashier and admin access
    if (session.user.role !== 'CASHIER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    const page = parseInt(searchParams.get('page')) || 1;
    const date = searchParams.get('date'); // Optional date filter
    const search = searchParams.get('search'); // Optional search term

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build where clause
    let whereClause = {
      cashierId: session.user.id, // Only transactions by this cashier
      storeId: session.user.storeId, // Also filter by store ID to maintain multi-tenant isolation
    };

    // Add date filter if provided
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      whereClause.date = {
        gte: startDate,
        lte: endDate
      };
    }

    // Add search filter if provided (searches by invoice number)
    if (search) {
      whereClause.invoiceNumber = {
        contains: search,
      };
    }

    // Fetch sales transactions for this cashier with related data
    const [sales, totalCount] = await Promise.all([
      prisma.sale.findMany({
        where: whereClause,
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
        skip: offset,
        take: limit,
      }),
      prisma.sale.count({ where: whereClause })
    ]);

    // Transform data to match frontend requirements
    const transformedSales = sales.map(sale => ({
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
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
      status: sale.status || 'completed',
      paymentMethod: sale.paymentMethod || 'CASH',
      items: sale.saleDetails.map(detail => ({
        productName: detail.product?.name || 'Unknown Product',
        quantity: detail.quantity,
        price: detail.price,
        subtotal: detail.subtotal,
      })),
    }));

    return NextResponse.json({
      sales: transformedSales,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching cashier sales:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}