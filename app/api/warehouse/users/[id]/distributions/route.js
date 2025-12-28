import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const { id: userId } = params;

    if (!session || ![ROLES.WAREHOUSE, ROLES.MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const distributions = await prisma.warehouseDistribution.findMany({
      where: {
        distributedBy: userId,
      },
      include: {
        store: true,
        product: true,
      },
      orderBy: {
        distributedAt: 'desc',
      },
    });

    // Group distributions by a composite key of date and store to identify a single transaction
    const groupedTransactions = distributions.reduce((acc, dist) => {
      // A transaction is defined as all items sent to a specific store at the exact same time
      const groupKey = `${dist.distributedAt.toISOString()}-${dist.storeId}`;

      if (!acc[groupKey]) {
        // Generate invoice number if not available
        const dateStr = new Date(dist.distributedAt).toISOString().split('T')[0].replace(/-/g, '');
        const storeCode = dist.store.code.replace(/\s+/g, '').toUpperCase();
        const timestamp = dist.distributedAt.getTime().toString().slice(-4); // Use last 4 digits of timestamp
        const generatedInvoiceNumber = dist.invoiceNumber || `D-${dateStr}-${storeCode}-${timestamp}`;

        acc[groupKey] = {
          invoiceNumber: generatedInvoiceNumber, // Use existing invoice number or generate one
          id: dist.id,
          distributedAt: dist.distributedAt,
          store: dist.store,
          status: dist.status,
          items: [],
          totalAmount: 0,
          totalItems: 0,
        };
      }

      acc[groupKey].items.push(dist);
      acc[groupKey].totalAmount += dist.totalAmount;
      acc[groupKey].totalItems += dist.quantity;
      return acc;
    }, {});

    const distributionGroups = Object.values(groupedTransactions);

    return NextResponse.json({ distributions: distributionGroups });
  } catch (error) {
    console.error('Error fetching attendant distributions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
