import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const importCategorySchema = z.object({
  name: z.string().trim().min(1, { message: 'Nama kategori wajib diisi' }),
  description: z.string().trim().optional().nullable(),
  icon: z.string().trim().optional().nullable(),
});

// POST /api/kategori/import - Import categories from Excel/JSON
export async function POST(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const storeId = session.user.storeId;
  if (!storeId) {
    return NextResponse.json(
      { error: 'User tidak terkait dengan toko manapun' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Body request harus berupa array kategori' },
        { status: 400 }
      );
    }

    const importResults = [];
    for (const item of body) {
      try {
        const validatedCategory = importCategorySchema.parse(item);

        const existingCategory = await prisma.category.findFirst({
          where: {
            name: { equals: validatedCategory.name },
            storeId: storeId,
          },
        });

        if (existingCategory) {
          // Update existing category
          await prisma.category.update({
            where: { id: existingCategory.id },
            data: {
              description: validatedCategory.description,
              icon: validatedCategory.icon,
            },
          });
          importResults.push({ name: validatedCategory.name, status: 'updated' });
        } else {
          // Create new category
          await prisma.category.create({
            data: {
              name: validatedCategory.name,
              description: validatedCategory.description,
              icon: validatedCategory.icon,
              storeId: storeId,
            },
          });
          importResults.push({ name: validatedCategory.name, status: 'created' });
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
        message: 'Import kategori selesai',
        totalProcessed: importResults.length,
        created: createdCount,
        updated: updatedCount,
        failed: failedCount,
        results: importResults,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error importing categories:', error);
    return NextResponse.json(
      { error: 'Gagal melakukan import kategori' },
      { status: 500 }
    );
  }
}
