// app/api/stores/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

// ... (GET function remains the same)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const sortKey = searchParams.get('sortKey') || 'createdAt';
    const sortDirection = searchParams.get('sortDirection') || 'desc';

    const whereClause = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { address: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const stores = await globalPrisma.store.findMany({
      where: whereClause,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: {
        [sortKey]: sortDirection,
      },
    });

    const totalItems = await globalPrisma.store.count({
      where: whereClause,
    });

    return NextResponse.json({ stores, totalItems });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, address, phone, email, adminUsername, adminPassword } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nama toko wajib diisi' }, { status: 400 });
    }

    // Check if a custom admin username was provided and if it's already taken
    if (adminUsername) {
      const existingUser = await globalPrisma.user.findUnique({
        where: { username: adminUsername },
      });
      if (existingUser) {
        return NextResponse.json({ error: 'Username admin sudah ada. Mohon gunakan username lain.' }, { status: 409 });
      }
    }

    const newStore = await globalPrisma.store.create({
      data: {
        name,
        description: description || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        status: 'ACTIVE',
      },
    });

    // --- Dynamic Admin User Creation ---
    const generatedAdminUsername = adminUsername || `admin_${name.toLowerCase().replace(/\s+/g, '')}`;
    const rawAdminPassword = adminPassword || 'password123';
    const hashedPassword = await bcrypt.hash(rawAdminPassword, 10);

    const newAdminUser = await globalPrisma.user.create({
      data: {
        name: `${name} Admin`,
        username: generatedAdminUsername,
        password: hashedPassword,
        role: ROLES.ADMIN,
        isGlobalRole: false, // Ensure this new admin is specific to a store, not global
        createdBy: session.user.id,
      },
    });

    // Link the new admin user to the new store
    await globalPrisma.storeUser.create({
      data: {
        userId: newAdminUser.id,
        storeId: newStore.id,
        role: ROLES.ADMIN,
        assignedBy: session.user.id,
      },
    });
    // --- End of Dynamic Admin User Creation ---

    // Create default settings for the new store
    await globalPrisma.setting.create({
      data: {
        storeId: newStore.id,
        shopName: newStore.name,
        address: newStore.address,
        phone: newStore.phone,
      },
    });

    return NextResponse.json({
      success: true,
      store: newStore,
      adminCredentials: {
        username: generatedAdminUsername,
        password: rawAdminPassword,
      },
      message: 'Toko dan akun admin berhasil dibuat. Harap simpan kredensial admin.',
    });
  } catch (error) {
    console.error('Error creating store:', error);
    // If there's an error, try to clean up the created store if it exists
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
      return NextResponse.json({ error: `Username admin '${error.meta.target}' sudah ada. Coba nama toko yang lain.` }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}