// app/api/users/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { ROLES } from '@/lib/constants';

// GET /api/users - Get users for current store with pagination and search
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow ADMIN and MANAGER to access this endpoint
    if (session.user.role !== ROLES.ADMIN && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // For multi-tenant system, get users for the current store
    const storeId = session.user.storeId;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID not found in session' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    let users;
    let totalCount;

    const searchLower = `%${search.toLowerCase()}%`;

    if (search) {
      // Fetch users with raw query for case-insensitive search for the current store
      users = await prisma.$queryRaw`
        SELECT u.id, u.name, u.username, u.employeeNumber, su.role, u.status, u.createdAt, u.updatedAt
        FROM User u
        JOIN StoreUser su ON u.id = su.userId
        WHERE su.storeId = ${storeId}
        AND (LOWER(u.name) LIKE ${searchLower} OR LOWER(u.username) LIKE ${searchLower})
        ORDER BY u.createdAt DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      // Count total users matching the search for the current store
      const countResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM User u
        JOIN StoreUser su ON u.id = su.userId
        WHERE su.storeId = ${storeId}
        AND (LOWER(u.name) LIKE ${searchLower} OR LOWER(u.username) LIKE ${searchLower})
      `;
      totalCount = Number(countResult[0].count);

    } else {
      // Standard Prisma findMany when no search term for the current store
      users = await prisma.storeUser.findMany({
        where: {
          storeId,
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              employeeNumber: true,
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

      // Transform the results to match the expected format
      users = users.map(storeUser => ({
        ...storeUser.user,
        role: storeUser.role,
      }));

      totalCount = await prisma.storeUser.count({
        where: { storeId }
      });
    }

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

// POST /api/users - Create a new user for current store
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow ADMIN and MANAGER to create users
    if (session.user.role !== ROLES.ADMIN && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // For multi-tenant system, get store ID from session
    const storeId = session.user.storeId;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID not found in session' }, { status: 400 });
    }

    const { name, username, employeeNumber, password, role } = await request.json();

    // Validation
    if (!name || !username || !password || !role) {
      return NextResponse.json(
        { error: 'Nama, username, password, dan role wajib diisi' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = [ROLES.ADMIN, ROLES.CASHIER, ROLES.ATTENDANT];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Role tidak valid' },
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        employeeNumber: employeeNumber ? employeeNumber.trim() : null,
        password: hashedPassword,
        role: 'ADMIN', // Set role in user table as 'ADMIN' to indicate it's a user account (not to be confused with store role)
        status: 'ACTIVE',
      }
    });

    // Create store-user relationship with specified role for this store
    await prisma.storeUser.create({
      data: {
        userId: user.id,
        storeId: storeId,
        role: role, // Role in the specific store
        assignedBy: session.user.id,
        status: 'ACTIVE',
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

// PUT /api/users/[id] - Update a user for current store
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow ADMIN and MANAGER to update users
    if (session.user.role !== ROLES.ADMIN && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    const validRoles = [ROLES.ADMIN, ROLES.CASHIER, ROLES.ATTENDANT];
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
        status: 'ACTIVE', // Ensure the status is active
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

// DELETE /api/users - Delete single or multiple users from current store
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow ADMIN and MANAGER to delete users
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

    // Delete the store-user relationships (soft delete approach)
    const deletedStoreUsers = await prisma.storeUser.updateMany({
      where: {
        userId: { in: ids },
        storeId: storeId,
      },
      data: {
        status: 'INACTIVE', // Mark as inactive instead of deleting
      }
    });

    return NextResponse.json({
      message: `Berhasil menonaktifkan ${deletedStoreUsers.count} user dari toko ini`,
      deletedCount: deletedStoreUsers.count
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