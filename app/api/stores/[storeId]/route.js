// app/api/stores/[storeId]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

// GET a single store by ID
export async function GET(request, { params }) {
  const { storeId } = params;

  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const store = await globalPrisma.store.findUnique({
      where: { id: storeId },
      include: {
        storeUsers: {
          where: {
            role: ROLES.ADMIN,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Toko tidak ditemukan' }, { status: 404 });
    }

    const adminUser = store.storeUsers.length > 0 ? store.storeUsers[0].user : null;

    return NextResponse.json({ store: { ...store, adminUser } });
  } catch (error) {
    console.error(`Error fetching store ${storeId}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// UPDATE a store by ID
export async function PUT(request, { params }) {
  const { storeId } = params;

  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Dapatkan password dari header untuk verifikasi jika ini adalah permintaan penghapusan
    const password = request.headers.get('X-Manager-Password');

    const body = await request.json();
    const { name, description, address, phone, email, status, adminUsername, resetAdminPassword } = body;

    // Jika permintaan untuk menghapus (mengubah status ke INACTIVE) dan verifikasi password diperlukan
    if (status === 'INACTIVE' && password) {
      // Verifikasi password
      const bcrypt = (await import('bcryptjs')).default;
      const user = await globalPrisma.user.findUnique({
        where: { id: session.user.id }
      });

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Password tidak valid' }, { status: 401 });
      }
    }

    if (!name && status !== 'INACTIVE') {
      return NextResponse.json({ error: 'Nama toko wajib diisi' }, { status: 400 });
    }

    const currentStore = await globalPrisma.store.findUnique({
        where: { id: storeId },
        include: {
            storeUsers: {
                where: { role: ROLES.ADMIN },
                include: { user: true },
            },
        },
    });

    if (!currentStore) {
        return NextResponse.json({ error: 'Toko tidak ditemukan' }, { status: 404 });
    }

    const currentAdmin = currentStore.storeUsers[0]?.user;
    let newTempPassword = null; // To store new password if reset

    // Handle admin username update
    if (adminUsername && currentAdmin && adminUsername !== currentAdmin.username) {
        const existingUser = await globalPrisma.user.findUnique({
            where: { username: adminUsername },
        });
        if (existingUser) {
            return NextResponse.json({ error: 'Username admin sudah ada. Mohon gunakan username lain.' }, { status: 409 });
        }
        await globalPrisma.user.update({
            where: { id: currentAdmin.id },
            data: { username: adminUsername },
        });
    }

    // Handle admin password reset
    if (resetAdminPassword && currentAdmin) {
        newTempPassword = 'password123'; // New temporary password
        const hashedPassword = await bcrypt.hash(newTempPassword, 10);
        await globalPrisma.user.update({
            where: { id: currentAdmin.id },
            data: { password: hashedPassword },
        });
    }

    const updatedStore = await globalPrisma.store.update({
      where: { id: storeId },
      data: {
        name,
        description: description || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        status,
      },
    });

    // Also update the shop name in the store's settings
    await globalPrisma.setting.upsert({
        where: { storeId: storeId },
        update: {
            shopName: name,
            address: address || null,
            phone: phone || null,
        },
        create: { // Create if not found
            storeId: storeId,
            shopName: name,
            address: address || null,
            phone: phone || null,
            // Add other default setting fields if necessary, e.g., themeColor
            themeColor: '#3c8dbc', // Default value from schema.prisma
        }
    });

    return NextResponse.json({
      success: true,
      store: updatedStore,
      adminUsername: adminUsername || (currentAdmin ? currentAdmin.username : null), // Return the latest admin username
      newAdminPassword: newTempPassword, // Only if reset
      message: 'Informasi toko berhasil diperbarui',
    });
  } catch (error) {
    console.error(`Error updating store ${storeId}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
