# Workflow Aplikasi Toko Sakinah dengan Fitur Gudang Pusat dan Multi-Toko

## 1. Arsitektur Sistem Baru

### 1.1. Role dan Hak Akses

- **Manager**:

  - Akses ke semua toko
  - Membuat dan mengelola toko
  - Mengelola user untuk semua toko
  - Mengelola gudang pusat
  - Melihat laporan gabungan dari semua toko
  - Memantau distribusi produk dari gudang ke toko

- **Warehouse (Gudang)**:

  - Membuat pembelian produk ke supplier
  - Mendistribusikan produk ke toko-toko
  - Melihat stok gudang
  - Melihat riwayat distribusi

- **Admin Toko**:

  - Akses penuh ke toko masing-masing
  - CRUD produk, kategori, supplier, member (hanya untuk toko yang diakses)
  - Melihat laporan toko

- **Kasir Toko**:

  - Membuat transaksi penjualan
  - Melihat produk dan stok (hanya untuk toko yang diakses)

- **Pelayan Toko**:
  - Melihat produk dan stok (hanya untuk toko yang diakses)
  - Membuat wishlist

### 1.2. Struktur Data Multi-Tenant

- Model `Store`: Info umum toko
- Model `User`: Info user global (tanpa data toko spesifik)
- Model `StoreUser`: Relasi user dengan toko dan role di toko tersebut
- Model lainnya: Ditambahkan field `storeId` untuk isolasi data per toko

## 2. Workflow Aplikasi

### 2.1. Workflow Pembuatan Toko

1. Manager login ke sistem
2. Pilih menu "Manage Stores"
3. Klik "Create New Store"
4. Isi informasi toko (nama, deskripsi)
5. Sistem buatkan toko baru di database utama
6. (Opsional) Salin data dari toko lain atau buat kosong
7. Manager assign user ke toko baru

### 2.2. Workflow Pembelian dan Distribusi Produk

1. Warehouse login ke sistem
2. Pilih menu "New Purchase"
3. Masukkan supplier, produk, jumlah, harga beli
4. Sistem update stok gudang
5. Jika ada permintaan dari toko, Warehouse pilih "Distribute to Stores"
6. Pilih toko tujuan dan jumlah produk yang akan dikirim
7. Sistem kurangi stok gudang dan tambahkan stok di toko tujuan
8. Sistem catat riwayat distribusi

### 2.3. Workflow Distribusi dari Gudang ke Toko

1. Warehouse buka menu "Distribution"
2. Pilih produk yang akan didistribusikan
3. Pilih toko tujuan dan jumlah produk
4. Sistem buatkan laporan distribusi
5. Sistem update stok di gudang dan toko
6. Notifikasi dikirim ke Admin Toko tentang penambahan stok

### 2.4. Workflow Monitoring oleh Manager

1. Manager login ke sistem
2. Bisa pilih toko untuk melihat data toko tertentu
3. Atau pilih "Monitoring" untuk melihat ringkasan semua toko
4. Bisa lihat:
   - Jumlah produk di gudang
   - Distribusi produk ke masing-masing toko
   - Stok di masing-masing toko
   - Transaksi masing-masing toko

## 3. Model Data Baru

### 3.1. Penambahan ke Model Eksisting

- `User` model:
  - Tidak berubah (tetap global)
- Model dengan tambahan `storeId`:
  - `Category`, `Product`, `Supplier`, `Member`, `Sale`, `SaleDetail`, `TempCart`, `Purchase`, `PurchaseItem`, `Setting`, `AuditLog`, `Expense`, `ExpenseCategory`, `SuspendedSale`

### 3.2. Model Baru untuk Gudang dan Distribusi

- `Warehouse`: Informasi gudang pusat
- `WarehouseProduct`: Stok produk di gudang
- `WarehouseDistribution`: Riwayat distribusi dari gudang ke toko

## 4. Antarmuka Aplikasi

### 4.1. Login dan Akses

- Login page: Pilihan role (Manager, Warehouse, dan pilihan toko jika role terkait dengan toko)
- Setelah login, sistem redirect ke dashboard sesuai role

### 4.2. Dashboard Manager

- Summary semua toko
- Menu: Manage Stores, Monitor All, Warehouse Overview, Users Management
- Bisa pilih toko untuk melihat detail toko tersebut

### 4.3. Dashboard Warehouse

- Menu: Purchase, Distribution, Warehouse Stock, Distribution History
- Bisa pilih produk dan distribusikan ke toko tertentu

### 4.4. Dashboard Toko (Admin/Cashier/Attendant)

- Sama seperti sebelumnya, tapi hanya data dari toko yang diakses
- Admin toko bisa melihat notifikasi dari gudang tentang distribusi produk

## 5. Flow Distribusi Produk

1. Warehouse melakukan pembelian produk
2. Produk masuk ke stok gudang
3. Toko bisa request produk ke gudang atau Manager instruksikan distribusi
4. Warehouse proses distribusi ke toko
5. Sistem kurangi stok gudang dan tambah stok di toko
6. Sistem catat semua transaksi distribusi
7. Manager bisa melihat riwayat distribusi dan aliran produk

## 6. Keamanan dan Otorisasi

- Middleware akan memeriksa:

  - Apakah user memiliki akses ke toko tertentu
  - Apakah user memiliki role yang sesuai di toko
  - Manager memiliki akses ke semua toko
  - Warehouse hanya bisa distribusi, tidak bisa edit data toko lain
