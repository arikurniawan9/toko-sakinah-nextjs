import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

// Helper to get or create settings for a specific store
async function getOrCreateSettings(storeId) {
  let settings = await prisma.setting.findUnique({
    where: { storeId: storeId },
  });

  if (!settings) {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    settings = await prisma.setting.create({
      data: {
        storeId: storeId,
        shopName: store?.name || 'Toko Baru',
        address: store?.address || 'Alamat Toko Anda',
        phone: store?.phone || '081234567890',
        themeColor: '#3c8dbc', // AdminLTE default blue
      },
    });
  }
  return settings;
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.storeId) {
    return NextResponse.json({ error: 'Unauthorized or no store associated' }, { status: 401 });
  }

  try {
    const settings = await getOrCreateSettings(session.user.storeId);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.storeId || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized or no store associated' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const storeId = session.user.storeId;

    const updatedSettings = await prisma.setting.upsert({
      where: { storeId: storeId },
      update: {
        shopName: data.shopName,
        address: data.address,
        phone: data.phone,
        themeColor: data.themeColor,
      },
      create: {
        storeId: storeId,
        shopName: data.shopName,
        address: data.address,
        phone: data.phone,
        themeColor: data.themeColor,
      },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
