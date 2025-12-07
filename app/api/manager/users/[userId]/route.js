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

  if (userId === session.user.id) {
    return NextResponse.json({ error: "You cannot edit your own account here. Please use the profile page." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, username, employeeNumber, phone, address, role, status, password } = body;

    const userToUpdate = await prisma.user.findUnique({ where: { id: userId } });
    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only allow updating global roles via this endpoint
    const validGlobalRoles = [ROLES.WAREHOUSE, ROLES.MANAGER];
    if (role && !validGlobalRoles.includes(role)) {
       return NextResponse.json({ error: `Cannot assign a store-specific role via this endpoint.` }, { status: 400 });
    }

    const updateData = {
      name,
      username,
      employeeNumber,
      phone,
      address,
      role,
      status,
    };

    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
