// utils/rbac.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// Definisikan permission untuk berbagai operasi
const PERMISSIONS = {
  // Untuk manajemen toko
  'STORE_READ': ['MANAGER', 'ADMIN', 'WAREHOUSE'],
  'STORE_CREATE': ['MANAGER'],
  'STORE_UPDATE': ['MANAGER', 'ADMIN'],
  'STORE_DELETE': ['MANAGER'],

  // Untuk manajemen produk
  'PRODUCT_READ': ['MANAGER', 'ADMIN', 'CASHIER', 'ATTENDANT', 'WAREHOUSE'],
  'PRODUCT_CREATE': ['MANAGER', 'ADMIN'],
  'PRODUCT_UPDATE': ['MANAGER', 'ADMIN'],
  'PRODUCT_DELETE': ['MANAGER', 'ADMIN'],

  // Untuk manajemen transaksi
  'TRANSACTION_READ': ['MANAGER', 'ADMIN', 'CASHIER'],
  'TRANSACTION_CREATE': ['MANAGER', 'ADMIN', 'CASHIER'],
  'TRANSACTION_UPDATE': ['MANAGER', 'ADMIN'],
  'TRANSACTION_DELETE': ['MANAGER', 'ADMIN'],

  // Untuk manajemen user
  'USER_READ': ['MANAGER', 'ADMIN'],
  'USER_CREATE': ['MANAGER', 'ADMIN'],
  'USER_UPDATE': ['MANAGER', 'ADMIN'],
  'USER_DELETE': ['MANAGER', 'ADMIN'],
};

// Fungsi untuk memvalidasi apakah user memiliki permission
export async function checkPermission(userId, userRole, storeId, permission) {
  const requiredRoles = PERMISSIONS[permission];

  if (!requiredRoles) {
    return false; // Permission tidak dikenali
  }

  // Cek apakah role user termasuk dalam role yang diizinkan
  if (requiredRoles.includes(userRole)) {
    // Untuk global roles (MANAGER, WAREHOUSE), mereka bisa akses
    if (['MANAGER', 'WAREHOUSE'].includes(userRole)) {
      return true;
    }

    // Untuk role per toko, verifikasi akses ke toko
    if (storeId) {
      const storeUser = await prisma.storeUser.findFirst({
        where: {
          userId: userId,
          storeId: storeId,
          status: 'ACTIVE',
        },
      });

      return !!storeUser; // Return true jika user memiliki akses ke toko
    }
  }

  return false;
}

// Middleware function untuk API routes
export async function requireAuthAndPermission(request, permission) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return {
        authorized: false,
        error: 'Unauthorized',
        status: 401,
        session: null
      };
    }

    // Dapatkan storeId dari query atau body
    const url = new URL(request.url);
    const storeIdFromQuery = url.searchParams.get('storeId');
    const storeIdFromBody = request.method !== 'GET' ? 
      (request.headers.get('content-type')?.includes('application/json') ? 
        (await request.json()).storeId : null) : null;

    const storeId = storeIdFromQuery || storeIdFromBody || session.user.storeId;

    const hasPermission = await checkPermission(
      session.user.id,
      session.user.role,
      storeId,
      permission
    );

    if (!hasPermission) {
      return {
        authorized: false,
        error: 'Forbidden: Insufficient permissions',
        status: 403,
        session: session
      };
    }

    return {
      authorized: true,
      session: session,
      storeId: storeId
    };
  } catch (error) {
    console.error('Error in requireAuthAndPermission:', error);
    return {
      authorized: false,
      error: 'Internal server error',
      status: 500,
      session: null
    };
  }
}

// Fungsi untuk mengecek role user
export function hasRole(session, roles) {
  if (!session || !session.user || !session.user.role) {
    return false;
  }
  
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return roles.includes(session.user.role);
}

// Fungsi untuk mengecek akses ke toko tertentu
export async function hasStoreAccess(userId, storeId) {
  if (!userId || !storeId) {
    return false;
  }

  // User dengan role global (MANAGER, WAREHOUSE) bisa mengakses semua toko
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (user && ['MANAGER', 'WAREHOUSE'].includes(user.role)) {
    return true;
  }

  // Untuk role per toko, cek StoreUser
  const storeUser = await prisma.storeUser.findFirst({
    where: {
      userId: userId,
      storeId: storeId,
      status: 'ACTIVE',
    },
  });

  return !!storeUser;
}