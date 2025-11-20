// app/api/check-manager/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    // Cek apakah ada user dengan role MANAGER
    const managerCount = await prisma.user.count({
      where: {
        role: 'MANAGER',
      },
    });

    return NextResponse.json({ 
      exists: managerCount > 0 
    });
  } catch (error) {
    console.error('Error checking manager existence:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}