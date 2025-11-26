# Panduan Template Import Produk Terbaru

## Overview
Dokumen ini menjelaskan format dan struktur template import produk terbaru yang tersedia di sistem Toko Sakinah. Kami telah memperbarui template untuk menyediakan contoh produk yang lebih bervariasi dan realistis.

## File Template Tersedia

### 1. contoh-import-produk.csv
Template dasar dengan berbagai kategori produk umum:
- Elektronik (smartphone, laptop)
- Fashion (pakaian, sepatu)
- Makanan & Minuman
- Barang kebutuhan pokok
- Perlengkapan pribadi

### 2. template-produk-standar.csv
Template dengan produk-produk yang lebih kompleks dan bervariasi:
- Produk elektronik canggih
- Perlengkapan rumah tangga
- Aksesori fashion
- Produk kesehatan

### 3. template-produk-variabel.csv
Template khusus untuk produk dengan harga yang bervariasi berdasarkan jumlah:
- Produk dengan skema harga tier berdasarkan kuantitas
- Cocok untuk produk grosir
- Menampilkan struktur harga berjenjang

### 4. template-produk-kategori-spesifik.csv
Template dengan produk dari berbagai kategori bisnis:
- Furniture & mebel
- Elektronik & gadget
- Perlengkapan dapur
- Barang rumah tangga

## Format Kolom

Semua template mengikuti format CSV berikut:

| Kolom | Deskripsi | Contoh |
|-------|-----------|---------|
| Nama | Nama produk lengkap | Smartphone Samsung Galaxy A14 |
| Kode | Kode unik produk | SM-A14 |
| Stok | Jumlah stok awal | 50 |
| Kategori | Kategori produk | Electronics |
| Supplier | Nama supplier | PT Jaya Elektronik |
| Deskripsi | Deskripsi produk | Smartphone Android dengan kamera 50MP |
| Tanggal Dibuat | Tanggal input produk | 2025-01-15 |
| Tanggal Diubah | Tanggal terakhir diubah | 2025-01-15 |
| Harga Beli | Harga pembelian produk | 2500000 |
| Harga Jual Min | Kuantitas minimum untuk harga ini | 1 |
| Harga Jual Max | Kuantitas maksimum untuk harga ini (kosong jika unlimited) | 2 |
| Harga Jual | Harga jual untuk range kuantitas | 3200000 |

## Tips Import

1. **Kode Produk Unik**: Harap pastikan kode produk bersifat unik dalam satu toko
2. **Harga Variabel**: Gunakan kolom Harga Jual Min dan Harga Jual Max untuk membuat skema harga berjenjang
3. **Range Kuantitas**: Biarkan Harga Jual Max kosong untuk harga yang berlaku untuk jumlah tak terbatas
4. **Variasi Produk**: Gunakan template yang sesuai dengan kebutuhan Anda

## Contoh Struktur Harga Tier

```csv
Nama,Kode,Harga Jual Min,Harga Jual Max,Harga Jual
Produk A,PA-001,1,5,100000
Produk A,PA-001,6,10,95000
Produk A,PA-001,11,,90000
```

Dalam contoh di atas:
- Beli 1-5 buah: Rp 100.000 per buah
- Beli 6-10 buah: Rp 95.000 per buah
- Beli 11+ buah: Rp 90.000 per buah

## File Panduan Lainnya
- `PANDUAN_IMPORT_PRODUK.md` - Panduan umum import produk
- `README.md` - Dokumentasi sistem secara keseluruhan