# Dokumentasi Fitur Export Produk

## Overview
Fitur export produk memungkinkan pengguna untuk mengekspor data produk ke berbagai format file (CSV, Excel, PDF) dengan dukungan preview sebelum download.

## Fitur Utama

### 1. Multi-Format Export
- Export ke CSV (Comma-Separated Values)
- Export ke Excel (.xlsx)
- Export ke PDF dengan layout profesional

### 2. Preview Sebelum Download (PDF)
- Pratinjau tampilan PDF sebelum download
- Tombol cetak langsung dari modal preview
- Tampilan yang responsif dan profesional

### 3. Struktur Data Lengkap
- Nama Produk
- Kode Produk
- Stok
- Kategori
- Supplier
- Deskripsi
- Tanggal Pembuatan/Pembaruan
- Harga Beli
- Tier Harga (harga berbeda untuk jumlah pembelian berbeda)

## Cara Kerja

### Proses Export
1. Pengguna mengklik tombol "Export" di halaman manajemen produk
2. Modal selector format muncul untuk memilih format ekspor
3. Jika memilih PDF, modal preview PDF muncul sebelum download
4. Jika memilih Excel/CSV, file langsung diunduh

### Implementasi Teknis
- Backend: API `/api/produk` untuk mengambil data produk
- Frontend: Penggunaan library `xlsx` untuk Excel dan `jspdf` + `jspdf-autotable` untuk PDF
- Caching: Gunakan fitur caching Redis untuk mengurangi beban database

## Struktur File

```
app/admin/produk/
├── page.js              # Halaman manajemen produk dengan tombol export
components/export/
├── ExportFormatSelector.js # Modal untuk memilih format export
├── PDFPreviewModal.js      # Modal untuk preview PDF dan tombol cetak
```

## Dependencies

- `xlsx` - untuk manipulasi file Excel
- `jspdf` dan `jspdf-autotable` - untuk membuat file PDF
- `lucide-react` - untuk ikon di modal

## Integrasi dengan Sistem

### Validasi Akses
- Hanya pengguna dengan role ADMIN yang dapat mengakses fitur ini
- Data diekspor hanya untuk toko tempat pengguna saat ini login

### Error Handling
- Fallback mekanisme jika Redis tidak tersedia
- Pesan error yang informatif
- Logging error untuk troubleshooting

## Best Practices Penggunaan

1. **Jumlah Data Besar**: Untuk data sangat besar, sebaiknya gunakan format CSV atau Excel untuk performa terbaik
2. **Cetak Laporan**: Gunakan format PDF untuk keperluan cetak atau dokumentasi resmi
3. **Presentasi**: Gunakan Excel untuk pengolahan data lanjutan di aplikasi spreadsheet

## Troubleshooting

### Jika Redis Tidak Tersedia
- Sistem akan otomatis fallback ke database tanpa cache
- Performa mungkin sedikit menurun untuk ekspor data besar
- Tidak mempengaruhi fungsi export

### Jika File Ekspor Tidak Muncul
- Pastikan browser tidak memblokir download
- Periksa folder download default
- Lakukan refresh halaman jika terjadi error

## Keamanan
- Semua data di-filter berdasarkan toko pengguna
- Tidak mungkin mengakses atau mengekspor data toko lain
- Validasi session dilakukan sebelum ekspor

## Kontribusi
Fitur ini dikembangkan untuk meningkatkan produktivitas pengguna dan efisiensi operasional sistem manajemen tokomajual. Kontribusi untuk perbaikan atau penambahan fitur dapat dikirimkan melalui pull request.