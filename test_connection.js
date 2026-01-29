// File untuk menguji koneksi ke Supabase
const { PrismaClient } = require('@prisma/client');

// Membuat client dengan connection string yang di-encode
const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Mencoba menghubungkan ke database...');
    
    // Menguji koneksi dengan query sederhana
    await prisma.$connect();
    console.log('✓ Koneksi ke database berhasil!');
    
    // Menguji query sederhana
    const userCount = await prisma.user.count();
    console.log(`✓ Query berhasil dijalankan. Jumlah user: ${userCount}`);
    
  } catch (error) {
    console.error('✗ Error saat menghubungkan ke database:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('Koneksi ditutup.');
  }
}

// Jalankan tes koneksi
testConnection();