// app/register-manager/middleware.js
import { NextResponse } from 'next/server'

export function middleware(request) {
  // Izinkan akses ke halaman register manager
  return NextResponse.next()
}

export const config = {
  matcher: ['/register-manager/:path*']
}