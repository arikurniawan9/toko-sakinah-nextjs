// app/api/user/password/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'CASHIER', 'ATTENDANT', 'MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: 'Password saat ini dan password baru harus diisi' 
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'Password baru harus minimal 6 karakter' 
      }, { status: 400 });
    }

    // Ambil user dari database untuk verifikasi password saat ini
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        password: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    // Verifikasi password saat ini
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Password saat ini salah' }, { status: 400 });
    }

    // Hash password baru
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password di database
    await prisma.user.update({
      where: {
        id: session.user.id
      },
      data: {
        password: hashedNewPassword
      }
    });

    return NextResponse.json({ 
      message: 'Password berhasil diperbarui' 
    });
  } catch (error) {
    console.error('Error updating user password:', error);
    return NextResponse.json({ 
      error: 'Gagal mengganti password: ' + error.message 
    }, { status: 500 });
  }
}