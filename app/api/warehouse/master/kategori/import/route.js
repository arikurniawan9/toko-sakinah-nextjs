export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import { z } from 'zod';

// Schema untuk validasi import kategori
const importCategorySchema = z.object({
  name: z.string().trim().min(1, { message: 'Nama kategori wajib diisi' }),
  description: z.string().trim().optional().nullable(),
  icon: z.string().trim().optional().nullable(),
});

// Ini adalah endpoint untuk import master kategori gudang
// Kita menggunakan toko dengan ID khusus untuk menyimpan master data gudang
const WAREHOUSE_STORE_ID = 'GM001'; // ID khusus untuk menyimpan master data
const WAREHOUSE_STORE_NAME = 'Master Data Gudang'; // Nama untuk store virtual

// POST /api/warehouse/master/kategori/import
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
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Body request harus berupa array kategori' },
        { status: 400 }
      );
    }

    // Pastikan store master gudang sudah ada, jika belum maka buat
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

    const importResults = [];
    for (const item of body) {
      try {
        const validatedCategory = importCategorySchema.parse(item);

        // Cek apakah kategori dengan nama yang sama sudah ada
        const existingCategory = await globalPrisma.category.findFirst({
          where: {
            name: { equals: validatedCategory.name },
            storeId: WAREHOUSE_STORE_ID,
          },
        });

        if (existingCategory) {
          // Update kategori yang sudah ada
          const updatedCategory = await globalPrisma.category.update({
            where: { id: existingCategory.id },
            data: {
              description: validatedCategory.description,
              icon: validatedCategory.icon,
            },
          });
          importResults.push({ 
            name: validatedCategory.name, 
            status: 'updated',
            category: updatedCategory
          });
        } else {
          // Buat kategori baru
          const newCategory = await globalPrisma.category.create({
            data: {
              name: validatedCategory.name,
              description: validatedCategory.description,
              icon: validatedCategory.icon,
              storeId: WAREHOUSE_STORE_ID,
            },
          });
          importResults.push({ 
            name: validatedCategory.name, 
            status: 'created',
            category: newCategory
          });
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          importResults.push({
            name: item.name || 'Unknown',
            status: 'failed',
            error: error.errors[0].message,
          });
        } else {
          importResults.push({
            name: item.name || 'Unknown',
            status: 'failed',
            error: error.message,
          });
        }
      }
    }

    const createdCount = importResults.filter(r => r.status === 'created').length;
    const updatedCount = importResults.filter(r => r.status === 'updated').length;
    const failedCount = importResults.filter(r => r.status === 'failed').length;

    return NextResponse.json(
      {
        message: 'Import kategori master gudang selesai',
        totalProcessed: importResults.length,
        created: createdCount,
        updated: updatedCount,
        failed: failedCount,
        results: importResults,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error importing master categories for warehouse:', error);
    return NextResponse.json(
      { error: 'Gagal melakukan import kategori master gudang' },
      { status: 500 }
    );
  }
}