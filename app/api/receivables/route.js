// app/api/receivables/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['CASHIER', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || ''; // UNPAID, PARTIALLY_PAID, PAID
    const memberId = searchParams.get('memberId') || ''; // Filter berdasarkan member
    const search = searchParams.get('search') || ''; // Search by invoice number

    const skip = (page - 1) * limit;

    // Bangun where clause
    let whereClause = {
      OR: status ? [{ status: status }] : [{ status: { in: ['UNPAID', 'PARTIALLY_PAID'] } }], // Default hanya tampilkan yang belum lunas
    };

    if (memberId) {
      whereClause.memberId = memberId;
    }

    if (search) {
      whereClause.sale = {
        invoiceNumber: { contains: search }
      };
    }

    const [receivables, total] = await prisma.$transaction([
      prisma.receivable.findMany({
        where: whereClause,
        include: {
          sale: {
            include: {
              member: true,
              cashier: true,
              attendant: true
            }
          },
          member: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: skip,
        take: limit
      }),
      prisma.receivable.count({ where: whereClause })
    ]);

    // Tambahkan informasi jumlah yang masih harus dibayar
    const receivablesWithAmountDue = receivables.map(receivable => ({
      ...receivable,
      remainingAmount: receivable.amountDue - receivable.amountPaid
    }));

    return NextResponse.json({
      receivables: receivablesWithAmountDue,
      pagination: {
        total: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching receivables:', error);
    return NextResponse.json({ error: 'Gagal mengambil data hutang' }, { status: 500 });
  }
}