// app/api/pelayan/notifications/route.js
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
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Jika tidak ada attendantId yang diberikan di query, gunakan dari session
    const targetAttendantId = attendantId || session.user.id;

    // Untuk role ATTENDANT, hanya boleh mengakses notifikasi milik sendiri
    if (session.user.role === 'ATTENDANT' && targetAttendantId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to access these notifications' }, { status: 401 });
    }

    // Ambil suspended sales terkait dengan pelayan ini
    const recentSuspendedSales = await prisma.suspendedSale.findMany({
      where: {
        selectedAttendantId: targetAttendantId,
        storeId: session.user.storeId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit * 2, // Ambil lebih banyak untuk mencari yang telah diproses
    });

    // Ambil penjualan yang telah diproses untuk melihat jika suspended sale telah ditangani
    const processedSales = await prisma.sale.findMany({
      where: {
        attendantId: targetAttendantId,
        storeId: session.user.storeId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Dalam 7 hari terakhir
        }
      },
      select: {
        id: true,
        referenceNumber: true, // Nomor referensi yang mungkin terkait dengan suspended sale
        invoice: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter suspended sales untuk melihat yang mungkin telah diproses
    const notifications = [];
    
    for (const suspendedSale of recentSuspendedSales) {
      let itemsCount = 0;
      try {
        const cartItems = JSON.parse(suspendedSale.cartItems);
        itemsCount = Array.isArray(cartItems) ? cartItems.length : 0;
      } catch (e) {
        console.error('Error parsing cart items:', e);
      }

      // Cek apakah suspended sale ini telah diproses (mungkin tidak langsung terlihat di sale)
      // Dalam implementasi sebenarnya, mungkin ada field khusus atau hubungan antara suspended sale dan sale
      
      // Untuk saat ini, buat notifikasi berdasarkan status suspended sale
      if (suspendedSale.notes) { // Hanya buat notifikasi jika ada catatan (berarti dari pelayan)
        const processedByCashier = processedSales.some(sale => {
          // Dalam implementasi sebenarnya, mungkin ada cara untuk menghubungkan suspended sale dengan sale
          // Untuk demo, asumsikan bahwa penjualan setelah suspended sale dibuat bisa terkait
          return sale.createdAt > suspendedSale.createdAt;
        });

        notifications.push({
          id: `suspended_${suspendedSale.id}`,
          title: processedByCashier ? 'Daftar Belanja Diproses Kasir' : 'Daftar Belanja Ditangguhkan',
          message: processedByCashier 
            ? `Catatan: "${suspendedSale.notes || 'Tanpa catatan'}" telah diproses oleh kasir` 
            : `Menunggu diproses oleh kasir. Catatan: "${suspendedSale.notes || 'Tanpa catatan'}"`,
          status: processedByCashier ? 'completed' : 'suspended',
          timestamp: suspendedSale.createdAt,
          read: false, // Dalam implementasi sebenarnya, ini akan diatur berdasarkan preferensi pengguna
          saleId: suspendedSale.id,
          itemsCount: itemsCount,
          originalNote: suspendedSale.notes
        });
      }
    }

    // Ambil notifikasi terbaru
    const latestNotifications = notifications
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return NextResponse.json({ 
      notifications: latestNotifications,
      count: latestNotifications.length 
    });
  } catch (error) {
    console.error('Error fetching attendant notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}