// middleware-multi-tenant.js (complete multi-tenant system)
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { ROLES } from './lib/constants';

// Definisikan role mana yang termasuk global role (bisa mengakses semua toko)
const GLOBAL_ROLES = [ROLES.MANAGER, ROLES.WAREHOUSE];

// Definisikan permission untuk masing-masing path
const rolePermissions = {
  '/manager': [ROLES.MANAGER],
  '/warehouse': [ROLES.WAREHOUSE],
  '/admin': [ROLES.ADMIN],
  '/kasir': [ROLES.CASHIER],
  '/pelayan': [ROLES.ATTENDANT],
};

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;

    // Jika path adalah untuk role tertentu, validasi akses
    for (const path in rolePermissions) {
      if (pathname.startsWith(path)) {
        const allowedRoles = rolePermissions[path];

        if (!token || !allowedRoles.includes(token.role)) {
          // Jika user memiliki global role, arahkan ke halaman yang sesuai
          if (token?.role === ROLES.MANAGER) {
            if (pathname.startsWith('/admin') || pathname.startsWith('/kasir') || pathname.startsWith('/pelayan')) {
              // Manager bisa mengakses halaman toko jika mereka memilih toko
              if (!token.storeId) {
                // Jika manager belum memilih toko, perbolehkan akses ke select-store
                if (!pathname.startsWith('/select-store')) {
                  const url = req.nextUrl.clone();
                  url.pathname = '/select-store';
                  return NextResponse.redirect(url);
                }
              }
            } else {
              // Untuk halaman non-toko, biarkan manager akses
            }
          } else if (token?.role === ROLES.WAREHOUSE) {
            // Warehouse role tidak boleh mengakses halaman toko biasa
            const url = req.nextUrl.clone();
            url.pathname = '/unauthorized';
            return NextResponse.redirect(url);
          } else {
            // User biasa dengan role yang salah
            const url = req.nextUrl.clone();
            url.pathname = '/unauthorized';
            return NextResponse.redirect(url);
          }
        }

        // Untuk role per toko (bukan global), pastikan memiliki akses ke toko tertentu
        if (!GLOBAL_ROLES.includes(token.role) && !token.storeId) {
          const url = req.nextUrl.clone();
          url.pathname = '/select-store';
          return NextResponse.redirect(url);
        }

        // Validasi apakah user memiliki akses ke toko yang dipilih
        if (token.storeId && !GLOBAL_ROLES.includes(token.role)) {
          // Di sini bisa ditambahkan validasi tambahan jika diperlukan
          // Misalnya: cek apakah user masih aktif di toko tersebut
        }

        break;
      }
    }

    // Validasi akses API routes untuk sistem multi-tenant
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
      // Untuk API routes, kita akan melakukan validasi lebih lanjut di masing-masing route
      // Middleware ini hanya memastikan bahwa user terautentikasi
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|unauthorized|select-store|register-manager|register|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
};