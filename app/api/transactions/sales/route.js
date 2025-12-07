// app/api/transactions/sales/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const status = searchParams.get('status') || '';
    const paymentMethod = searchParams.get('paymentMethod') || '';
    const minAmount = searchParams.get('minAmount') || '';
    const maxAmount = searchParams.get('maxAmount') || '';

    // Validasi parameter
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Parameter pagination tidak valid' }, { status: 400 });
    }

    // Validasi bahwa min/max amount adalah angka
    if ((minAmount && isNaN(parseInt(minAmount))) || (maxAmount && isNaN(parseInt(maxAmount)))) {
      return NextResponse.json({ error: 'Parameter jumlah harus berupa angka' }, { status: 400 });
    }

    // Ambil storeId dari session
    const storeId = session.user.storeId;
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID tidak ditemukan dalam session' }, { status: 400 });
    }

    const offset = (page - 1) * limit;

    // Bangun kondisi where
    const where = {
      storeId,
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { cashier: { name: { contains: search, mode: 'insensitive' } } },
          { member: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
      ...(startDate && { date: { gte: new Date(startDate) } }),
      ...(endDate && { date: { lte: new Date(endDate) } }),
      ...(status && { status: { contains: status, mode: 'insensitive' } }),
      ...(paymentMethod && { paymentMethod: { contains: paymentMethod, mode: 'insensitive' } }),
      ...(minAmount !== '' && { total: { gte: parseInt(minAmount) } }),
      ...(maxAmount !== '' && { total: { lte: parseInt(maxAmount) } }),
    };

    // Ambil data dan hitung total dalam satu operasi
    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip: offset,
        take: limit,
        include: {
          cashier: {
            select: {
              name: true,
            }
          },
          attendant: {
            select: {
              name: true,
            }
          },
          member: {
            select: {
              name: true,
            }
          },
          saleDetails: {
            include: {
              product: {
                select: {
                  name: true,
                }
              }
            }
          },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.sale.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    // Format data untuk frontend
    const formattedSales = sales.map(sale => ({
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      cashier: sale.cashier,
      attendant: sale.attendant,
      member: sale.member,
      total: sale.total,
      discount: sale.discount,
      additionalDiscount: sale.additionalDiscount,
      tax: sale.tax,
      payment: sale.payment,
      change: sale.change,
      status: sale.status,
      date: sale.date,
      paymentMethod: sale.paymentMethod,
      referenceNumber: sale.referenceNumber,
      items: sale.saleDetails.map(detail => ({
        productName: detail.product?.name || 'Unknown Product',
        quantity: detail.quantity,
        price: detail.price,
        subtotal: detail.subtotal,
      })),
    }));

    const result = {
      transactions: formattedSales,
      pagination: {
        page,
        totalPages,
        totalItems: total,
        hasMore: page < totalPages,
        itemsPerPage: limit
      },
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}