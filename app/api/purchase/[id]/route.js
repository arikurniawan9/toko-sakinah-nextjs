
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/purchase/[id]
export async function GET(request, { params }) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: id },
      include: {
        supplier: true,
        user: { select: { name: true } },
        items: {
          include: {
            product: {
              select: {
                name: true,
                productCode: true,
              },
            },
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    return NextResponse.json(purchase);
  } catch (error) {
    console.error(`Error fetching purchase ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase details.' },
      { status: 500 }
    );
  }
}
