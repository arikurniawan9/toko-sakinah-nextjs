# Panduan Migrasi ke Supabase - Langkah Selanjutnya

## Persiapan

Sebelum menjalankan migrasi, pastikan:
1. Anda telah membuat proyek di Supabase
2. Connection string telah disimpan dengan aman
3. Aplikasi tidak sedang berjalan

## Langkah-langkah Migrasi

### 1. Instal Dependencies
```bash
npm install
```

### 2. Jalankan Script Migrasi
```bash
node migrate_to_supabase.js
```

### 3. Atau jalankan perintah manual berikut:
```bash
# Generate Prisma Client
npx prisma generate

# Push schema ke database Supabase
npx prisma db push

# (Opsional) Jalankan seeding jika diperlukan
npx prisma db seed
```

### 4. Uji Aplikasi
```bash
npm run dev
```

## Troubleshooting

### Jika muncul error SSL
Tambahkan parameter sslmode ke connection string:
```
sslmode=require
```

### Jika muncul error connection timeout
- Pastikan firewall Supabase mengizinkan koneksi
- Cek apakah connection string benar
- Pastikan database tidak dalam status paused

### Jika schema tidak sinkron
```bash
# Pull schema dari database
npx prisma db pull

# Generate ulang client
npx prisma generate
```

## Rollback ke Database Lokal

Jika Anda perlu kembali ke database lokal:

1. Ganti DATABASE_URL di file `.env` ke konfigurasi database lokal Anda
2. Jalankan:
```bash
npx prisma generate
```

## Verifikasi Koneksi

Setelah migrasi selesai, pastikan untuk:
1. Mengecek bahwa aplikasi dapat dijalankan tanpa error
2. Menguji fitur login untuk memastikan otentikasi berfungsi
3. Menguji fitur CRUD dasar untuk memastikan koneksi database berfungsi
4. Mengecek bahwa data dapat disimpan dan diambil dengan benar