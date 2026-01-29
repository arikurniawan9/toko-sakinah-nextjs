# Panduan Mengatasi Masalah Koneksi ke Supabase

## Masalah yang Dialami
Saat mencoba menghubungkan ke database Supabase, muncul error:
```
Error: P1001: Can't reach database server at `db.oazyjsnhxamlamvotyll.supabase.co:5432`
```

## Solusi yang Dapat Dicoba

### 1. Verifikasi Connection String
Pastikan connection string Anda benar. Format yang benar:
```
postgresql://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?sslmode=require
```

### 2. Cek Pengaturan Firewall di Supabase
1. Buka dashboard Supabase Anda
2. Pergi ke menu "Database" > "Connection pooling" atau "Settings"
3. Cek apakah ada pengaturan IP whitelist
4. Jika ada, tambahkan IP publik Anda ke daftar yang diizinkan

### 3. Cek Pengaturan Network ACL
1. Di dashboard Supabase, pergi ke "Project Settings" > "Database"
2. Cari bagian "Allowed IPs" atau "Network Access"
3. Pastikan "Allow connections from anywhere" diaktifkan atau tambahkan IP Anda

### 4. Coba dengan Connection String yang Disediakan Supabase
1. Di dashboard Supabase, pergi ke "Project Settings" > "Database"
2. Salin connection string yang disediakan secara langsung
3. Bandingkan dengan connection string yang Anda gunakan

### 5. Cek Koneksi Jaringan
Coba ping ke host Supabase:
```bash
ping db.oazyjsnhxamlamvotyll.supabase.co
```

### 6. Cek SSL Configuration
Beberapa klien PostgreSQL memerlukan konfigurasi SSL tambahan. Pastikan connection string Anda memiliki:
```
sslmode=require
```

### 7. Alternatif: Gunakan Supabase Studio
Sebagai alternatif sementara, Anda bisa:
1. Gunakan Supabase Studio untuk membuat tabel secara manual
2. Impor data dari backup lokal jika ada
3. Kemudian coba koneksi dari aplikasi

## Langkah-langkah Selanjutnya
1. Cek pengaturan firewall di Supabase
2. Coba akses dari jaringan berbeda (misalnya hotspot pribadi)
3. Hubungi tim Supabase jika masalah terus berlanjut

## Backup Plan
Jika koneksi ke Supabase tetap tidak berhasil:
1. Anda bisa tetap menggunakan database lokal untuk development
2. File-file konfigurasi sudah siap untuk beralih kembali ke database lokal
3. Cukup ganti DATABASE_URL di file .env ke konfigurasi lokal Anda