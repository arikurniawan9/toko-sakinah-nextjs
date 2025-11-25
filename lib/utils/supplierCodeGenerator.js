// lib/utils/supplierCodeGenerator.js
import prisma from '@/lib/prisma';

export const generateSupplierCode = async (storeId) => {
  try {
    // Ambil jumlah supplier yang ada di store ini
    const count = await prisma.supplier.count({
      where: {
        storeId: storeId
      }
    });

    // Generate kode dalam format SUP-XXX (contoh: SUP-001, SUP-002, dst.)
    const nextNumber = count + 1;
    const code = `SUP-${nextNumber.toString().padStart(3, '0')}`;

    return code;
  } catch (error) {
    console.error('Error generating supplier code:', error);
    throw error;
  }
};

// Fungsi untuk generate kode supplier sementara jika ada error
export const generateFallbackSupplierCode = () => {
  // Contoh: SUP-XXX-YYYY (XXX: timestamp singkat, YYYY: angka acak)
  const timestamp = new Date().getTime().toString().slice(-4); // Ambil 4 digit terakhir timestamp
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // 4 digit angka acak
  return `SUP-${timestamp}${random}`;
};