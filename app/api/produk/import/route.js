// app/api/produk/import/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';

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
        if (!record['Nama Produk'] && !record['Name']) {
          errors.push(`Baris ${i + 2}: Nama produk wajib diisi`);
          continue;
        }
        
        if (!record['Kode Produk'] && !record['Code']) {
          errors.push(`Baris ${i + 2}: Kode produk wajib diisi`);
          continue;
        }
        
        if (!record['Harga Jual'] && !record['Selling Price']) {
          errors.push(`Baris ${i + 2}: Harga jual wajib diisi`);
          continue;
        }
        
        // Determine field names (support both English and Indonesian)
        const name = record['Nama Produk'] || record['Name'];
        const code = record['Kode Produk'] || record['Code'];
        const categoryId = record['Kategori ID'] || record['Category ID'];
        const supplierId = record['Supplier ID'];
        const stock = record['Stok'] || record['Stock'] || 0;
        const purchasePrice = record['Harga Beli'] || record['Purchase Price'] || 0;
        const sellingPrice = record['Harga Jual'] || record['Selling Price'];
        const description = record['Deskripsi'] || record['Description'] || null;
        
        // Check if product code already exists
        const existingProduct = await prisma.product.findUnique({
          where: { productCode: code.trim() }
        });
        
        if (existingProduct) {
          errors.push(`Baris ${i + 2}: Kode produk "${code}" sudah ada`);
          continue;
        }
        
        // Check if category exists
        if (categoryId) {
          const category = await prisma.category.findUnique({
            where: { id: categoryId }
          });
          
          if (!category) {
            errors.push(`Baris ${i + 2}: Kategori dengan ID "${categoryId}" tidak ditemukan`);
            continue;
          }
        }
        
        // Check if supplier exists
        if (supplierId) {
          const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId }
          });
          
          if (!supplier) {
            errors.push(`Baris ${i + 2}: Supplier dengan ID "${supplierId}" tidak ditemukan`);
            continue;
          }
        }
        
        // Create product
        await prisma.product.create({
          data: {
            name: name.trim(),
            productCode: code.trim(),
            categoryId: categoryId || null,
            supplierId: supplierId || null,
            stock: parseInt(stock) || 0,
            purchasePrice: parseInt(purchasePrice) || 0,
            sellingPrice: parseInt(sellingPrice) || 0,
            discount1_3: 1000, // Default value
            discount4_6: 0,    // Default value 
            discountMore: null, // Optional field
            description: description?.trim() || null
          }
        });
        
        importedCount++;
      } catch (error) {
        errors.push(`Baris ${i + 2}: Gagal memproses - ${error.message}`);
      }
    }
    
    let message = `Berhasil mengimport ${importedCount} produk`;
    if (errors.length > 0) {
      message += `. Terdapat ${errors.length} error.`;
    }
    
    return NextResponse.json({ 
      message,
      importedCount,
      errors
    });
  } catch (error) {
    console.error('Error importing products:', error);
    return NextResponse.json(
      { error: 'Gagal mengimport produk: ' + error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}