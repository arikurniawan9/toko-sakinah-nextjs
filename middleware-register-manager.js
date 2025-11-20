// middleware-register-manager.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

async function checkManagerExists() {
  try {
    const managerCount = await prisma.user.count({
      where: {
        role: 'MANAGER',
      },
    });
    return managerCount > 0;
  } catch (error) {
    // Jika terjadi error karena tabel belum ada, anggap belum ada manager
    return false;
  }
}

export default async function middlewareRegisterManager(req) {
  const { pathname } = req.nextUrl;
  
  // Jika ini adalah halaman register manager
  if (pathname === '/register-manager') {
    const managerExists = await checkManagerExists();
    
    // Jika sudah ada manager, redirect ke login
    if (managerExists) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/register-manager',
  ],
};