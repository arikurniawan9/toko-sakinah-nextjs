// app/api/manager/users/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/auditTrail';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || ''; // Filter berdasarkan role

    // Validasi input
    if (page < 1 || limit < 1 || limit > 100) {
      return new Response(JSON.stringify({ error: 'Parameter halaman atau batas tidak valid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Bangun where clause
    const whereClause = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (role) {
      whereClause.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          status: true,
          employeeNumber: true,
          createdAt: true,
          updatedAt: true
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    return new Response(JSON.stringify({ 
      users, 
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
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

    const data = await request.json();

    // Validasi input
    if (!data.name || !data.username || !data.password) {
      return new Response(JSON.stringify({ error: 'Nama, username, dan password wajib diisi' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validasi role - hanya boleh membuat role tertentu
    if (!['WAREHOUSE', 'ADMIN', 'CASHIER', 'ATTENDANT'].includes(data.role)) {
      return new Response(JSON.stringify({ error: 'Role tidak valid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Buat user baru
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email || null,
        password: hashedPassword,
        role: data.role,
        status: data.status || 'AKTIF',
        employeeNumber: data.employeeNumber || null
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        employeeNumber: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Catat aktivitas
    await logActivity(
      session.user.id,
      'CREATE',
      'USER',
      newUser.id,
      `Pengguna "${newUser.name}" dibuat dengan role ${newUser.role}`,
      null,
      { ...newUser }
    );

    return new Response(JSON.stringify(newUser), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.code === 'P2002') {
      // Unique constraint violation
      return new Response(JSON.stringify({ error: 'Username sudah digunakan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop(); // Ambil ID dari path

    // Validasi ID
    if (!userId) {
      return new Response(JSON.stringify({ error: 'ID pengguna tidak valid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await request.json();

    // Ambil data user sebelum update
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        employeeNumber: true
      }
    });

    if (!existingUser) {
      return new Response(JSON.stringify({ error: 'Pengguna tidak ditemukan' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Siapkan data update
    const updateData = {
      name: data.name,
      username: data.username,
      email: data.email,
      role: data.role,
      status: data.status,
      employeeNumber: data.employeeNumber
    };

    // Jika password disertakan, hash dulu
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        employeeNumber: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Catat aktivitas
    await logActivity(
      session.user.id,
      'UPDATE',
      'USER',
      updatedUser.id,
      `Data pengguna "${updatedUser.name}" diperbarui`,
      { ...existingUser },
      { ...updatedUser }
    );

    return new Response(JSON.stringify(updatedUser), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error.code === 'P2002') {
      // Unique constraint violation
      return new Response(JSON.stringify({ error: 'Username sudah digunakan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop(); // Ambil ID dari path

    // Validasi ID
    if (!userId) {
      return new Response(JSON.stringify({ error: 'ID pengguna tidak valid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ambil data user sebelum dihapus
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        role: true
      }
    });

    if (!userToDelete) {
      return new Response(JSON.stringify({ error: 'Pengguna tidak ditemukan' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Jangan hapus user manager
    if (userToDelete.role === ROLES.MANAGER) {
      return new Response(JSON.stringify({ error: 'Tidak dapat menghapus pengguna dengan role MANAGER' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update status menjadi INAKTIF alih-alih menghapus
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: 'INAKTIF' },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        status: true
      }
    });

    // Catat aktivitas
    await logActivity(
      session.user.id,
      'DELETE',
      'USER',
      updatedUser.id,
      `Pengguna "${updatedUser.name}" dinonaktifkan`,
      { ...userToDelete },
      { ...updatedUser },
      null // Tidak ada storeId karena ini adalah operasi manager
    );

    return new Response(JSON.stringify({ 
      message: 'Pengguna berhasil dinonaktifkan',
      user: updatedUser 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}