# Panduan Push ke GitHub

## Persiapan

### 1. Inisialisasi Repository Lokal
Jika belum:
```bash
git init
git add .
git commit -m "Initial commit: Toko Sakinah with Supabase integration"
```

### 2. Buat Repository di GitHub
- Buka https://github.com
- Klik tombol "New repository"
- Beri nama repository (misal: "toko-sakinah")
- Pilih "Private" atau "Public"
- Jangan centang "Initialize this repository with a README"
- Klik "Create repository"

### 3. Tambahkan Remote Repository
Ganti [NAMA_USERNAME] dan [NAMA_REPOSITORY] dengan milik Anda:
```bash
git remote add origin https://github.com/[NAMA_USERNAME]/[NAMA_REPOSITORY].git
```

## Langkah Push ke GitHub

### 1. Pastikan .gitignore Sudah Benar
File .env dan file sensitif lainnya TIDAK AKAN diupload karena sudah di-ignore:
```bash
git status
```
Harusnya tidak menampilkan file .env

### 2. Push ke GitHub
```bash
git branch -M main
git push -u origin main
```

## Verifikasi

### 1. Cek di GitHub
- Buka repository Anda di https://github.com/[NAMA_USERNAME]/[NAMA_REPOSITORY]
- Pastikan semua file kecuali .env telah diupload

### 2. Cek file sensitif tidak ikut terupload
- Pastikan file .env, .env.local, dll. tidak muncul di repository

## Jika Ada Error

### Error: refusing to merge unrelated histories
```bash
git pull origin main --allow-unrelated-histories
git merge
git push origin main
```

### Error: Permission denied
- Pastikan Anda telah mengatur credential Git
- Bisa menggunakan Personal Access Token untuk autentikasi

## Setelah Push Berhasil

### 1. Deploy ke Vercel
- Buka https://vercel.com
- Import repository GitHub Anda
- Tambahkan environment variables di dashboard Vercel

### 2. Konfigurasi Environment Variables di Vercel
Jangan lupa untuk menambahkan:
- DATABASE_URL
- DIRECT_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL

## File-file yang Aman untuk Diupload
- Semua kode sumber
- File konfigurasi (kecuali yang mengandung credential)
- File .gitignore
- File dokumentasi
- File .env.example

## File-file yang TIDAK AKAN Diupload (karena .gitignore)
- .env
- .env.local
- .env.backup
- Semua file credential