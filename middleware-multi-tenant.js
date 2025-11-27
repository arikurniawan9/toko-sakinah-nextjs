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

// Fungsi middleware untuk proteksi route
function authMiddleware(req) {
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
            // Manager bisa mengakses halaman toko, tapi akan ditangani di halaman masing-masing
            // jika mereka tidak memiliki storeId
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
        // Jika user belum memiliki akses ke toko, arahkan ke halaman unauthorized
        // untuk mencegah loop redirect yang terjadi jika langsung mengarah ke dashboard
        if (!pathname.startsWith('/api/')) { // Hanya untuk halaman UI, bukan API
          const url = req.nextUrl.clone();
          url.pathname = '/unauthorized';
          return NextResponse.redirect(url);
        }
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
}

// Middleware wrapper yang menangani proteksi berdasarkan path
export default function multiTenantMiddleware(req) {
  // Jika path adalah halaman utama, jangan gunakan proteksi otentikasi
  if (req.nextUrl.pathname === '/') {
    return NextResponse.next();
  }

  // Untuk halaman lainnya, gunakan proteksi otentikasi
  return withAuth(authMiddleware, {
    pages: {
      signIn: '/login',
    },
  })(req);
}

export const config = {
  matcher: [
    /*
     * Exclude the following:
     * - /api/ routes
     * - /login page
     * - /unauthorized page
     * - /register-manager page
     * - /register page
     * - Static assets (.png, .jpg, etc.)
     * - Other public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|unauthorized|register-manager|register|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
};