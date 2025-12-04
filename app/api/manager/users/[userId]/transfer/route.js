// app/api/manager/users/[userId]/transfer/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import { logUserTransfer } from '@/lib/auditLogger';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id || session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = params;
    const { targetStoreId, targetRole, removeFromCurrentStore = true } = await request.json();

    // Validasi bahwa user dan toko tujuan ada
    const [user, targetStore, currentStoreUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.store.findUnique({ where: { id: targetStoreId } }),
      prisma.storeUser.findFirst({ where: { userId } }) // Dapatkan toko saat ini dari user
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    if (!targetStore) {
      return NextResponse.json({ error: 'Toko tujuan tidak ditemukan' }, { status: 404 });
    }

    // Validasi role
    const validRoles = [ROLES.ADMIN, ROLES.CASHIER, ROLES.ATTENDANT, ROLES.MANAGER, ROLES.WAREHOUSE];
    if (!validRoles.includes(targetRole)) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 });
    }

    // Simpan informasi sebelum transfer untuk logging
    const fromStoreId = currentStoreUser ? currentStoreUser.storeId : null;

    // Lakukan transfer dalam satu transaksi
    await prisma.$transaction(async (tx) => {
      // Hapus dari toko lama jika diperlukan
      if (removeFromCurrentStore) {
        await tx.storeUser.deleteMany({
          where: { userId }
        });
      }

      // Tambahkan ke toko baru
      await tx.storeUser.create({
        data: {
          userId,
          storeId: targetStoreId,
          role: targetRole,
          status: 'ACTIVE',
          assignedBy: session.user.id,
        }
      });

      // Perbarui role global user di tabel user agar sesuai dengan role yang dipilih
      await tx.user.update({
        where: { id: userId },
        data: { role: targetRole }
      });
    });

    // Log aktivitas transfer user
    const requestHeaders = new Headers(request.headers);
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
    const userAgent = requestHeaders.get('user-agent') || '';

    await logUserTransfer(session.user.id, userId, fromStoreId, targetStoreId, targetRole, ipAddress, userAgent);

    return NextResponse.json({
      message: 'User berhasil dipindahkan ke toko baru',
      success: true
    });
  } catch (error) {
    console.error('Error transferring user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}