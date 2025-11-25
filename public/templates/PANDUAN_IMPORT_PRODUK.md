# Panduan Import Produk dari Excel/CSV

## Template Produk Standar

File template produk standar yang disediakan:
- `template-produk-standar.csv` - Template sederhana berisi kolom utama produk

### Format Kolom Standar

| Kolom | Deskripsi | Contoh | Wajib |
|-------|-----------|--------|-------|
| Kode | Kode unik produk | "KLP-001" | Ya |
| Nama | Nama produk | "Kemeja Lengan Panjang" | Ya |
| Kategori | Nama kategori produk | "Pakaian" | Ya |
| Deskripsi | Deskripsi produk | "Kemeja lengan panjang motif kotak" | Tidak |
| Harga Beli | Harga pembelian produk | 50000 | Tidak |
| Harga Jual | Harga jual produk | 75000 | Tidak |

### Catatan Penting (Template Standar)

1. **Harga Jual** akan digunakan sebagai harga jual tunggal untuk produk
2. **Supplier** akan otomatis dikosongkan dan dapat diisi saat edit produk
3. **Tanggal Dibuat** dan **Tanggal Diubah** akan otomatis terisi saat proses import
4. **Stok** akan otomatis diisi dengan nilai 0 jika tidak disertakan
5. **Jika kategori belum ada**, sistem akan membuatnya otomatis

### Contoh Format Standar

```
Kode,Nama,Kategori,Deskripsi,Harga Beli,Harga Jual
"KLP-001","Kemeja Lengan Panjang","Pakaian","Kemeja lengan panjang motif kotak",50000,75000
"CJ-001","Celana Jeans","Pakaian","Celana jeans model slim fit",80000,120000
"TR-001","Tas Ransel","Aksesoris","Tas ransel untuk laptop 15 inci",120000,200000
```

## Template Produk Lanjutan (Dengan Tier Harga)

File template produk lanjutan yang tersedia:
- `template-produk.csv` - Template dalam format CSV (dengan tier harga)
- `template-produk.xlsx` - Template dalam format Excel (dengan tier harga)
- `contoh-import-produk-updated.csv` - Contoh lengkap dengan berbagai produk dan tier harga

### Format Kolom Lanjutan

| Kolom | Deskripsi | Contoh | Wajib |
|-------|-----------|--------|-------|
| Nama | Nama produk | "Kemeja Lengan Panjang" | Ya |
| Kode | Kode unik produk | "KLP-001" | Ya |
| Stok | Jumlah stok awal | 100 | Tidak |
| Kategori | Nama kategori produk | "Pakaian" | Tidak |
| Supplier | Nama supplier produk | "Supplier A" | Tidak |
| Deskripsi | Deskripsi produk | "Kemeja lengan panjang motif kotak" | Tidak |
| Tanggal Dibuat | Tanggal produk dibuat (format: YYYY-MM-DD) | "2025-01-01" | Tidak |
| Tanggal Diubah | Tanggal produk terakhir diubah (format: YYYY-MM-DD) | "2025-01-01" | Tidak |
| Harga Beli | Harga pembelian produk | 50000 | Tidak |
| Harga Jual Min | Jumlah minimal pembelian untuk tier harga ini | 1 | Tidak |
| Harga Jual Max | Jumlah maksimal pembelian untuk tier harga ini (kosongkan untuk tier terakhir) | 10 | Tidak |
| Harga Jual | Harga jual untuk tier ini | 75000 | Tidak |

### Catatan Penting (Template Lanjutan)

1. **Satu produk bisa memiliki beberapa baris** jika memiliki tingkatan harga (price tiers)
2. **Untuk produk tanpa tier harga**, cukup isi satu baris dan kosongkan kolom "Harga Jual Min" dan "Harga Jual"
3. **Untuk tier harga terakhir**, kosongkan kolom "Harga Jual Max"
4. **Jika kategori atau supplier belum ada**, sistem akan membuatnya otomatis
5. **Jika produk dengan kode yang sama sudah ada**, sistem akan meng-update produk tersebut
6. **Semua produk akan otomatis terkait dengan toko yang sedang aktif** (berdasarkan session user)

### Contoh Struktur Produk dengan Tier Harga

Produk "KLP-001" (Kemeja Lengan Panjang) memiliki 3 tier harga:
- Tier 1: Beli 1-10 pcs, harga Rp 75.000
- Tier 2: Beli 11-20 pcs, harga Rp 70.000
- Tier 3: Beli 21+ pcs, harga Rp 65.000

## Format Tanggal

Gunakan format ISO (YYYY-MM-DD), contoh:
- "2025-01-01" (benar)
- Hindari format seperti "01/01/2025" (mungkin tidak dikenali)

## Format Angka

- Gunakan angka tanpa pemisah ribuan (contoh: 50000, bukan 50,000 atau 50.000)
- Untuk kolom "Harga Jual Max", kosongkan jika tidak ingin menentukan batas maksimal