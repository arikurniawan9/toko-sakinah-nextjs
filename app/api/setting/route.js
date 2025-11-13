// app/api/setting/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['CASHIER', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Ambil pengaturan toko, buat jika belum ada
    let setting = await prisma.setting.findFirst();
    
    if (!setting) {
      // Buat setting default jika belum ada
      setting = await prisma.setting.create({
        data: {
          shopName: 'TOKO SAKINAH',
          address: 'Jl. Raya No. 123, Kota Anda',
          phone: '0812-3456-7890',
        }
      });
    }

    return NextResponse.json(setting, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Gagal mengambil pengaturan toko' }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { shopName, address, phone, themeColor } = body;

    // Cek apakah setting sudah ada
    const existingSetting = await prisma.setting.findFirst();

    let setting;
    if (existingSetting) {
      // Update setting yang sudah ada
      setting = await prisma.setting.update({
        where: { id: existingSetting.id },
        data: {
          shopName,
          address,
          phone,
          themeColor,
        }
      });
    } else {
      // Buat setting baru jika belum ada
      setting = await prisma.setting.create({
        data: {
          shopName,
          address,
          phone,
          themeColor,
        }
      });
    }

    return NextResponse.json(setting, { status: 200 });
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pengaturan toko' }, { status: 500 });
  }
}