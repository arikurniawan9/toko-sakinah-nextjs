// app/api/produk/low-stock/route.js
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { ROLES } from '@/lib/constants';

export async function GET(request) {
  try {
    // Get session to determine store access
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow cashier, admin, and manager roles to access this data
    const allowedRoles = [ROLES.CASHIER, ROLES.ADMIN, ROLES.MANAGER];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // For multi-tenant system, get store ID from session
    const storeId = session.user.storeId;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID not found in session' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const threshold = parseInt(searchParams.get('threshold')) || 10; // Default to 10 if not provided

    const lowStockProducts = await prisma.product.findMany({
      where: {
        storeId, // Filter by store ID
        stock: {
          lt: threshold, // Less than the specified threshold
        },
      },
      select: {
        id: true,
        name: true,
        productCode: true,
        stock: true,
      },
      orderBy: {
        stock: 'asc', // Order by lowest stock first
      },
    });

    return NextResponse.json({ lowStockProducts });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch low stock products' },
      { status: 500 }
    );
  }
}
