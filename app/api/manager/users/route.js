// GET /api/manager/users - Get all users (for MANAGER role)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    const whereConditions = [];

    // Role filtering: if a specific role is passed, use it. Otherwise, exclude WAREHOUSE.
    if (role) {
      whereConditions.push({ role: role });
    } else {
      whereConditions.push({ role: { not: ROLES.WAREHOUSE } });
    }
    
    // Status filtering
    if (status) {
      whereConditions.push({ status: status });
    }

    // Search filtering
    if (search) {
      whereConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { employeeNumber: { contains: search, mode: 'insensitive' } },
        ],
      });
    }
    
    const whereClause = whereConditions.length > 0 ? { AND: whereConditions } : {};

    const [users, totalCount] = await prisma.$transaction([
      prisma.user.findMany({
        where: whereClause,
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
            role: true,
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: whereClause })
    ]);

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
    console.error('Error fetching global users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { ROLES } from '@/lib/constants';

// POST /api/manager/users - Create a new global user (e.g., WAREHOUSE)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, username, employeeNumber, code, password, role, address, phone } = await request.json();

    // Validation
    if (!name || !username || !password || !role) {
      return NextResponse.json(
        { error: 'Nama, username, password, dan role wajib diisi' },
        { status: 400 }
      );
    }

    // Only allow creating global roles via this endpoint
    const validGlobalRoles = [ROLES.WAREHOUSE, ROLES.MANAGER];
    if (!validGlobalRoles.includes(role)) {
      return NextResponse.json(
        { error: `Role '${role}' tidak valid untuk endpoint ini. Gunakan endpoint /api/store-users untuk role spesifik toko.` },
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

    // Create the user in the User table
    // No StoreUser record is created, as this is a global user.
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        employeeNumber: employeeNumber ? employeeNumber.trim() : null,
        code: code ? code.trim() : null,
        password: hashedPassword,
        address,
        phone,
        role: role,
        status: 'AKTIF',
      }
    });

    // Don't return the password hash
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    console.error('Error creating global user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// DELETE /api/manager/users - Delete multiple global users
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Array ID pengguna harus disediakan' },
        { status: 400 }
      );
    }
    
    // Prevent a manager from deleting themselves
    if (ids.includes(session.user.id)) {
        return NextResponse.json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' }, { status: 400 });
    }

    // Ensure users to be deleted are global users, not store-specific ones by mistake
    const usersToDelete = await prisma.user.findMany({
        where: {
            id: { in: ids },
            role: { in: [ROLES.WAREHOUSE, ROLES.MANAGER] }
        }
    });

    if (usersToDelete.length !== ids.length) {
        return NextResponse.json({ error: 'Beberapa pengguna yang dipilih bukan pengguna global atau tidak ditemukan.' }, { status: 404 });
    }

    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return NextResponse.json({
      message: `Berhasil menghapus ${deletedUsers.count} user.`,
      deletedCount: deletedUsers.count
    });

  } catch (error) {
    console.error('Error deleting global users:', error);
    return NextResponse.json(
      { error: 'Failed to delete users' },
      { status: 500 }
    );
  }
}

