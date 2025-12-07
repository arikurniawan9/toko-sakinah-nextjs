import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import bcrypt from 'bcryptjs';

// GET a specific user by ID
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id || session.user.role !== ROLES.MANAGER) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        stores: {
          select: {
            storeId: true,
            role: true,
            assignedAt: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Do not expose password hash
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT (update) a specific user by ID
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id || session.user.role !== ROLES.MANAGER) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = params;

  // You can't edit your own account through this endpoint
  if (userId === session.user.id) {
    return NextResponse.json({ error: "You cannot edit your own account here. Please use the profile page." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, employeeNumber, phone, address, role, status, password, storeId, storeRole } = body;

    // Update basic user information
    const updateData = {
      name,
      employeeNumber,
      phone,
      address,
      role,
      status,
    };

    // If a new password is provided, hash it
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update basic user information first
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // If storeId and storeRole are provided, update the user-store relationship
    if (storeId && storeRole) {
      // Check if the target store exists
      const targetStore = await prisma.store.findUnique({
        where: { id: storeId }
      });

      if (!targetStore) {
        return NextResponse.json({ error: 'Toko tujuan tidak ditemukan' }, { status: 404 });
      }

      // Check if the store role is valid
      const validRoles = [ROLES.ADMIN, ROLES.CASHIER, ROLES.ATTENDANT];
      if (!validRoles.includes(storeRole)) {
        return NextResponse.json({ error: 'Role toko tidak valid' }, { status: 400 });
      }

      // Update or create the user-store relationship
      const assignedById = session.user ? session.user.id : null;

      if (!assignedById) {
        return NextResponse.json({ error: 'Session tidak valid' }, { status: 401 });
      }

      await prisma.storeUser.upsert({
        where: {
          userId_storeId: {
            userId: userId,
            storeId: storeId
          }
        },
        update: {
          role: storeRole,
          assignedBy: assignedById,
          assignedAt: new Date()
        },
        create: {
          userId: userId,
          storeId: storeId,
          role: storeRole,
          assignedBy: assignedById,
          status: 'ACTIVE'
        }
      });
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    // Prisma error for record not found
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
