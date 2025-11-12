// app/api/supplier/import/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';

// Zod Schema for validating imported supplier data
const importSupplierSchema = z.object({
  name: z.string().trim().min(1, { message: 'Nama supplier wajib diisi' }),
  address: z.string().trim().optional().nullable().default(null),
  phone: z.string().trim().optional().nullable().default(null),
  email: z.string().trim().email({ message: 'Format email tidak valid' }).optional().nullable().default(null),
});

export async function POST(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop().toLowerCase();

    let records = [];
    let importedCount = 0;
    let updatedCount = 0;
    const failedRecords = [];

    if (fileExtension === 'csv') {
      records = parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      records = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      return NextResponse.json({ error: 'Format file tidak didukung. Hanya CSV atau Excel (.xlsx, .xls) yang diterima.' }, { status: 400 });
    }

    for (const record of records) {
      try {
        // Map keys to match schema if necessary (e.g., 'Nama' -> 'name')
        const mappedRecord = {
          name: record['Nama'] || record['name'],
          address: record['Alamat'] || record['address'],
          phone: record['Telepon'] || record['phone'],
          email: record['Email'] || record['email'],
        };

        const validatedData = importSupplierSchema.parse(mappedRecord);

        const upsertedSupplier = await prisma.supplier.upsert({
          where: { name: validatedData.name },
          update: {
            address: validatedData.address,
            phone: validatedData.phone,
            email: validatedData.email,
          },
          create: {
            name: validatedData.name,
            address: validatedData.address,
            phone: validatedData.phone,
            email: validatedData.email,
          },
        });

        if (upsertedSupplier.createdAt.getTime() === upsertedSupplier.updatedAt.getTime()) {
          importedCount++; // Created
        } else {
          updatedCount++; // Updated
        }

      } catch (error) {
        if (error.errors || (error instanceof z.ZodError)) {
          // This is a validation error
          failedRecords.push({ record, error: error.errors || error.message });
        } else {
          // This is likely a database error
          console.error('Database error during import:', error);
          failedRecords.push({ record, error: error.message });
        }
      }
    }

    return NextResponse.json({
      message: 'Proses import selesai.',
      importedCount,
      updatedCount,
      failedCount: failedRecords.length,
      failedRecords,
    });

  } catch (error) {
    console.error('Error during supplier import:', error);
    return NextResponse.json(
      { error: 'Gagal memproses file import: ' + error.message },
      { status: 500 }
    );
  }
}
