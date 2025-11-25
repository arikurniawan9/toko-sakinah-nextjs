// app/api/supplier/import/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Get storeId based on user's assigned store
    const storeUser = await prisma.storeUser.findFirst({
      where: {
        userId: session.user.id,
        role: { in: ['ADMIN', 'MANAGER'] } // Only admin/manager can add suppliers
      },
      select: {
        storeId: true
      }
    });

    if (!storeUser) {
      return NextResponse.json({ error: 'User does not have access to any store' }, { status: 400 });
    }

    // Validasi data
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Data tidak valid atau kosong' }, { status: 400 });
    }

    // Validasi setiap item
    const validatedData = [];
    const validationErrors = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const errors = [];

      // Validasi wajib
      if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
        errors.push('Nama supplier wajib diisi');
      }
      if (!item.code || typeof item.code !== 'string' || item.code.trim() === '') {
        errors.push('Kode supplier wajib diisi');
      }
      if (!item.phone || typeof item.phone !== 'string' || item.phone.trim() === '') {
        errors.push('Telepon supplier wajib diisi');
      }

      // Validasi format email jika diisi
      if (item.email && typeof item.email === 'string') {
        // Hapus spasi di awal/akhir email sebelum validasi
        const trimmedEmail = item.email.trim();
        if (trimmedEmail) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(trimmedEmail)) {
            errors.push('Format email tidak valid');
          }
        }
      }

      if (errors.length > 0) {
        validationErrors.push({
          index: i,
          name: item.name || `Item ${i + 1}`,
          errors: errors.join(', ')
        });
      } else {
        validatedData.push({
          code: item.code.trim(),
          name: item.name.trim(),
          contactPerson: item.contactPerson ? item.contactPerson.trim() : null,
          phone: item.phone ? item.phone.trim() : null,
          email: item.email ? item.email.trim() : null,
          address: item.address ? item.address.trim() : null,
          storeId: storeUser.storeId // Tambahkan storeId
        });
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        error: 'Beberapa data tidak valid',
        results: validationErrors.map(err => ({
          name: err.name,
          status: 'failed',
          error: err.errors
        })),
        totalProcessed: data.length,
        created: 0,
        updated: 0,
        failed: validationErrors.length
      }, { status: 400 });
    }

    // Import data ke database
    let createdCount = 0;
    let updatedCount = 0;
    const importResults = [];

    for (const supplierData of validatedData) {
      try {
        // Cek apakah supplier sudah ada berdasarkan kode dan storeId (karena kode harus unik)
        const existingSupplier = await prisma.supplier.findFirst({
          where: {
            code: supplierData.code,
            storeId: supplierData.storeId // Hanya cari supplier dalam store yang sama
          }
        });

        if (existingSupplier) {
          // Update supplier yang sudah ada (hanya field yang tidak kosong)
          const updatedSupplier = await prisma.supplier.update({
            where: { id: existingSupplier.id },
            data: {
              name: supplierData.name,
              contactPerson: supplierData.contactPerson,
              phone: supplierData.phone,
              email: supplierData.email,
              address: supplierData.address
            }
          });
          updatedCount++;
          importResults.push({
            name: updatedSupplier.name,
            status: 'updated'
          });
        } else {
          // Buat supplier baru dengan kode manual
          const newSupplier = await prisma.supplier.create({
            data: supplierData
          });
          createdCount++;
          importResults.push({
            name: newSupplier.name,
            status: 'created'
          });
        }
      } catch (error) {
        // Tangani error seperti constraint unik atau field yang tidak valid
        let errorMessage = error.message || 'Gagal menyimpan data';

        // Tambahkan penanganan khusus untuk error Prisma
        if (error.code === 'P2002') {
          // Error constraint unik (misalnya kode atau kombinasi kode-storeId sudah ada)
          const target = error.meta?.target;
          if (target && Array.isArray(target)) {
            errorMessage = `Kode supplier '${supplierData.code}' sudah digunakan dalam toko ini`;
          } else {
            errorMessage = 'Kode atau kombinasi kode dan toko sudah digunakan';
          }
        }

        importResults.push({
          name: supplierData.name,
          status: 'failed',
          error: errorMessage
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${createdCount + updatedCount} supplier`,
      results: importResults,
      totalProcessed: validatedData.length,
      created: createdCount,
      updated: updatedCount,
      failed: importResults.filter(r => r.status === 'failed').length
    });
  } catch (error) {
    console.error('Error importing suppliers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}