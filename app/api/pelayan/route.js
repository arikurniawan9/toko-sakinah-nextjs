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

    // Klausa where dasar - hanya ambil user dengan role ATTENDANT (sesuai dengan konstanta ROLES)
    const baseWhereClause = {
      storeId: storeId,
      role: 'ATTENDANT', // Sesuai dengan konstanta ROLES
      status: 'ACTIVE',  // Hanya pengguna aktif
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
      role: storeUser.role // Termasuk informasi role
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
        status: 'ACTIVE',
      }
    });

    // Buat hubungan dengan toko dan beri role ATTENDANT (sesuai dengan konstanta ROLES)
    const storeUser = await prisma.storeUser.create({
      data: {
        userId: newUser.id,
        storeId: storeId,
        role: 'ATTENDANT', // Sesuai dengan konstanta ROLES
        assignedBy: session.user.id,
        status: 'ACTIVE',
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