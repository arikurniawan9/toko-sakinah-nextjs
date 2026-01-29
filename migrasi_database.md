# Panduan Migrasi Database untuk Sistem Toko Sakinah

## Rekomendasi Alternatif Database Online Gratis

### 1. Supabase (Direkomendasikan)
- **Platform**: PostgreSQL
- **Kelebihan**:
  - Kompatibel dengan sistem saat ini (PostgreSQL)
  - Fitur real-time bawaan (cocok untuk notifikasi)
  - Otentikasi bawaan
  - Mudah migrasi dari PostgreSQL lokal
- **Batas Gratis**: 500MB storage, 100MB transfer/hari
- **Link**: https://supabase.com

### 2. Neon
- **Platform**: PostgreSQL
- **Kelebihan**:
  - PostgreSQL modern dengan branching
  - Serverless, autoscaling
- **Batas Gratis**: 1GB storage, 10 connections
- **Link**: https://neon.tech

### 3. PlanetScale
- **Platform**: MySQL
- **Kelebihan**:
  - Serverless, otomatis scaling
  - Branching untuk database
- **Batas Gratis**: 10GB storage, 100GB transfer/bulan
- **Link**: https://planetscale.com

## Panduan Migrasi ke Supabase

### Langkah 1: Buat Akun dan Proyek Baru
1. Kunjungi https://supabase.com
2. Buat akun dan login
3. Klik "New Project"
4. Isi nama proyek, pilih region terdekat
5. Buat password untuk database

### Langkah 2: Dapatkan Connection String
1. Setelah proyek dibuat, salin connection string dari dashboard
2. Format: `postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?sslmode=require`

### Langkah 3: Update Environment Variables
Ganti DATABASE_URL di file `.env`:
```
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?sslmode=require"
```

### Langkah 4: Migrasi Schema
1. Install atau pastikan Prisma CLI tersedia
2. Jalankan perintah:
```bash
npx prisma db push
```

### Langkah 5: Seed Data Awal (Jika Diperlukan)
```bash
npx prisma db seed
```

## Konfigurasi Prisma untuk Supabase

File `prisma/schema.prisma` mungkin perlu sedikit modifikasi untuk kompatibilitas Supabase:

```prisma
generator client {
  provider = "prisma-client-js"
  // Tambahkan engineType untuk kompatibilitas
  engineType = "binary"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Tambahkan parameter SSL
  directUrl = env("DIRECT_DATABASE_URL")
}
```

## Backup dan Restore Data

Sebelum migrasi, pastikan untuk backup data lokal terlebih dahulu:

```bash
# Backup data lokal
pg_dump "postgresql://[LOCAL_USER]:[LOCAL_PASSWORD]@[LOCAL_HOST]:[LOCAL_PORT]/[LOCAL_DATABASE]" > backup.sql

# Restore ke Supabase (setelah migrasi schema)
psql "[SUPABASE_CONNECTION_STRING]" < backup.sql
```

## Troubleshooting

### Error SSL
Jika mengalami error SSL, pastikan connection string memiliki `sslmode=require`

### Error Connection
- Pastikan firewall Supabase mengizinkan koneksi
- Cek apakah connection string benar
- Verifikasi credentials

### Error Migration
- Pastikan tidak ada fitur PostgreSQL yang tidak didukung Supabase
- Cek dokumentasi Supabase untuk fitur yang tidak didukung