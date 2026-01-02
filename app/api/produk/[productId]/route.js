import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request, { params }) {
  const session = await getSession();
  if (!session || !['ADMIN', 'CASHIER', 'ATTENDANT', 'WAREHOUSE', 'MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = params;

  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        storeId: session.user.storeId, // Ensure product belongs to the user's store
      },
      select: {
        id: true,
        name: true,
        productCode: true,
        stock: true,
        retailPrice: true,
        silverPrice: true,
        goldPrice: true,
        platinumPrice: true,
        // Include any other fields necessary for the cashier's cart calculations
        image: true,
        category: {
          select: {
            name: true, // Select the name from the related Category model
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product details:', error);
    return NextResponse.json({ error: 'Failed to fetch product details' }, { status: 500 });
  }
}