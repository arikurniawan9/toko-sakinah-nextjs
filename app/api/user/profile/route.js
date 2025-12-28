// app/api/user/profile/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function PUT(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'CASHIER', 'ATTENDANT', 'MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, phone, email } = await request.json();

    // Validasi panjang nomor telepon
    if (phone && phone.trim() !== '' && phone.trim().length > 13) {
      return NextResponse.json({
        error: 'Nomor telepon maksimal 13 karakter'
      }, { status: 400 });
    }

    // Update hanya field yang diperbolehkan untuk diubah pengguna
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id
      },
      data: {
        name: name?.trim(),
        phone: phone?.trim(),
        email: email?.trim(),
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        employeeNumber: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({ 
      message: 'Profil berhasil diperbarui',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    if (error.code === 'P2002') {
      // Unique constraint violation (email already exists)
      return NextResponse.json({ 
        error: 'Email sudah digunakan oleh pengguna lain' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Gagal memperbarui profil: ' + error.message 
    }, { status: 500 });
  }
}