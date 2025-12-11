// app/api/store-users/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { ROLES } from '@/lib/constants';

// GET /api/store-users - Get users for current store with pagination and search
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['CASHIER', 'ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const excludeRole = searchParams.get('excludeRole') || '';
    const offset = (page - 1) * limit;

    let whereClause = {};

    if (session.user.role === 'MANAGER') {
      // Manager can see users across all stores, filtered by role if specified
      whereClause = {};
    } else {
      // Other roles are restricted to their own store
      const storeId = session.user.storeId;
      if (!storeId) {
        return NextResponse.json({ error: 'Store ID not found in session' }, { status: 400 });
      }
      whereClause.storeId = storeId;
    }

    // Add role filter if specified
    if (role) {
      whereClause.role = role;
    }

    // Add exclude role filter if specified
    if (excludeRole) {
      whereClause.role = {
        not: excludeRole
      };
    } else if (!role) {
      // When no specific role is requested, still exclude ATTENDANT for general user view
      whereClause.role = {
        not: 'ATTENDANT'
      };
    }

    if (search) {
      whereClause.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      };
    }
    
    const usersData = await prisma.storeUser.findMany({
      where: whereClause,
      select: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            employeeNumber: true,
            code: true,
            address: true,
            phone: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        role: true,
      },
      skip: offset,
      take: limit,
      orderBy: { user: { createdAt: 'desc' } },
    });

    const totalCount = await prisma.storeUser.count({
      where: whereClause,
    });

    const users = usersData.map(storeUser => ({
      ...storeUser.user,
      role: storeUser.role,
    }));

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/store-users - Create a new user for current store
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow ADMIN and MANAGER to create users (CASHIER shouldn't be able to create users)
    if (session.user.role !== ROLES.ADMIN && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // For multi-tenant system, get store ID from session
    const storeId = session.user.storeId;
    
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID not found in session' }, { status: 400 });
    }

    const { name, username, employeeNumber, code, password, role, address, phone } = await request.json();

    // Validation
    if (!name || !username || !password || !role) {
      return NextResponse.json(
        { error: 'Nama, username, password, dan role wajib diisi' },
        { status: 400 }
      );
    }

    // Validate role - only allow store-specific roles, not global roles
    const validStoreRoles = [ROLES.ADMIN, ROLES.CASHIER, ROLES.ATTENDANT];
    if (!validStoreRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Role tidak valid untuk toko ini' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: username.trim() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 400 }
      );
    }

    // Check if code already exists for this store (multi-tenant)
    if (code) {
      const existingUserCode = await prisma.storeUser.findFirst({
        where: {
          storeId: storeId,
          user: {
            code: code.trim()
          }
        }
      });

      if (existingUserCode) {
        return NextResponse.json(
          { error: 'Kode pengguna sudah digunakan di toko ini' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        employeeNumber: employeeNumber ? employeeNumber.trim() : null,
        code: code ? code.trim() : null, // Use the provided code if available
        password: hashedPassword,
        address,
        phone,
        role: role, // Set role in user table to match the store role
        status: 'AKTIF',
      }
    });

    // Create store-user relationship with specified role for this store
    await prisma.storeUser.create({
      data: {
        userId: user.id,
        storeId: storeId,
        role: role, // Role in the specific store
        assignedBy: session.user.id,
        status: 'AKTIF',
      }
    });

    // Don't return the password hash
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({...userWithoutPassword, role}); // Return user data with store role
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PUT /api/store-users/[id] - Update a user for current store
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow ADMIN and MANAGER to update users (CASHIER shouldn't be able to update users)
    if (session.user.role !== ROLES.ADMIN && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // For multi-tenant system, get store ID from session
    const storeId = session.user.storeId;
    
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID not found in session' }, { status: 400 });
    }

    const { id, name, username, employeeNumber, password, role, code } = await request.json();

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

    // Validate role - only allow store-specific roles, not global roles
    const validStoreRoles = [ROLES.ADMIN, ROLES.CASHIER, ROLES.ATTENDANT];
    if (!validStoreRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Role tidak valid untuk toko ini' },
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

    // Check if code already exists for this store (excluding current user) (multi-tenant)
    if (code) {
      const existingUserCode = await prisma.storeUser.findFirst({
        where: {
          storeId: storeId,
          userId: { not: id }, // Exclude current user
          user: {
            code: code.trim()
          }
        }
      });

      if (existingUserCode) {
        return NextResponse.json(
          { error: 'Kode pengguna sudah digunakan di toko ini' },
          { status: 400 }
        );
      }
    }

    // Prepare update data for user table
    const { address, phone } = await request.json(); // Extract address and phone from request
    const updateUserData = {
      name: name.trim(),
      username: username.trim(),
      employeeNumber: employeeNumber ? employeeNumber.trim() : null,
      code: code ? code.trim() : null,
      address: address || null, // Add address field
      phone: phone || null, // Add phone field
      role: role, // Also update role in User table to match store role
    };

    // Add password if provided
    if (password) {
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

// DELETE /api/store-users - Delete single or multiple users from current store
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow ADMIN and MANAGER to delete users (CASHIER shouldn't be able to delete users)
    if (session.user.role !== ROLES.ADMIN && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // For multi-tenant system, get store ID from session
    const storeId = session.user.storeId;
    
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID not found in session' }, { status: 400 });
    }

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Array ID harus disediakan' },
        { status: 400 }
      );
    }

    // Check if all users exist in the current store
    const storeUsers = await prisma.storeUser.findMany({
      where: {
        userId: { in: ids },
        storeId: storeId,
      }
    });

    if (storeUsers.length !== ids.length) {
      return NextResponse.json(
        { error: 'Beberapa user tidak ditemukan di toko ini' },
        { status: 404 }
      );
    }

    // Update status in storeUser table
    const updatedStoreUsers = await prisma.storeUser.updateMany({
      where: {
        userId: { in: ids },
        storeId: storeId,
      },
      data: {
        status: 'TIDAK AKTIF', // Mark as inactive instead of deleting
      }
    });

    // Also update status in the main User table
    // Check if user is inactive in ALL stores before changing main user status
    const userIdsToUpdate = [];
    for (const userId of ids) {
      const activeStoreUsers = await prisma.storeUser.findMany({
        where: {
          userId: userId,
          status: { not: 'TIDAK AKTIF' } // Find if user is active in any store
        }
      });

      // Only update main user status if user is inactive in ALL stores
      if (activeStoreUsers.length === 0) {
        userIdsToUpdate.push(userId);
      }
    }

    if (userIdsToUpdate.length > 0) {
      await prisma.user.updateMany({
        where: {
          id: { in: userIdsToUpdate }
        },
        data: {
          status: 'TIDAK_AKTIF' // Change main user status to inactive
        }
      });
    }

    return NextResponse.json({
      message: `Berhasil menonaktifkan ${updatedStoreUsers.count} user dari toko ini`,
      deletedCount: updatedStoreUsers.count
    });
  } catch (error) {
    console.error('Error deleting users:', error);

    // Check if it's a Prisma error
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete users' },
      { status: 500 }
    );
  }
}
