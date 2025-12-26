import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can access this API
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('Mulai proses perbaikan produk master gudang...');

    // Ambil semua produk yang ada di warehouse master store
    const warehouseProducts = await globalPrisma.product.findMany({
      where: {
        storeId: 'GM001'
      }
    });

    console.log(`Ditemukan ${warehouseProducts.length} produk di warehouse master store`);

    let fixedCount = 0;

    for (const warehouseProduct of warehouseProducts) {
      // Periksa apakah nama produk sama dengan kode produk (kondisi bermasalah)
      if (warehouseProduct.name === warehouseProduct.productCode) {
        console.log(`Memperbaiki produk dengan ID: ${warehouseProduct.id}, nama: ${warehouseProduct.name}, kode: ${warehouseProduct.productCode}`);

        // Cari produk asli dari toko-toko dengan kode produk yang sama
        const originalProduct = await globalPrisma.product.findFirst({
          where: {
            productCode: warehouseProduct.productCode,
            storeId: {
              not: 'GM001' // Bukan dari warehouse master store
            }
          },
          orderBy: {
            createdAt: 'desc' // Ambil yang terbaru
          }
        });

        if (originalProduct) {
          // Update produk master gudang dengan informasi dari produk asli
          await globalPrisma.product.update({
            where: { id: warehouseProduct.id },
            data: {
              name: originalProduct.name,
              description: originalProduct.description,
              categoryId: originalProduct.categoryId,
              supplierId: originalProduct.supplierId,
              image: originalProduct.image,
            }
          });

          console.log(`Produk master gudang dengan ID ${warehouseProduct.id} telah diperbaiki`);
          fixedCount++;
        }
      }
    }

    console.log(`Proses perbaikan selesai. Jumlah produk yang diperbaiki: ${fixedCount}`);

    return NextResponse.json({
      success: true,
      message: `Perbaikan selesai. Jumlah produk yang diperbaiki: ${fixedCount}`,
      fixedCount
    });
  } catch (error) {
    console.error('Error fixing warehouse products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}