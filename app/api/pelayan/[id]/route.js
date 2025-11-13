import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

// GET /api/pelayan/[id]
export async function GET(request, { params }) {
  const { id } = params;

  try {
    const pelayan = await prisma.user.findUnique({
      where: { id: id },
      include: {
        attendantSales: {
          orderBy: {
            date: 'desc',
          },
          include: {
            member: true, // Include member details in the sales
          },
        },
      },
    });

    if (!pelayan) {
      return NextResponse.json({ error: 'Pelayan not found' }, { status: 404 });
    }

    // Calculate total sales
    const totalSales = pelayan.attendantSales.reduce((acc, sale) => acc + sale.total, 0);

    const responseData = {
      ...pelayan,
      totalSales,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching pelayan details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}