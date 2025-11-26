# Template Impor Produk

File template produk menyediakan format standar untuk mengimpor produk ke sistem.

## Template Produk Standar

File template produk standar yang disediakan:
- `template-produk-standar.csv` - Template sederhana berisi kolom utama produk
- `template-produk-standar.xlsx` - Versi Excel dari template standar

### Struktur Kolom Standar

| Kolom | Deskripsi |
|-------|-----------|
| Kode | Kode unik produk |
| Nama | Nama produk |
| Kategori | Nama kategori produk |
| Deskripsi | Deskripsi produk |
| Harga Beli | Harga beli produk |
| Harga Jual | Harga jual produk |

Catatan:
- Kolom "Supplier" akan otomatis dikosongkan dan dapat diisi saat edit produk
- Tanggal "Dibuat" dan "Diubah" akan otomatis terisi saat proses import
- Produk akan memiliki harga jual tunggal (tanpa tier harga)

Contoh:
```
Kode,Nama,Kategori,Deskripsi,Harga Beli,Harga Jual
"KLP-001","Kemeja Lengan Panjang","Pakaian","Kemeja lengan panjang motif kotak",50000,75000
"CJ-001","Celana Jeans","Pakaian","Celana jeans model slim fit",80000,120000
"TR-001","Tas Ransel","Aksesoris","Tas ransel untuk laptop 15 inci",120000,200000
```

## Template Produk Lanjutan (Dengan Tier Harga)

File template produk lanjutan yang lebih bervariasi dan realistis:
- `template-produk.xlsx` - Template dalam format Excel (dengan tier harga)
- `template-produk.csv` - Template dalam format CSV (dengan tier harga)
- `template-produk-kategori-spesifik.csv` - Template dengan produk dari berbagai kategori bisnis
- `template-produk-variabel.csv` - Template khusus untuk produk dengan harga bervariasi per kuantitas
- `contoh-import-produk.csv` - Contoh data produk terbaru yang lebih bervariasi
- `contoh-import-produk-updated.csv` - Contoh data produk yang lebih lengkap
- `PANDUAN_TEMPLATE_TERBARU.md` - Panduan untuk template baru

## Format File yang Didukung

- CSV (.csv)
- Excel (.xlsx, .xls)

## Catatan Penting

- Kode produk harus unik dalam satu toko
- Jika produk dengan kode yang sama sudah ada, data akan diperbarui
- Kategori akan dibuat otomatis jika belum ada
- Supplier akan otomatis dikosongkan untuk template standar
- Semua produk akan terkait dengan toko yang sedang aktif
- Format tanggal akan otomatis terisi saat import
- Gunakan angka tanpa pemisah ribuan (contoh: 50000, bukan 50,000)
- Untuk template standar, hanya harga jual tunggal yang digunakan
- Template baru menyertakan produk dari berbagai kategori dan harga tier yang bervariasi

## File Dokumentasi

- `PANDUAN_IMPORT_PRODUK.md` - Panduan lengkap import produk
- `PANDUAN_TEMPLATE_TERBARU.md` - Panduan untuk template terbaru