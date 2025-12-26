export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

// Ini adalah endpoint untuk distribusi produk dari master gudang ke toko tertentu
const WAREHOUSE_STORE_ID = 'GM001'; // ID khusus untuk menyimpan master data
const WAREHOUSE_STORE_NAME = 'Master Data Gudang'; // Nama untuk store virtual

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

    const body = await request.json();
    const { targetStoreId, items } = body; // targetStoreId adalah toko tujuan, items berisi produk master yang akan didistribusikan

    if (!targetStoreId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Target store ID dan items distribusi wajib disediakan' }, { status: 400 });
    }

    // Validasi bahwa target store ada
    const targetStore = await globalPrisma.store.findUnique({
      where: { id: targetStoreId }
    });

    if (!targetStore) {
      return NextResponse.json({ error: 'Target store tidak ditemukan' }, { status: 400 });
    }

    // Pastikan store master gudang sudah ada
    let warehouseStore = await globalPrisma.store.findUnique({
      where: { id: WAREHOUSE_STORE_ID }
    });

    if (!warehouseStore) {
      warehouseStore = await globalPrisma.store.create({
        data: {
          id: WAREHOUSE_STORE_ID,
          name: WAREHOUSE_STORE_NAME,
          description: 'Store virtual untuk menyimpan master data gudang',
          status: 'ACTIVE'
        }
      });
    }

    // Lakukan distribusi dalam transaksi untuk memastikan konsistensi data
    const distributionResult = await globalPrisma.$transaction(async (prisma) => {
      const distributedProducts = [];

      for (const item of items) {
        const { masterProductId, quantity, unitPrice } = item;

        // Ambil produk master dari warehouse
        const masterProduct = await prisma.product.findFirst({
          where: {
            id: masterProductId,
            storeId: WAREHOUSE_STORE_ID
          },
          include: {
            category: true,
            supplier: true
          }
        });

        if (!masterProduct) {
          throw new Error(`Produk master dengan ID ${masterProductId} tidak ditemukan di gudang`);
        }

        // Buat produk baru di toko target jika belum ada
        let storeProduct = await prisma.product.findFirst({
          where: {
            productCode: masterProduct.productCode,
            storeId: targetStoreId
          }
        });

        if (!storeProduct) {
          // Buat produk baru di toko target menggunakan data dari produk master
          storeProduct = await prisma.product.create({
            data: {
              name: masterProduct.name,
              productCode: masterProduct.productCode,
              categoryId: masterProduct.categoryId, // Asumsi kategori juga didistribusikan
              purchasePrice: unitPrice || masterProduct.purchasePrice,
              supplierId: masterProduct.supplierId, // Asumsi supplier juga didistribusikan
              stock: quantity,
              description: masterProduct.description,
              storeId: targetStoreId
            },
            include: {
              category: true,
              supplier: true
            }
          });
        } else {
          // Jika produk sudah ada di toko, hanya tambahkan stok
          storeProduct = await prisma.product.update({
            where: { id: storeProduct.id },
            data: {
              stock: {
                increment: quantity
              },
              purchasePrice: unitPrice || masterProduct.purchasePrice // Update harga jika diberikan
            },
            include: {
              category: true,
              supplier: true
            }
          });
        }

        // Tambahkan produk ke hasil distribusi
        distributedProducts.push({
          masterProduct: masterProduct,
          storeProduct: storeProduct,
          quantity: quantity,
          unitPrice: unitPrice || masterProduct.purchasePrice
        });

        // Buat entri distribusi untuk riwayat
        await prisma.warehouseDistribution.create({
          data: {
            warehouseId: warehouseStore.id, // Gunakan ID warehouse store
            storeId: targetStoreId,
            productId: storeProduct.id,
            quantity: quantity,
            unitPrice: unitPrice || masterProduct.purchasePrice,
            totalAmount: (unitPrice || masterProduct.purchasePrice) * quantity,
            distributedBy: session.user.id,
            notes: `Distribusi dari produk master ${masterProduct.name}`
          }
        });
      }

      return distributedProducts;
    });

    return NextResponse.json({
      success: true,
      message: 'Distribusi produk dari gudang ke toko berhasil',
      distributedProducts: distributionResult
    }, { status: 200 });
  } catch (error) {
    console.error('Error distributing products from warehouse to store:', error);

    if (error.message && error.message.includes('tidak ditemukan')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error.code === 'P2003' || error.code === 'P2025') {
      return NextResponse.json({ error: 'Store atau produk tidak ditemukan' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Endpoint untuk mendapatkan daftar toko yang bisa dituju untuk distribusi
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

    // Pastikan store master gudang sudah ada
    let warehouseStore = await globalPrisma.store.findUnique({
      where: { id: WAREHOUSE_STORE_ID }
    });

    if (!warehouseStore) {
      warehouseStore = await globalPrisma.store.create({
        data: {
          id: WAREHOUSE_STORE_ID,
          name: WAREHOUSE_STORE_NAME,
          description: 'Store virtual untuk menyimpan master data gudang',
          status: 'ACTIVE'
        }
      });
    }

    const stores = await globalPrisma.store.findMany({
      where: {
        id: { not: WAREHOUSE_STORE_ID } // Exclude the warehouse master store
      }
    });

    return NextResponse.json({ stores });
  } catch (error) {
    console.error('Error fetching stores for distribution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}