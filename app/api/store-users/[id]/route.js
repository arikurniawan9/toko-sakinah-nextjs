// app/api/store-users/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// GET /api/store-users/[id] - Get a single user by ID for current store
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For multi-tenant system, get store ID from session
    const storeId = session.user.storeId;
    
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID not found in session' }, { status: 400 });
    }

    const { id } = params;

    // Get user from the current store context
    const storeUser = await prisma.storeUser.findFirst({
      where: {
        userId: id,
        storeId: storeId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            employeeNumber: true,
            code: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      }
    });

    if (!storeUser) {
      return NextResponse.json({ error: 'User tidak ditemukan di toko ini' }, { status: 404 });
    }

    // Return user data with role from store context
    return NextResponse.json({
      ...storeUser.user,
      role: storeUser.role
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/store-users/[id] - Update a single user for current store
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For multi-tenant system, get store ID from session
    const storeId = session.user.storeId;
    
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID not found in session' }, { status: 400 });
    }

    const { id } = params;
    const { name, username, employeeNumber, password, role } = await request.json();

    // Validation
    if (!id) {
      return NextResponse.json(
        { error: 'ID user wajib disediakan' },
        { status: 400 }
      );
    }

    if (!name || !username || !role) {
      return NextResponse.json(
        { error: 'Nama, username, dan role wajib diisi' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['ADMIN', 'CASHIER', 'ATTENDANT'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Role tidak valid' },
        { status: 400 }
      );
    }

    // Check if user exists and is associated with the current store
    const storeUser = await prisma.storeUser.findFirst({
      where: {
        userId: id,
        storeId: storeId,
      }
    });

    if (!storeUser) {
      return NextResponse.json(
        { error: 'User tidak ditemukan di toko ini' },
        { status: 404 }
      );
    }

    // Check if username already exists (excluding current user)
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username.trim(),
        id: { not: id }  // Exclude current user
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 400 }
      );
    }

    // Prepare update data for user table
    const updateUserData = {
      name: name.trim(),
      username: username.trim(),
      employeeNumber: employeeNumber ? employeeNumber.trim() : null,
      code: code ? code.trim() : null,
    };

    // Add password if provided
    if (password) {
      const bcrypt = await import('bcryptjs');
      updateUserData.password = await bcrypt.hash(password, 10);
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateUserData
    });

    // Update the store-user relationship with new role
    await prisma.storeUser.update({
      where: {
        userId_storeId: {
          userId: id,
          storeId: storeId,
        }
      },
      data: {
        role: role, // Update role in this specific store
        status: 'AKTIF', // Ensure the status is active
      }
    });

    // Don't return the password hash
    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json({...userWithoutPassword, role}); // Return user data with store role
  } catch (error) {
    console.error('Error updating user:', error);

    // Check if it's a Prisma error (e.g., record not found)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/store-users/[id] - Remove a single user from current store
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For multi-tenant system, get store ID from session
    const storeId = session.user.storeId;
    
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID not found in session' }, { status: 400 });
    }

    const { id } = params;

    // Check if user exists in the current store
    const storeUser = await prisma.storeUser.findFirst({
      where: {
        userId: id,
        storeId: storeId,
      }
    });

    if (!storeUser) {
      return NextResponse.json({ error: 'User tidak ditemukan di toko ini' }, { status: 404 });
    }

    // Remove user from the store by setting status to INACTIVE
    await prisma.storeUser.update({
      where: {
        userId_storeId: {
          userId: id,
          storeId: storeId,
        }
      },
      data: {
        status: 'TIDAK AKTIF',
      }
    });

    return NextResponse.json({ message: 'User berhasil dinonaktifkan dari toko ini' });
  } catch (error) {
    console.error('Error removing user from store:', error);

    return NextResponse.json(
      { error: 'Failed to remove user from store' },
      { status: 500 }
    );
  }
}