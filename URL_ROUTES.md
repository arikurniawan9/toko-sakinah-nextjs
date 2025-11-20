# URL Routes Documentation - Sistem Multi-Tenant Toko Sakinah

## Public Routes
- `GET /login` - Halaman login sistem
- `GET /unauthorized` - Halaman akses ditolak
- `GET /select-store` - Halaman pemilihan toko setelah login
- `GET /register-manager` - Halaman pendaftaran akun MANAGER pertama (jika belum ada)

## Protected Routes (memerlukan otentikasi)

### Dashboard dan Role-based Pages
- `GET /manager` - Dashboard untuk MANAGER (mengelola semua toko, mengelola gudang, memantau distribusi ke semua toko)
- `GET /warehouse` - Dashboard untuk WAREHOUSE (fokus operasional gudang: pembelian, distribusi ke toko, melihat stok gudang)
- `GET /admin` - Dashboard untuk ADMIN (mengelola toko tertentu)
- `GET /kasir` - Dashboard untuk CASHIER (kasir toko)
- `GET /pelayan` - Dashboard untuk ATTENDANT (pelayan toko)

### Manager Routes (hanya untuk role MANAGER)
- `GET /manager/create-store` - Form pembuatan toko baru
- `GET /manager/stores/[id]` - Detail toko (belum dibuat)
- `GET /manager/edit-store/[id]` - Form edit toko (belum dibuat)
- `GET /manager/monitor-all` - Monitor semua toko, gudang, dan aliran produk (belum dibuat)

### Warehouse Routes (hanya untuk role WAREHOUSE)
- `GET /warehouse/purchase` - Pembuatan pembelian produk (belum dibuat)
- `GET /warehouse/distribution` - Distribusi produk ke toko (belum dibuat)
- `GET /warehouse/stock` - Melihat stok gudang (belum dibuat)
- `GET /warehouse/history` - Riwayat distribusi (belum dibuat)

### Admin Routes (untuk role ADMIN)
- `GET /admin/users` - Manajemen user per toko

## API Routes

### Authentication API
- `POST /api/auth/update-store` - Update session dengan toko yang dipilih

### Manager Registration API
- `GET /api/check-manager` - Cek apakah akun MANAGER sudah ada
- `POST /api/register-manager` - Buat akun MANAGER pertama

### User Management API
- `GET /api/users` - Dapatkan semua user (hanya MANAGER dan ADMIN)
- `GET /api/users/[userId]/stores` - Dapatkan toko yang bisa diakses oleh user tertentu

### Store Management API (hanya MANAGER)
- `GET /api/stores` - Dapatkan semua toko
- `POST /api/stores` - Buat toko baru
- `GET /api/stores/[storeId]/users` - Dapatkan user yang diassign ke toko tertentu
- `POST /api/stores/users` - Assign user ke toko
- `DELETE /api/stores/users/[storeUserId]` - Remove user dari toko

### Products API (dengan RBAC)
- `GET /api/products` - Dapatkan produk (tergantung role dan akses toko)
- `POST /api/products` - Buat produk baru (tergantung role dan akses toko)

## Role Access Levels

### MANAGER
- Akses: Semua toko, gudang pusat, dan fungsi sistem
- Fungsi: Mengelola toko, mengelola gudang, memantau distribusi produk ke semua toko
- Routes: `/manager`, `/api/stores`, `/api/users`, dll

### WAREHOUSE
- Akses: Fungsi gudang pusat
- Fungsi: Pembuatan pembelian, distribusi produk ke toko, melihat stok gudang, riwayat distribusi
- Routes: `/warehouse`, `/api/warehouse/*` (akan datang)

### ADMIN (per toko)
- Akses: Toko yang diassign + manajemen user toko
- Routes: `/admin`, `/admin/users`, API routes terkait toko

### CASHIER (per toko)
- Akses: Fungsi kasir di toko yang diassign
- Routes: `/kasir`, API transaksi

### ATTENDANT (per toko)
- Akses: Fungsi pelayan di toko yang diassign
- Routes: `/pelayan`, API terkait

## Middleware Protection

File `middleware-multi-tenant.js` menangani:
- Otentikasi pengguna
- Validasi role
- Validasi akses ke toko
- Redirect otomatis berdasarkan role