// app/api/pelayan/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/pelayan - Get all attendants
export async function GET(request) {
  try {
    const attendants = await prisma.user.findMany({
      where: {
        role: 'ATTENDANT',
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
      }
    });
    
    return NextResponse.json({ attendants });

  } catch (error) {
    console.error('Error fetching attendants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendants' }, 
      { status: 500 }
    );
  }
}