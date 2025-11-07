// app/api/kasir/import/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan dalam permintaan' }, 
        { status: 400 }
      );
    }
    
    // Read the file content
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileContent = buffer.toString('utf-8');
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    
    let importedCount = 0;
    const errors = [];
    
    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Validate required fields
        if (!record['Nama'] && !record['Name']) {
          errors.push(`Baris ${i + 2}: Nama wajib diisi`);
          continue;
        }
        
        if (!record['Username'] && !record['User']) {
          errors.push(`Baris ${i + 2}: Username wajib diisi`);
          continue;
        }
        
        if (!record['Password'] && !record['Pass']) {
          errors.push(`Baris ${i + 2}: Password wajib diisi`);
          continue;
        }
        
        // Determine field names (support both English and Indonesian)
        const name = record['Nama'] || record['Name'];
        const username = record['Username'] || record['User'];
        const password = record['Password'] || record['Pass'];
        
        // Check if username already exists
        const existingUser = await prisma.user.findUnique({
          where: { username: username.trim() }
        });
        
        if (existingUser) {
          errors.push(`Baris ${i + 2}: Username "${username}" sudah ada`);
          continue;
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user with CASHIER role
        await prisma.user.create({
          data: {
            name: name.trim(),
            username: username.trim(),
            password: hashedPassword,
            role: 'CASHIER'
          }
        });
        
        importedCount++;
      } catch (error) {
        errors.push(`Baris ${i + 2}: Gagal memproses - ${error.message}`);
      }
    }
    
    let message = `Berhasil mengimport ${importedCount} kasir`;
    if (errors.length > 0) {
      message += `. Terdapat ${errors.length} error.`;
    }
    
    return NextResponse.json({ 
      message,
      importedCount,
      errors
    });
  } catch (error) {
    console.error('Error importing cashiers:', error);
    return NextResponse.json(
      { error: 'Gagal mengimport kasir: ' + error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}