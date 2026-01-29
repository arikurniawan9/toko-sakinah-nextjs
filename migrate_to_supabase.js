#!/usr/bin/env node

/**
 * Script untuk membantu migrasi ke Supabase
 * 
 * Cara menggunakan:
 * 1. Pastikan .env sudah diisi dengan connection string Supabase
 * 2. Jalankan: node migrate_to_supabase.js
 */

require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');

console.log('Memulai proses migrasi ke Supabase...');

// 1. Generate Prisma Client
console.log('\n1. Mengenerate Prisma Client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✓ Prisma Client berhasil digenerate');
} catch (error) {
  console.error('✗ Gagal mengenerate Prisma Client:', error.message);
  process.exit(1);
}

// 2. Push schema ke database Supabase
console.log('\n2. Mempush schema ke database Supabase...');
try {
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✓ Schema berhasil dipush ke database Supabase');
} catch (error) {
  console.error('✗ Gagal mempush schema ke database:', error.message);
  console.log('Coba jalankan: npx prisma db pull untuk mengambil schema dari database');
  process.exit(1);
}

// 3. Jalankan seeding jika diperlukan
console.log('\n3. Menjalankan seeding data awal...');
try {
  execSync('npx prisma db seed', { stdio: 'inherit' });
  console.log('✓ Data seeding berhasil');
} catch (error) {
  console.log('⚠ Data seeding mungkin gagal atau tidak diperlukan:', error.message);
  console.log('Ini normal jika seeding belum dikonfigurasi');
}

// 4. Validasi koneksi
console.log('\n4. Memvalidasi koneksi ke database...');
try {
  execSync('npx prisma db pull', { stdio: 'inherit' });
  console.log('✓ Koneksi ke database berhasil divalidasi');
} catch (error) {
  console.error('⚠ Validasi koneksi mungkin gagal:', error.message);
}

console.log('\n✅ Proses migrasi ke Supabase selesai!');
console.log('\nLangkah selanjutnya:');
console.log('- Jalankan aplikasi dengan: npm run dev');
console.log('- Pastikan tidak ada error saat startup');
console.log('- Coba akses halaman login untuk memastikan semuanya berfungsi');

// Opsional: Backup schema lokal
console.log('\n5. Membuat backup schema lokal...');
try {
  const schema = fs.readFileSync('./prisma/schema.prisma', 'utf8');
  fs.writeFileSync('./prisma/schema.prisma.backup', schema);
  console.log('✓ Backup schema berhasil dibuat');
} catch (error) {
  console.log('⚠ Gagal membuat backup schema:', error.message);
}