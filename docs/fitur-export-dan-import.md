# Panduan Fitur Import dan Export Produk

## Daftar Isi
- [Overview](#overview)
- [Fitur Import Produk](#fitur-import-produk)
- [Fitur Export Produk](#fitur-export-produk)
- [Format File Import](#format-file-import)
- [Format File Export](#format-file-export)

## Overview

Sistem Toko Sakinah menyediakan fitur import dan export produk untuk memudahkan pengelolaan data produk dalam skala besar. Fitur ini mendukung import dan export dalam format CSV, Excel, dan PDF.

## Fitur Import Produk

### Fungsi Utama
- Import produk dalam jumlah besar langsung ke database
- Validasi data sebelum disimpan
- Konflik handling untuk produk yang sudah ada
- Import dengan harga tier yang bervariasi
- Kustomisasi kode produk otomatis

### Proses Import
1. Pengguna mengunggah file CSV/Excel
2. Sistem membaca dan memvalidasi file
3. Jika produk dengan kode yang sama sudah ada, sistem akan menampilkan opsi konfirmasi konflik
4. Jika tidak ada konflik atau pengguna memilih untuk mengganti, produk akan disimpan ke database
5. Setelah selesai, cache produk untuk toko tersebut akan di-invalidasi

### Template Import
- `contoh-import-produk.csv` - Template dasar dengan produk bervariasi
- `template-produk-variabel.csv` - Template khusus untuk produk dengan harga bervariasi per kuantitas
- `template-produk-kategori-spesifik.csv` - Template dengan produk dari berbagai kategori bisnis

## Fitur Export Produk

### Fungsi Utama
- Export semua produk ke dalam format Excel, PDF, atau CSV
- Mendukung ekspor produk dalam format tier harga (harga berbeda untuk kuantitas berbeda)
- Penyajian data yang rapi dan profesional di format PDF
- Dukungan untuk ekspor dengan filter dan pencarian

### Format Export Tersedia

#### 1. Excel (.xlsx)
- Struktur kolom yang terorganisir dengan baik
- Mendukung format harga tier (harga berbeda per kuantitas)
- Mudah diedit dan digunakan di aplikasi spreadsheet lainnya
- Format yang paling kompatibel untuk pengolahan lanjutan

#### 2. PDF (.pdf)
- Desain profesional untuk pencetakan
- Termasuk header dan footer dengan informasi toko
- Tabel data yang rapi dan mudah dibaca
- Cocok untuk laporan dan arsip

#### 3. CSV (.csv)
- Format dasar untuk kompatibilitas universal
- Dapat digunakan untuk import ke sistem lain
- Ukuran file kecil

### Proses Export
1. Pengguna klik tombol "Export" di halaman manajemen produk
2. Sistem menampilkan modal pilihan format
3. Pengguna memilih format (Excel, PDF, atau CSV)
4. Sistem menyiapkan data dan menyajikan file untuk diunduh

## Format File Import

### Struktur Kolom
- **Nama**: Nama produk (diperlukan)
- **Kode**: Kode unik produk (harus unik dalam satu toko)
- **Stok**: Jumlah stok awal produk
- **Kategori**: Nama kategori produk
- **Supplier**: Nama supplier produk
- **Deskripsi**: Deskripsi produk
- **Tanggal Dibuat**: Tanggal pembuatan produk (akan otomatis saat import)
- **Tanggal Diubah**: Tanggal perubahan produk (akan otomatis saat import)
- **Harga Beli**: Harga pembelian produk
- **Harga Jual Min**: Jumlah kuantitas minimum untuk harga tier ini
- **Harga Jual Max**: Jumlah kuantitas maksimum untuk harga tier ini
- **Harga Jual**: Harga yang berlaku untuk tier ini

### Format Harga Tier
Jika produk memiliki harga tier bervariasi, gunakan format:
- Satu produk mungkin memerlukan beberapa baris untuk setiap tier
- Baris akan digabung berdasarkan kode produk
- Setiap tier memiliki rentang kuantitas dan harga yang berbeda

Contoh:
```
Nama,Kode,Stok,Kategori,Supplier,Deskripsi,Harga Beli,Harga Jual Min,Harga Jual Max,Harga Jual
"Kemeja Premium","KMP-001",50,"Pakaian","PT Supplier A","Kemeja premium",75000,1,5,120000
"Kemeja Premium","KMP-001",50,"Pakaian","PT Supplier A","Kemeja premium",75000,6,10,110000
"Kemeja Premium","KMP-001",50,"Pakaian","PT Supplier A","Kemeja premium",75000,11,,100000
```

## Format File Export

### Struktur
Format export mengikuti struktur yang sama dengan format import untuk kemudahan pengolahan data.

### Fitur Export
- Termasuk data produk lengkap dengan harga tier
- Tanggal format dalam Bahasa Indonesia
- Angka dalam format rupiah (format ID)
- Ketersediaan stok aktual
- Kategori dan supplier secara lengkap

## Panduan Praktis

### Cara Export Produk
1. Buka halaman Manajemen Produk
2. Klik tombol "Export" (ikon download)
3. Pilih format yang diinginkan (Excel, PDF, atau CSV)
4. Tunggu proses ekspor selesai
5. File akan otomatis terunduh

### Cara Import Produk Baru
1. Buka halaman Manajemen Produk
2. Klik tombol "Import" (ikon upload)
3. Pilih file CSV atau Excel dengan format yang benar
4. Jika ada produk dengan kode yang sudah ada, konfirmasi apakah akan ditimpa
5. Tunggu proses import selesai

## Catatan Teknis

### Penanganan Error
- Jika file tidak sesuai format, sistem akan menampilkan error spesifik
- Jika terjadi kesalahan saat proses import, operasi akan dirollback
- Kesalahan validasi akan ditampilkan dengan pesan yang jelas

### Kinerja
- Sistem mendukung ekspor produk dalam jumlah besar
- Penggunaan cache untuk mencegah beban berlebih pada database
- Proses import dilakukan dengan efisien untuk menghindari timeout