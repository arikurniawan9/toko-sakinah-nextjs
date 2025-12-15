// app/api/pelayan/history/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !['ADMIN', 'ATTENDANT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const attendantId = searchParams.get('attendantId');

    // Jika tidak ada attendantId yang diberikan di query, gunakan dari session
    const targetAttendantId = attendantId || session.user.id;

    // Untuk role ATTENDANT, hanya boleh mengakses histori milik sendiri
    if (session.user.role === 'ATTENDANT' && targetAttendantId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to access this history' }, { status: 401 });
    }

    // Ambil suspended sales untuk pelayan ini
    const suspendedSales = await prisma.suspendedSale.findMany({
      where: {
        selectedAttendantId: targetAttendantId,
        storeId: session.user.storeId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Ambil maksimal 50 entri terbaru
    });

    // Transformasi data untuk histori
    const history = suspendedSales.map(sale => {
      let itemsCount = 0;
      try {
        const cartItems = JSON.parse(sale.cartItems);
        itemsCount = Array.isArray(cartItems) ? cartItems.length : 0;
      } catch (e) {
        console.error('Error parsing cart items:', e);
      }

      return {
        id: sale.id,
        note: sale.notes,
        itemsCount,
        status: 'suspended', // Status default untuk suspended sale
        createdAt: sale.createdAt,
        completedAt: sale.completedAt || null,
        originalSaleId: sale.originalSaleId || null, // Jika suspended sale ini berasal dari penjualan sebenarnya
      };
    });

    // Ambil penjualan yang telah diproses dari tabel sale untuk melengkapi histori
    const processedSales = await prisma.sale.findMany({
      where: {
        attendantId: targetAttendantId,
        storeId: session.user.storeId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, // Ambil 20 penjualan terbaru
    });

    // Tambahkan penjualan yang telah selesai
    const completedSales = processedSales.map(sale => ({
      id: sale.id,
      note: `Penjualan Selesai - ${sale.invoice || 'Tanpa Nomor Invoice'}`,
      itemsCount: sale.saleDetails?.length || 0,
      status: 'completed_by_cashier',
      createdAt: sale.createdAt,
      completedAt: sale.completedAt || sale.createdAt,
    }));

    // Gabungkan dan urutkan berdasarkan waktu pembuatan (terbaru dulu)
    const allHistory = [...history, ...completedSales]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json({ history: allHistory });
  } catch (error) {
    console.error('Error fetching attendant history:', error);
    return NextResponse.json({ error: 'Failed to fetch attendant history' }, { status: 500 });
  }
}