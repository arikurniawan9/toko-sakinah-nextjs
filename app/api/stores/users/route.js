// app/api/stores/users/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, storeId, role, assignedBy } = body;

    if (!userId || !storeId || !role) {
      return NextResponse.json({ error: 'User ID, Store ID, dan Role wajib diisi' }, { status: 400 });
    }

    // Validasi role
    const validRoles = [ROLES.ADMIN, ROLES.CASHIER, ROLES.ATTENDANT];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 });
    }

    // Hanya MANAGER atau ADMIN toko yang bisa menambahkan user
    if (session.user.role !== ROLES.MANAGER) {
      if (session.user.role !== ROLES.ADMIN || session.user.storeId !== storeId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Cek apakah user dan toko ada
    const [existingUser, existingStore] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.store.findUnique({ where: { id: storeId } })
    ]);

    if (!existingUser || !existingStore) {
      return NextResponse.json({ error: 'User atau toko tidak ditemukan' }, { status: 404 });
    }

    // Buat relasi user-toko
    const storeUser = await prisma.storeUser.create({
      data: {
        userId,
        storeId,
        role,
        assignedBy: assignedBy || session.user.id,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      storeUser,
      message: 'User berhasil ditambahkan ke toko' 
    });
  } catch (error) {
    console.error('Error adding user to store:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}