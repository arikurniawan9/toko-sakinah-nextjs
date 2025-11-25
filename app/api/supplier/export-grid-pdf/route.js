import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const shopInfo = await prisma.setting.findFirst(); // Assuming a settings table for shop info

    const suppliers = await prisma.supplier.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });

    const exportDate = new Date().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return NextResponse.json({ shopInfo, suppliers, exportDate }, { status: 200 });
  } catch (error) {
    console.error('Error fetching suppliers for grid PDF export:', error);
    return NextResponse.json({ error: 'Failed to fetch supplier data for PDF export.' }, { status: 500 });
  }
}
