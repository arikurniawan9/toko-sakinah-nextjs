import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.storeId) {
    return NextResponse.json({ error: 'Unauthorized or user not associated with a store.' }, { status: 401 });
  }

  const { code } = params;
  const { storeId } = session.user;

  if (!code) {
    return NextResponse.json({ error: 'Product code is required.' }, { status: 400 });
  }

  try {
    const product = await prisma.product.findFirst({
      where: {
        AND: [
          { storeId: storeId },
          { productCode: code }
        ]
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found in this store.' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product by code:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
