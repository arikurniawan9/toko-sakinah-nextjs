// app/api/pelayan/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const storeId = session.user.storeId;
    const { id: attendantId } = params;
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const offset = (page - 1) * limit;


    if (!storeId) {
      return NextResponse.json({ error: 'Store ID not found in session' }, { status: 400 });
    }

    if (!attendantId) {
      return NextResponse.json({ error: 'Attendant ID is required' }, { status: 400 });
    }

    // 1. Fetch attendant details
    const attendant = await prisma.user.findFirst({
      where: {
        id: attendantId,
        storeUsers: {
          some: {
            storeId: storeId,
            role: ROLES.ATTENDANT,
          },
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        employeeNumber: true,
        status: true, // Include status field
        createdAt: true,
      },
    });

    if (!attendant) {
      return NextResponse.json({ error: 'Pelayan tidak ditemukan' }, { status: 404 });
    }

    // 2. Fetch transactions for the attendant with pagination
    const transactions = await prisma.sale.findMany({
      where: {
        storeId: storeId,
        attendantId: attendantId,
      },
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        saleDetails: {
          include: {
            product: {
              select: {
                name: true,
                productCode: true,
              }
            }
          }
        }
      },
    });

    // Transform data to match frontend requirements
    const salesData = transactions.map(transaction => ({
      id: transaction.id,
      invoice: transaction.invoiceNumber,
      invoiceNumber: transaction.invoiceNumber,
      total: transaction.total,
      paymentMethod: transaction.paymentMethod,
      status: transaction.status,
      createdAt: transaction.createdAt,
      saleDetails: transaction.saleDetails,
    }));

    // 3. Get total count of transactions for pagination
    const totalTransactions = await prisma.sale.count({
      where: {
        storeId: storeId,
        attendantId: attendantId,
      },
    });

    // 4. Get total sales value
    const totalSales = await prisma.sale.aggregate({
      _sum: {
        total: true,
      },
      where: {
        storeId: storeId,
        attendantId: attendantId,
      },
    });

    return NextResponse.json({
      attendant,
      transactions: salesData,
      pagination: {
        page,
        limit,
        total: totalTransactions,
        totalPages: Math.ceil(totalTransactions / limit),
      },
      summary: {
        totalSalesValue: totalSales._sum.total || 0,
      }
    });

  } catch (error) {
    console.error('Error fetching attendant details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendant details' },
      { status: 500 }
    );
  }
}
