// app/api/kategori/import/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simple CSV parser function
function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) {
    throw new Error('File CSV tidak valid: tidak ada data');
  }
  
  const headers = lines[0].split(',').map(header => header.trim().replace(/^"|"$/g, ''));
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) {
      console.warn(`Baris ${i + 1} memiliki jumlah kolom yang tidak sesuai`);
      continue;
    }
    
    const record = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = values[j];
    }
    records.push(record);
  }
  
  return records;
}

// Helper function to parse a CSV line considering quotes and commas inside quotes
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Double quotes inside quoted field
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim().replace(/^"|"$/g, '')); // Remove surrounding quotes
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last value
  values.push(current.trim().replace(/^"|"$/g, '')); // Remove surrounding quotes
  
  return values;
}

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
    
    // Parse CSV (we'll handle Excel file conversion in a more complete implementation)
    let records;
    try {
      records = parseCSV(fileContent);
    } catch (parseError) {
      return NextResponse.json(
        { error: `Gagal menguraikan file CSV: ${parseError.message}` }, 
        { status: 400 }
      );
    }
    
    let importedCount = 0;
    const errors = [];
    
    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Validate required fields - check for 'Nama' or 'Name' column
        const nameField = record['Nama'] || record['Name'] || '';
        
        if (!nameField || !nameField.trim()) {
          errors.push(`Baris ${i + 2}: Nama kategori wajib diisi`);
          continue;
        }
        
        // Check if category already exists
        const existingCategory = await prisma.category.findUnique({
          where: { name: nameField.trim() }
        });
        
        if (existingCategory) {
          errors.push(`Baris ${i + 2}: Kategori dengan nama "${nameField}" sudah ada`);
          continue;
        }
        
        // Create category
        await prisma.category.create({
          data: {
            name: nameField.trim(),
            description: (record['Deskripsi'] || record['Description'] || '').trim() || null
          }
        });
        
        importedCount++;
      } catch (error) {
        errors.push(`Baris ${i + 2}: Gagal memproses - ${error.message}`);
      }
    }
    
    let message = `Berhasil mengimport ${importedCount} kategori`;
    if (errors.length > 0) {
      message += `. Terdapat ${errors.length} error.`;
    }
    
    return NextResponse.json({ 
      message,
      importedCount,
      errors
    });
  } catch (error) {
    console.error('Error importing categories:', error);
    return NextResponse.json(
      { error: 'Gagal mengimport kategori: ' + error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}