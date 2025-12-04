// app/api/manager/users/route.js - tambahan DELETE method
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { ROLES } from '@/lib/constants';
import { logUserCreation, logUserDeletion } from '@/lib/auditLogger';

// GET method (existing)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id || session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const storeId = searchParams.get('storeId') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    // Query untuk mengambil user beserta informasi toko mereka
    const whereClause = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } },
          ],
        } : {},
        role ? { storeUsers: { some: { role } } } : {},
        storeId ? { storeUsers: { some: { storeId } } } : {},
        status ? { status: status } : {}, // Filter status user
      ],
    };

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        storeUsers: {
          include: {
            store: true
          },
          orderBy: { assignedAt: 'desc' }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Format data agar mudah digunakan di UI
    const formattedUsers = users.map(user => ({
      ...user,
      stores: user.storeUsers.map(su => ({
        id: su.store.id,
        name: su.store.name,
        role: su.role,
        assignedAt: su.assignedAt,
        status: su.status
      }))
    }));

    const totalItems = await prisma.user.count({
      where: whereClause,
    });

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        total: totalItems,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalItems / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST method (existing)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id || session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Untuk MANAGER, mereka bisa mengakses semua toko, jadi kita tidak perlu validasi storeId dari session
    // Lanjutkan ke pengambilan data dari body request

    const { name, username, employeeNumber, password, role, storeId: targetStoreId, phone, address } = await request.json();

    // Validasi data
    if (!name || !username || !password || !targetStoreId || !role) {
      return NextResponse.json(
        { error: 'Nama, username, password, toko, dan role wajib diisi' },
        { status: 400 }
      );
    }

    // Validasi role
    const validRoles = [ROLES.ADMIN, ROLES.CASHIER, ROLES.ATTENDANT, ROLES.MANAGER, ROLES.WAREHOUSE];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Role tidak valid' },
        { status: 400 }
      );
    }

    // Cek apakah toko tujuan valid
    const targetStore = await prisma.store.findUnique({
      where: { id: targetStoreId }
    });

    if (!targetStore) {
      return NextResponse.json(
        { error: 'Toko tujuan tidak ditemukan' },
        { status: 404 }
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
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        password: hashedPassword,
        role: role, // Set role in user table to the selected role
        status: 'AKTIF',
      }
    });

    // Create store-user relationship with specified role for this store
    await prisma.storeUser.create({
      data: {
        userId: user.id,
        storeId: targetStoreId,
        role: role, // Role in the specific store
        assignedBy: session.user.id,
        status: 'ACTIVE',
      }
    });

    // Log aktivitas pembuatan user
    const requestHeaders = new Headers(request.headers);
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
    const userAgent = requestHeaders.get('user-agent') || '';

    await logUserCreation(session.user.id, user, targetStoreId, ipAddress, userAgent);

    // Don't return the password hash
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({...userWithoutPassword, role}, { status: 201 }); // Return user data with store role
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// DELETE method - untuk menghapus user dari semua toko dan menonaktifkan user secara keseluruhan
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id || session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Array ID harus disediakan' },
        { status: 400 }
      );
    }

    // Ambil data user sebelum dihapus untuk logging
    const usersToDelete = await prisma.user.findMany({
      where: {
        id: { in: ids }
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        status: true
      }
    });

    // Hapus user dari semua toko (hapus dari tabel storeUser) dan nonaktifkan user
    const transactionResult = await prisma.$transaction([
      // Nonaktifkan hubungan user-toko
      prisma.storeUser.updateMany({
        where: {
          userId: { in: ids }
        },
        data: {
          status: 'INACTIVE' // Nonaktifkan hubungan user-toko
        }
      }),
      // Update status user secara keseluruhan
      prisma.user.updateMany({
        where: {
          id: { in: ids }
        },
        data: {
          status: 'TIDAK_AKTIF' // Nonaktifkan pengguna secara keseluruhan
        }
      })
    ]);

    // Log aktivitas penghapusan user
    const requestHeaders = new Headers(request.headers);
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
    const userAgent = requestHeaders.get('user-agent') || '';

    for (const userData of usersToDelete) {
      await logUserDeletion(session.user.id, userData, null, ipAddress, userAgent); // Kita tidak tahu storeId pasti, jadi gunakan null
    }

    return NextResponse.json({
      message: `Berhasil menonaktifkan ${ids.length} user dan aksesnya dari semua toko`,
      deletedCount: ids.length
    });
  } catch (error) {
    console.error('Error deleting users:', error);
    return NextResponse.json(
      { error: 'Failed to delete users from stores' },
      { status: 500 }
    );
  }
}