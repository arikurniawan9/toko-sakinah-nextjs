// app/api/pelayan/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET: Mengambil pelayan (ATTENDANT) untuk toko saat ini
export async function GET(request) {
  const session = await getServerSession(authOptions);

  // Izinkan akses untuk CASHIER, ADMIN, ATTENDANT dan MANAGER
  if (!session || !['CASHIER', 'ADMIN', 'ATTENDANT', 'MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const simple = searchParams.get('simple'); // Parameter untuk mengembalikan hanya array pelayan

    // Tentukan storeId dari sesi pengguna
    const storeId = session.user.storeId;
    if (!storeId) {
      return NextResponse.json({ error: 'User is not associated with a store' }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    // Klausa where dasar - hanya ambil user dengan role ATTENDANT (berdasarkan skema Prisma dan ROLES constant)
    const baseWhereClause = {
      storeId: storeId,
      role: 'ATTENDANT', // Sesuai dengan ROLES.ATTENDANT
      status: { in: ['ACTIVE', 'AKTIF'] },  // Gunakan kedua status untuk kompatibilitas
    };

    // Tambahkan pencarian jika ada
    const whereClause = search
      ? {
          ...baseWhereClause,
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { username: { contains: search, mode: 'insensitive' } },
              { employeeNumber: { contains: search, mode: 'insensitive' } },
            ],
          },
        }
      : baseWhereClause;

    const [storeUsers, totalCount] = await Promise.all([
      prisma.storeUser.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        include: {
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
          }
        },
        orderBy: { user: { createdAt: 'desc' } },
      }),
      prisma.storeUser.count({
        where: whereClause
      }),
    ]);

    // Ekstrak data pengguna dari hasil
    const attendants = storeUsers.map(storeUser => ({
      ...storeUser.user,
      role: storeUser.role, // Termasuk informasi role
      employeeNumber: storeUser.user.employeeNumber || '', // Pastikan employee number juga dikembalikan
    }));

    // Jika parameter simple ada, kembalikan hanya array pelayan (tanpa metadata pagination)
    if (simple !== null) {
      return NextResponse.json(attendants);
    }

    // Kembalikan hasil lengkap dengan metadata pagination
    return NextResponse.json({
      attendants,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching attendants:', error);
    return NextResponse.json({ error: 'Failed to fetch attendants' }, { status: 500 });
  }
}

// POST: Membuat pelayan baru (sebagai user dengan role ATTENDANT)
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, username, employeeNumber, password } = body;

    // Validasi input
    if (!name || !username || !password) {
      return NextResponse.json(
        { error: 'Nama, username, dan password wajib diisi' },
        { status: 400 }
      );
    }

    // Tentukan storeId dari sesi pengguna
    const storeId = session.user.storeId;
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID not found in session' }, { status: 400 });
    }

    // Cek apakah username sudah digunakan
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

    // Buat pengguna baru
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: username.trim(),
        employeeNumber: employeeNumber ? employeeNumber.trim() : null,
        password: hashedPassword,
        role: 'ADMIN', // Set role di tabel user sebagai 'ADMIN' untuk menunjukkan ini adalah akun pengguna
        status: 'AKTIF',
      }
    });

    // Buat hubungan dengan toko dan beri role ATTENDANT (sesuai dengan konstanta ROLES)
    const storeUser = await prisma.storeUser.create({
      data: {
        userId: newUser.id,
        storeId: storeId,
        role: 'ATTENDANT', // Sesuai dengan konstanta ROLES
        assignedBy: session.user.id,
        status: 'AKTIF',
      }
    });

    // Jangan kembalikan password hash
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json({
      ...userWithoutPassword,
      role: storeUser.role // Kembalikan role yang berlaku untuk toko ini
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating attendant:', error);
    return NextResponse.json({ error: 'Failed to create attendant' }, { status: 500 });
  }
}

// PUT: Memperbarui pelayan yang sudah ada
export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, username, employeeNumber, password } = body;

    // Validasi input
    if (!id || !name || !username) {
      return NextResponse.json(
        { error: 'ID, nama, dan username wajib diisi' },
        { status: 400 }
      );
    }

    // Tentukan storeId dari sesi pengguna
    const storeId = session.user.storeId;
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID not found in session' }, { status: 400 });
    }

    // Cek apakah user ada dan merupakan pelayan di toko ini
    const existingStoreUser = await prisma.storeUser.findFirst({
      where: {
        userId: id,
        storeId: storeId,
        role: 'ATTENDANT'
      },
      include: {
        user: true
      }
    });

    if (!existingStoreUser) {
      return NextResponse.json(
        { error: 'Pelayan tidak ditemukan di toko ini' },
        { status: 404 }
      );
    }

    // Cek apakah username sudah digunakan (kecuali oleh user yang sedang diupdate)
    const existingDifferentUser = await prisma.user.findFirst({
      where: {
        username: username.trim(),
        id: { not: id }  // Kecualikan user yang sedang diupdate
      }
    });

    if (existingDifferentUser) {
      return NextResponse.json(
        { error: 'Username sudah digunakan oleh pengguna lain' },
        { status: 400 }
      );
    }

    // Siapkan data update
    const updateData = {
      name: name.trim(),
      username: username.trim(),
      employeeNumber: employeeNumber ? employeeNumber.trim() : null,
    };

    // Tambahkan password jika disediakan
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Update pengguna
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    // Juga update role di StoreUser untuk memastikan konsistensi
    await prisma.storeUser.update({
      where: {
        userId_storeId: {
          userId: id,
          storeId: storeId,
        }
      },
      data: {
        role: 'ATTENDANT', // Jaga agar role tetap ATTENDANT sesuai ekspektasi
        status: 'AKTIF',   // Juga pastikan status tetap AKTIF
      }
    });

    // Jangan kembalikan password hash
    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json({
      ...userWithoutPassword,
      role: 'ATTENDANT' // Kembalikan role yang berlaku untuk toko ini
    });
  } catch (error) {
    console.error('Error updating attendant:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Pelayan tidak ditemukan' },
        { status: 404 }
      );
    }
    return NextResponse.json({ error: 'Failed to update attendant' }, { status: 500 });
  }
}