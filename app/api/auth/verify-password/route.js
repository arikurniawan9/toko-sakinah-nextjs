import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';

export async function POST(request) {
  try {
    const session = await getSession();
    
    // Pastikan pengguna sudah login
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized', valid: false },
        { status: 401 }
      );
    }

    const { userId, password } = await request.json();
    
    // Pastikan userId sesuai dengan user yang sedang login
    if (!userId || userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Invalid user', valid: false },
        { status: 400 }
      );
    }

    // Ambil user dari database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', valid: false },
        { status: 404 }
      );
    }

    // Verifikasi password
    const isValid = await bcrypt.compare(password, user.password);
    
    return NextResponse.json({ 
      valid: isValid,
      message: isValid ? 'Password valid' : 'Password invalid'
    });
  } catch (error) {
    console.error('Error verifying password:', error);
    return NextResponse.json(
      { error: 'Internal server error', valid: false },
      { status: 500 }
    );
  }
}