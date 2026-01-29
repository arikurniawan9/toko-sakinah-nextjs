# Panduan Deployment Aman ke Vercel

## Penting: Jangan Upload Credential ke GitHub

File `.env` mengandung informasi sensitif dan TIDAK BOLEH diupload ke GitHub atau disimpan di kode sumber.

## Konfigurasi yang Harus Disimpan di Vercel (Bukan di kode)

### 1. Environment Variables di Vercel Dashboard
Setelah deploy ke Vercel, konfigurasi environment variables di:
- Project Settings > Environment Variables

Tambahkan variabel berikut:
```
DATABASE_URL=postgresql://postgres.oazyjsnhxamlamvotyll:dzikrullah99@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.oazyjsnhxamlamvotyll:dzikrullah99@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
NEXTAUTH_SECRET=kata_rahasia_yang_panjang_dan_acak
NEXTAUTH_URL=https://nama-proyek.vercel.app
```

### 2. Generate NEXTAUTH_SECRET
Untuk NEXTAUTH_SECRET, buat string acak yang panjang:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. File .gitignore
Pastikan file `.env` sudah ada di `.gitignore`:
```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## Proses Deployment ke Vercel

### 1. Siapkan Repository
- Commit semua kode kecuali file .env
- Pastikan .env tidak ikut terupload

### 2. Import ke Vercel
- Login ke dashboard.vercel.com
- Import repository GitHub Anda
- Pada step "Configure Project", tambahkan environment variables di atas

### 3. Build Settings
- Framework Preset: Next.js
- Build Command: `npm run build`
- Root Directory: (kosongkan atau `/`)

### 4. Setelah Deployment
- Tambahkan domain custom jika diperlukan
- Konfigurasi SSL certificate
- Pastikan NEXTAUTH_URL diupdate ke domain production

## Backup Plan untuk Development Lokal

File `.env.local.backup` yang telah dibuat bisa digunakan untuk kembali ke database lokal:
```
DATABASE_URL="postgresql://localhost:5432/toko_sakinah_local"
DIRECT_URL="postgresql://localhost:5432/toko_sakinah_local"
```

## Keamanan Tambahan

1. Batasi akses database di Supabase hanya ke IP yang diperlukan
2. Gunakan password yang kuat
3. Audit akses database secara berkala
4. Gunakan connection pooling dengan bijak
5. Monitor traffic database

## Troubleshooting Deployment

Jika mengalami error saat deployment:
- Pastikan semua environment variables telah diisi di Vercel
- Cek NEXTAUTH_URL sesuai dengan domain Vercel Anda
- Pastikan database Supabase dapat diakses dari server Vercel
- Cek error logs di Vercel dashboard