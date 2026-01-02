import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const attendantId = searchParams.get('attendantId');

  if (!attendantId) {
    return NextResponse.json({ message: 'Attendant ID is required' }, { status: 400 });
  }

  // Define start and end of today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    // Fetch transactions for today by the attendant
    const transactions = await prisma.transaction.findMany({
      where: {
        attendantId: attendantId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: 'COMPLETED', // Only consider completed transactions for statistics
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    let todaySales = transactions.length;
    let todayItems = 0;
    let todayRevenue = 0;

    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        todayItems += item.quantity;
        todayRevenue += item.quantity * item.price;
      });
    });

    // For conversion rate, we might need more context (e.g., total lists created vs. completed sales).
    // For now, let's make a simple assumption or leave it as a placeholder.
    // A proper conversion rate would require tracking "lists created" vs. "lists completed as sales".
    // For demo/initial implementation, we can make it proportional or a fixed high number for completed sales.
    const todayConversion = todaySales > 0 ? 100 : 0; // If there are sales, conversion is 100% for completed ones. More complex logic needed for actual lead conversion.


    return NextResponse.json({
      dailySummary: {
        todaySales,
        todayItems,
        todayRevenue,
        todayConversion,
      },
    });

  } catch (error) {
    console.error('Error fetching daily summary:', error);
    return NextResponse.json({ message: 'Failed to fetch daily summary', error: error.message }, { status: 500 });
  }
}
