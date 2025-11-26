# Panduan Penyelesaian Masalah Koneksi Database

## Masalah yang Dihadapi
Sistem Toko Sakinah mengalami masalah koneksi ke database Supabase ketika mencoba mengakses tabel-tabel yang baru dibuat untuk fitur multi-tenant. Pesan error menunjukkan bahwa tabel `StoreUser` tidak ditemukan di database.

## Penyebab Masalah
1. Variabel lingkungan `DATABASE_URL` di sistem Windows masih menunjuk ke localhost
2. Prisma membaca `DATABASE_URL` dari environment variables sistem sebelum membaca dari file `.env`
3. Tabel-tabel untuk fitur multi-tenant belum dibuat di database Supabase

## Solusi Langkah-demi-Langkah

### 1. Update Environment Variables Sistem (Windows)
Anda perlu mengupdate environment variables sistem di Windows:

1. Buka "System Properties" (ketik `sysdm.cpl` di Run atau cari "Environment Variables" di Start menu)
2. Klik "Environment Variables..."
3. Di bagian "System Variables" atau "User Variables", cari variabel bernama `DATABASE_URL`
4. Jika ditemukan, hapus atau update nilainya ke:
   ```
   postgresql://postgres.vcbvntgxtjgnccyekmei:XWDqFZxGUNGwW1Od@db.vcbvntgxtjgnccyekmei.supabase.co:5432/postgres?sslmode=require
   ```
5. Klik OK dan restart command prompt/terminal Anda

### 2. Alternatif: Gunakan Prisma Migrate
Jika Anda ingin menerapkan migrasi skema ke Supabase, jalankan perintah berikut di command prompt (setelah environment variable sistem diupdate):

```bash
cd C:\project\toko-sakinah
npx prisma migrate dev --name add_multi_tenant_features
```

### 3. Jika Menggunakan Local Database
Jika ingin menggunakan database lokal, pastikan PostgreSQL berjalan dan sesuaikan DATABASE_URL di `.env`:
```
DATABASE_URL="postgresql://username:password@localhost:5432/nama_database"
```

### 4. Membuat Tabel Manual di Supabase (Jika migrasi tidak berfungsi)
Jika migrasi tidak berhasil, Anda bisa membuat tabel-tabel berikut secara manual di panel Supabase SQL:

1. Buat tabel `Store`
2. Buat tabel `StoreUser` 
3. Buat tabel `Warehouse`
4. Buat tabel `WarehouseProduct`
5. Buat tabel `WarehouseDistribution`
6. Tambahkan kolom `storeId` ke semua tabel eksisting

File migrasi SQL yang sudah dibuat: `prisma/migrations/20251119000000_add_multi_tenant_schema.sql` berisi semua perintah DDL yang diperlukan.

## File-file yang Telah Dimodifikasi
Berikut adalah file-file yang telah dimodifikasi untuk mendukung fitur multi-tenant:

- `prisma/schema.prisma` - Menambahkan model Store, StoreUser, Warehouse, dll. dan menambahkan storeId ke model eksisting
- `middleware-multi-tenant.js` - Middleware untuk otorisasi multi-tenant
- `lib/authOptions.js` - Penanganan session dengan informasi toko
- `app/api/users/[id]/stores/route.js` - API untuk mendapatkan toko user (telah dihapus karena tidak digunakan)
- Dan banyak file halaman lainnya yang telah disesuaikan

## Akun Default
Setelah migrasi berhasil dan seeding dijalankan, sistem akan memiliki akun default:
- Manager: username `manager`, password `password123`
- Warehouse: username `warehouse`, password `password123`
- Admin Toko: username `admintoko`, password `password123`

## Uji Coba
Setelah menyelesaikan masalah koneksi database:
1. Jalankan `npm run dev` untuk memulai aplikasi
2. Akses `http://localhost:3000`
3. Login sebagai manager (`manager` / `password123`)
4. Pastikan halaman pemilihan toko tampil dengan benar