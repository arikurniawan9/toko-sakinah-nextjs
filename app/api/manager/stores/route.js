// app/api/manager/stores/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { ROLES } from '@/lib/constants';
import { logStoreCreation } from '@/lib/auditLogger';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortKey = searchParams.get('sortKey') || 'createdAt';
    const sortDirection = searchParams.get('sortDirection') || 'desc';
    const statusFilter = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    const whereClause = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } }, // Tambahkan pencarian berdasarkan kode toko
          ],
        } : {},
        statusFilter ? { status: statusFilter } : {},
      ],
    };

    const stores = await prisma.store.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        [sortKey]: sortDirection,
      },
    });

    const totalItems = await prisma.store.count({
      where: whereClause,
    });

    return new Response(JSON.stringify({
      stores,
      pagination: {
        total: totalItems,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalItems / limit),
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { store, admin } = await request.json();

    // Validasi data
    if (!store.name || !store.address || !admin.name || !admin.username || !admin.password) {
      return new Response(JSON.stringify({ error: 'Data tidak lengkap' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Periksa apakah username admin sudah ada
    const existingUser = await prisma.user.findUnique({
      where: { username: admin.username },
    });

    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Username sudah digunakan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Periksa apakah kode pegawai sudah ada jika disediakan
    if (admin.employeeNumber) {
      const existingEmployee = await prisma.user.findUnique({
        where: { employeeNumber: admin.employeeNumber },
      });

      if (existingEmployee) {
        return new Response(JSON.stringify({ error: 'Kode pegawai sudah digunakan' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(admin.password, 10);

    // Buat transaksi untuk memastikan konsistensi data
    const result = await prisma.$transaction(async (tx) => {
      // Buat toko
      const newStore = await tx.store.create({
        data: {
          name: store.name,
          code: store.code || null,
          description: store.description || '',
          address: store.address,
          phone: store.phone || '',
          email: store.email || '',
          status: store.status || 'ACTIVE',
        },
      });

      // Buat pengguna admin
      const newAdmin = await tx.user.create({
        data: {
          name: admin.name,
          username: admin.username,
          employeeNumber: admin.employeeNumber || null, // Tambahkan employeeNumber, bisa null jika tidak disediakan
          password: hashedPassword,
          role: 'ADMIN',
          status: 'AKTIF',
        },
      });

      // Hubungkan pengguna dengan toko
      await tx.storeUser.create({
        data: {
          userId: newAdmin.id,
          storeId: newStore.id,
          role: 'ADMIN',
          status: 'ACTIVE', // Gunakan 'ACTIVE' sesuai dengan default di skema Prisma
          assignedBy: session.user.id,
        },
      });

      return { store: newStore, admin: newAdmin };
    });

    // Log aktivitas pembuatan toko
    const requestHeaders = new Headers(request.headers);
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
    const userAgent = requestHeaders.get('user-agent') || '';

    await logStoreCreation(session.user.id, result.store, ipAddress, userAgent);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating store:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}