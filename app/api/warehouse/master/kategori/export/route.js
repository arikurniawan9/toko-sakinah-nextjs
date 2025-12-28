export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

// Ini adalah endpoint untuk export master kategori gudang
// Kita menggunakan toko dengan ID khusus untuk menyimpan master data gudang
const WAREHOUSE_STORE_ID = 'GM001'; // ID khusus untuk menyimpan master data

// GET /api/warehouse/master/kategori/export
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can access this API
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Ambil master kategori dari toko gudang
    const categories = await globalPrisma.category.findMany({
      where: {
        storeId: WAREHOUSE_STORE_ID
      },
      orderBy: {
        name: 'asc',
      }
    });

    // Format data untuk export
    const exportData = categories.map((category, index) => ({
      'No.': index + 1,
      'Nama Kategori': category.name,
      'Deskripsi': category.description || '-',
      'Ikon': category.icon || '-',
      'Tanggal Dibuat': new Date(category.createdAt).toLocaleDateString('id-ID'),
      'Tanggal Diubah': new Date(category.updatedAt).toLocaleDateString('id-ID'),
    }));

    return NextResponse.json({ 
      message: 'Data kategori master gudang berhasil diambil',
      data: exportData,
      count: exportData.length
    }, { status: 200 });
  } catch (error) {
    console.error('Error exporting master categories for warehouse:', error);
    return NextResponse.json({ error: 'Gagal mengambil data kategori master gudang' }, { status: 500 });
  }
}