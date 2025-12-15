// app/api/pelayan/stats/route.js
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

    // Untuk role ATTENDANT, hanya boleh mengakses statistik milik sendiri
    if (session.user.role === 'ATTENDANT' && targetAttendantId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized to access these statistics' }, { status: 401 });
    }

    // Ambil statistik untuk pelayan
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Hitung total suspended sales dalam sebulan
    const totalLists = await prisma.suspendedSale.count({
      where: {
        selectedAttendantId: targetAttendantId,
        storeId: session.user.storeId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Ambil daftar suspended sales untuk perhitungan statistik lain
    const suspendedSales = await prisma.suspendedSale.findMany({
      where: {
        selectedAttendantId: targetAttendantId,
        storeId: session.user.storeId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        cartItems: true,
      },
    });

    // Hitung total item dan hitung produk terlaris
    let totalItems = 0;
    const productCount = {};

    suspendedSales.forEach(sale => {
      try {
        const items = JSON.parse(sale.cartItems);
        if (Array.isArray(items)) {
          items.forEach(item => {
            totalItems += item.quantity || 0;
            if (productCount[item.name]) {
              productCount[item.name] += item.quantity || 0;
            } else {
              productCount[item.name] = item.quantity || 0;
            }
          });
        }
      } catch (e) {
        console.error('Error parsing cart items:', e);
      }
    });

    const avgItems = totalLists > 0 ? totalItems / totalLists : 0;

    // Cari produk terlaris
    let topProduct = 'Tidak Ada';
    let maxQuantity = 0;
    for (const [productName, quantity] of Object.entries(productCount)) {
      if (quantity > maxQuantity) {
        maxQuantity = quantity;
        topProduct = productName;
      }
    }

    // Hitung nilai rata-rata daftar belanja
    let totalValue = 0;
    suspendedSales.forEach(sale => {
      try {
        const items = JSON.parse(sale.cartItems);
        if (Array.isArray(items)) {
          items.forEach(item => {
            totalValue += (item.price || 0) * (item.quantity || 0);
          });
        }
      } catch (e) {
        console.error('Error calculating value:', e);
      }
    });

    const avgValue = totalLists > 0 ? Math.round(totalValue / totalLists) : 0;

    // Ambil penjualan yang telah diproses untuk menghitung konversi
    const processedSales = await prisma.sale.count({
      where: {
        attendantId: targetAttendantId,
        storeId: session.user.storeId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const conversionRate = totalLists > 0 ? Math.round((processedSales / totalLists) * 100) : 0;

    // Ambil total penjualan hari ini
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todaySales = await prisma.suspendedSale.count({
      where: {
        selectedAttendantId: targetAttendantId,
        storeId: session.user.storeId,
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalLists,
        avgValue,
        topProduct,
        conversionRate,
        todaySales,
        avgItems: Math.round(avgItems * 10) / 10, // dibulatkan ke 1 desimal
        totalItems
      }
    });
  } catch (error) {
    console.error('Error fetching attendant statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch attendant statistics' }, { status: 500 });
  }
}