// app/api/stores/current/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['CASHIER', 'ADMIN', 'ATTENDANT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Cek apakah pengguna memiliki akses ke toko
  if (!session.user.storeId) {
    return NextResponse.json({ error: 'User tidak memiliki akses ke toko' }, { status: 400 });
  }

  try {
    // Ambil informasi toko berdasarkan storeId dari session
    const store = await prisma.store.findUnique({
      where: {
        id: session.user.storeId
      },
      include: {
        settings: true // Include setting if available
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Toko tidak ditemukan' }, { status: 404 });
    }

    // Return store information along with any available settings
    const storeInfo = {
      name: store.name, // Gunakan nama asli toko dari database
      address: store.settings?.address || store.address,
      phone: store.settings?.phone || store.phone,
      email: store.email,
      code: store.code,
      id: store.id, // Tambahkan ID toko
      description: store.description,
    };

    return NextResponse.json(storeInfo, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch current store info:', error);
    return NextResponse.json({ error: 'Gagal mengambil informasi toko' }, { status: 500 });
  }
}