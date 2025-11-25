// app/api/supplier/check-duplicates/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { names } = await request.json(); // Ini sebenarnya berisi kode supplier karena columnMapping di ImportModal

    // Get storeId based on user's assigned store
    const storeUser = await prisma.storeUser.findFirst({
      where: {
        userId: session.user.id,
        role: { in: ['ADMIN', 'MANAGER'] } // Only admin/manager can check duplicates
      },
      select: {
        storeId: true
      }
    });

    if (!storeUser) {
      return NextResponse.json({ error: 'User does not have access to any store' }, { status: 400 });
    }

    if (!Array.isArray(names) || names.length === 0) {
      return NextResponse.json({ duplicates: [] }, { status: 200 });
    }

    // Cek apakah kode-kode supplier yang dikirim sudah ada di database untuk store yang sama
    const existingSuppliers = await prisma.supplier.findMany({
      where: {
        code: {
          in: names // Ini berisi kode supplier karena ImportModal mengirimkan nilai dari field 'code'
        },
        storeId: storeUser.storeId
      },
      select: {
        id: true,
        code: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      duplicates: existingSuppliers
    });
  } catch (error) {
    console.error('Error checking duplicate suppliers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}