# Panduan Konektivitas ke Supabase

## Langkah 1: Dapatkan Connection String dari Supabase

1. Buka dashboard Supabase Anda di https://supabase.com
2. Pilih proyek yang telah Anda buat
3. Pergi ke menu "Project Settings" (biasanya di pojok kiri bawah)
4. Pilih "Database"
5. Salin "Connection string" yang tersedia

Format connection string biasanya seperti ini:
```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?sslmode=require
```

## Langkah 2: Update Environment Variables

Ganti isi file `.env` dengan connection string dari Supabase:

```
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?sslmode=require"
NEXTAUTH_SECRET="secret_yang_anda_buat_sendiri"
NEXTAUTH_URL="http://localhost:3000"
DIRECT_URL="postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?sslmode=require"
```

## Langkah 3: Update Schema Prisma (Jika Diperlukan)

File `prisma/schema.prisma` mungkin perlu sedikit modifikasi untuk kompatibilitas Supabase:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/@prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## Langkah 4: Deploy Schema ke Supabase

Jalankan perintah berikut di terminal:

```bash
# Generate ulang Prisma client
npx prisma generate

# Push schema ke database Supabase
npx prisma db push

# Jika ingin mengisi data awal
npx prisma db seed
```

## Langkah 5: Uji Koneksi

Jalankan aplikasi untuk memastikan koneksi berhasil:

```bash
npm run dev
```

## Troubleshooting Umum

### Error SSL
- Pastikan connection string memiliki `sslmode=require`
- Jika masih error, coba tambahkan `?sslmode=no-verify` sebagai alternatif sementara

### Error Connection Timeout
- Pastikan firewall Supabase mengizinkan koneksi
- Cek apakah connection string benar
- Pastikan database tidak dalam status paused

### Error Migration
- Jika muncul error saat `prisma db push`, coba `prisma migrate dev --name init`
- Pastikan tidak ada fitur PostgreSQL yang tidak didukung Supabase

## Backup Data Lokal Sebelum Migrasi

Sebelum mengganti database lokal dengan Supabase, buat backup terlebih dahulu:

```bash
# Jika Anda menggunakan PostgreSQL lokal
pg_dump "postgresql://[LOCAL_USER]:[LOCAL_PASSWORD]@[LOCAL_HOST]:[LOCAL_PORT]/[LOCAL_DATABASE]" > backup_local.sql
```

## Rollback Jika Diperlukan

Jika terjadi masalah, Anda bisa kembali ke database lokal dengan mengembalikan nilai DATABASE_URL di file `.env` ke konfigurasi semula.