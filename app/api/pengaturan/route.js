import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

// Helper to get or create settings
async function getOrCreateSettings() {
  let settings = await prisma.setting.findFirst();
  if (!settings) {
    settings = await prisma.setting.create({
      data: {
        shopName: 'Toko Sakinah',
        address: 'Alamat Toko Anda',
        phone: '081234567890',
        themeColor: '#3c8dbc', // AdminLTE default blue
      },
    });
  }
  return settings;
}

export async function GET() {
  try {
    const settings = await getOrCreateSettings();
    // Only return public settings (not sensitive data)
    return NextResponse.json({
      shopName: settings.shopName,
      address: settings.address,
      phone: settings.phone,
      themeColor: settings.themeColor
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const currentSettings = await getOrCreateSettings();

    const updatedSettings = await prisma.setting.update({
      where: { id: currentSettings.id },
      data: {
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
