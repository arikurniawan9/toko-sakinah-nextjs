// app/api/profile/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { name, username, currentPassword, password } = data;

    // Fetch the user to verify current password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Kata sandi saat ini salah.' }, { status: 401 });
    }

    // Prepare data for update
    const updateData = {
      name,
      username,
    };

    // If a new password is provided, hash it and add to update data
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });
    
    // Don't send back the password hash
    delete updatedUser.password;

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    // Check for unique constraint violation (e.g., username already exists)
    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
      return NextResponse.json({ error: 'Username sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal memperbarui profil.' }, { status: 500 });
  }
}