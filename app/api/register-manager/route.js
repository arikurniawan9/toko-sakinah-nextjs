// app/api/register-manager/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    // Cek apakah sudah ada user dengan role MANAGER
    const existingManagerCount = await prisma.user.count({
      where: {
        role: 'MANAGER',
      },
    });

    if (existingManagerCount > 0) {
      return NextResponse.json(
        { error: 'Akun MANAGER sudah terdaftar. Registrasi tidak diizinkan.' },
        { status: 400 }
      );
    }

    const { name, username, password } = await request.json();

    // Validasi input
    if (!name || !username || !password) {
      return NextResponse.json(
        { error: 'Nama, username, dan password harus diisi' },
        { status: 400 }
      );
    }

    // Cek apakah username sudah digunakan
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat akun MANAGER
    const managerUser = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role: 'MANAGER',
        status: 'AKTIF',
        employeeNumber: `MGR${Date.now().toString().slice(-6)}`, // Generate employee number
      },
    });

    // Buat toko default untuk MANAGER
    const defaultStore = await prisma.store.create({
      data: {
        name: 'Toko Pusat',
        description: 'Toko utama perusahaan',
        status: 'ACTIVE',
      },
    });

    // Buat setting default untuk toko
    await prisma.setting.create({
      data: {
        storeId: defaultStore.id,
        shopName: 'Toko Pusat',
        themeColor: '#3c8dbc',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Akun MANAGER berhasil dibuat',
      user: {
        id: managerUser.id,
        name: managerUser.name,
        username: managerUser.username,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Jika error karena koneksi database atau struktur tabel belum siap
    if (error.code === 'P2021' || error.message.includes('does not exist in the current database')) {
      return NextResponse.json(
        { error: 'Tabel database belum siap. Silakan hubungi administrator untuk menjalankan migrasi.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membuat akun manager' },
      { status: 500 }
    );
  }
}