// lib/validation.js
import { z } from 'zod';

// Fungsi untuk membersihkan input dari karakter berbahaya
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Hapus karakter yang bisa digunakan untuk SQL injection
  return input
    .replace(/'/g, "''") // Ganti single quote dengan double single quote
    .replace(/;/g, '') // Hapus semicolon
    .replace(/--/g, '') // Hapus komentar SQL
    .replace(/\/\*/g, '') // Hapa buka komentar
    .replace(/\*\//g, '') // Hapus tutup komentar
    .replace(/\b(OR|AND)\s+1\s*=\s*1\b/gi, '') // Deteksi dan hapus tanda SQL injection umum
    .trim();
}

// Fungsi untuk memvalidasi apakah input mengandung potensi SQL injection
export function validateForSQLInjection(input) {
  if (typeof input !== 'string') return true;
  
  // Pola umum SQL injection
  const sqlInjectionPatterns = [
    /(\b(union|select|insert|delete|update|drop|create|alter|exec|execute|script)\b)/gi,
    /(;|\-\-|\/\*|\*\/|xp_|sp_|sysobjects|syscolumns|0x)/gi,
    /('|"|`)/g,  // Tanda kutip yang tidak biasa
    /\b(OR|AND)\s+.*\s*=\s*.*/gi  // Kondisi OR/AND yang mencurigakan
  ];
  
  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(input)) {
      return false;
    }
  }
  
  return true;
}

// Skema validasi Zod untuk berbagai input
export const userSchema = z.object({
  username: z.string()
    .min(3, { message: "Username minimal 3 karakter" })
    .max(50, { message: "Username maksimal 50 karakter" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username hanya boleh berisi huruf, angka, dan underscore" }),
  name: z.string()
    .min(1, { message: "Nama harus diisi" })
    .max(100, { message: "Nama maksimal 100 karakter" })
    .regex(/^[a-zA-Z\s]+$/, { message: "Nama hanya boleh berisi huruf dan spasi" }),
  password: z.string()
    .min(8, { message: "Password minimal 8 karakter" })
    .max(100, { message: "Password maksimal 100 karakter" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: "Password harus berisi huruf besar, huruf kecil, dan angka" }),
  email: z.string().email({ message: "Email tidak valid" }).optional().or(z.literal('')),
  employeeNumber: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER', 'ATTENDANT', 'WAREHOUSE'], {
    errorMap: () => ({ message: "Role tidak valid" })
  })
});

export const productSchema = z.object({
  name: z.string()
    .min(1, { message: "Nama produk harus diisi" })
    .max(200, { message: "Nama produk maksimal 200 karakter" }),
  code: z.string()
    .min(1, { message: "Kode produk harus diisi" })
    .max(50, { message: "Kode produk maksimal 50 karakter" })
    .regex(/^[A-Z0-9-]+$/, { message: "Kode hanya boleh berisi huruf besar, angka, dan tanda hubung" }),
  stock: z.number().int().min(0, { message: "Stok tidak boleh negatif" }),
  category: z.string()
    .min(1, { message: "Kategori harus diisi" })
    .max(100, { message: "Kategori maksimal 100 karakter" }),
  supplier: z.string()
    .min(1, { message: "Supplier harus diisi" })
    .max(100, { message: "Supplier maksimal 100 karakter" }),
  description: z.string().max(1000, { message: "Deskripsi maksimal 1000 karakter" }).optional(),
  priceBuy: z.number().min(0, { message: "Harga beli tidak boleh negatif" }),
  priceSellMin: z.number().min(0, { message: "Harga jual minimum tidak boleh negatif" }),
  priceSellMax: z.number().min(0).optional(), // Boleh null untuk tier terakhir
  priceSell: z.number().min(0, { message: "Harga jual tidak boleh negatif" })
});

export const transactionSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1, { message: "Jumlah minimal 1" }),
    price: z.number().min(0, { message: "Harga tidak boleh negatif" })
  })).min(1, { message: "Transaksi harus memiliki setidaknya satu item" }),
  total: z.number().min(0, { message: "Total tidak boleh negatif" }),
  discount: z.number().min(0, { message: "Diskon tidak boleh negatif" }).optional(),
  paymentMethod: z.enum(['CASH', 'CREDIT', 'TRANSFER'], { errorMap: () => ({ message: "Metode pembayaran tidak valid" }) }),
  paymentAmount: z.number().min(0, { message: "Jumlah pembayaran tidak boleh negatif" })
});

// Fungsi umum untuk validasi input
export function validateInput(schema, data) {
  try {
    // Sanitize input terlebih dahulu
    const sanitizedData = sanitizeData(data);
    
    // Validasi dengan Zod
    const validatedData = schema.parse(sanitizedData);
    
    return {
      success: true,
      data: validatedData,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.errors || [{ message: error.message }]
    };
  }
}

// Fungsi rekursif untuk sanitasi data
function sanitizeData(data) {
  if (typeof data === 'string') {
    // Validasi apakah input mengandung potensi SQL injection
    if (!validateForSQLInjection(data)) {
      throw new Error('Input mengandung potensi SQL injection');
    }
    return sanitizeInput(data);
  } else if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  } else if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }
  return data;
}

// Middleware untuk validasi API routes
export function withValidation(schema) {
  return async (handler) => {
    return async (req, ...args) => {
      if (req.method === 'POST' || req.method === 'PUT') {
        try {
          const body = await req.json();
          const result = validateInput(schema, body);
          
          if (!result.success) {
            return new Response(
              JSON.stringify({ 
                error: 'Validasi input gagal', 
                details: result.error 
              }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }
          
          // Update request body dengan data yang telah divalidasi
          req.body = result.data;
        } catch (error) {
          return new Response(
            JSON.stringify({ error: 'Format JSON tidak valid' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      
      return handler(req, ...args);
    };
  };
}