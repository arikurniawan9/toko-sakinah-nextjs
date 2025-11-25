// app/api/stores/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    console.log('GET /api/stores called');
    const session = await getServerSession(authOptions);

    console.log('Session:', session ? { role: session.user.role } : 'No session');

    // Untuk debugging: coba beri akses ke semua role dulu, lalu kita batasi nanti
    if (!session) {
      console.log('No session found');
      return new Response(JSON.stringify({ error: 'Unauthorized - No session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Full session user object:', JSON.stringify(session.user, null, 2));
    console.log('User role (raw):', session.user.role);
    console.log('User role type:', typeof session.user.role);
    console.log('Role comparison - session.user.role === "MANAGER":', session.user.role === "MANAGER");
    console.log('Role comparison - session.user.role === "ADMIN":', session.user.role === "ADMIN");

    // Normalisasi role untuk perbandingan
    const normalizedRole = session.user.role ? session.user.role.trim().toUpperCase() : '';
    console.log('Normalized role:', normalizedRole);

    // Hanya MANAGER yang bisa mengakses semua toko
    if (normalizedRole !== 'MANAGER') {
      console.log('Access denied for role:', session.user.role, '(normalized to)', normalizedRole);
      return new Response(JSON.stringify({ error: `Unauthorized - Insufficient permissions. Your role: ${session.user.role}` }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Access granted for role:', session.user.role, '(normalized to)', normalizedRole);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortKey = searchParams.get('sortKey') || 'createdAt';
    const sortDirection = searchParams.get('sortDirection') || 'desc';
    const statusFilter = searchParams.get('status') || '';

    console.log('Query params:', { page, limit, search, sortKey, sortDirection, statusFilter });

    const skip = (page - 1) * limit;

    const whereClause = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search } },
            { address: { contains: search } },
            { code: { contains: search } }, // Tambahkan pencarian berdasarkan kode toko
          ],
        } : {},
        statusFilter ? { status: statusFilter } : {},
      ],
    };

    console.log('Where clause:', whereClause);

    const stores = await prisma.store.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        [sortKey]: sortDirection,
      },
    });

    console.log('Stores found:', stores.length);

    const totalItems = await prisma.store.count({
      where: whereClause,
    });

    console.log('Total items:', totalItems);

    const responseData = {
      stores,
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
    };

    console.log('Response data:', responseData);

    return new Response(JSON.stringify(responseData), {
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

    if (!session || session.user.role !== 'MANAGER') {
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
          assignedBy: session.user.id,
        },
      });

      return { store: newStore, admin: newAdmin };
    });

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

// Handler untuk mendapatkan jumlah total toko (digunakan untuk dashboard)
export async function HEAD(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['MANAGER', 'ADMIN'].includes(session.user.role)) {
      return new Response(null, { status: 401 });
    }

    const totalStores = await prisma.store.count();

    return new Response(null, {
      status: 200,
      headers: {
        'X-Total-Count': totalStores.toString(),
      },
    });
  } catch (error) {
    console.error('Error getting store count:', error);
    return new Response(null, { status: 500 });
  }
}