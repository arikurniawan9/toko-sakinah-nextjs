# Rencana Implementasi: Fitur Manajemen Menu Sidebar untuk Manager

## 1. Tujuan

Membuat fitur yang memungkinkan role MANAGER untuk mengelola menu sidebar di halaman admin toko, sehingga mereka dapat menyesuaikan tampilan menu sesuai kebutuhan operasional toko.

## 2. Gambaran Umum

Saat ini, menu sidebar di sistem Toko Sakinah ditentukan secara statis dalam file `components/Sidebar.js`. Setiap role (MANAGER, ADMIN, CASHIER, ATTENDANT, WAREHOUSE) memiliki menu yang telah ditentukan dan tidak dapat dimodifikasi.

Fitur ini akan memungkinkan MANAGER untuk:
- Menampilkan/menyembunyikan menu tertentu
- Mengatur urutan menu
- Mengelola hak akses menu berdasarkan role

## 3. Perubahan yang Diperlukan

### 3.1. Schema Database

Menambahkan tabel baru untuk menyimpan konfigurasi menu:

```sql
CREATE TABLE "MenuConfig" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "menuKey" TEXT NOT NULL, -- Kunci unik untuk identifikasi menu
    "title" TEXT NOT NULL,   -- Judul menu
    "href" TEXT,             -- URL/route menu
    "icon" TEXT,             -- Ikon menu (nama icon lucide-react)
    "parentId" TEXT,         -- Untuk submenu
    "order" INTEGER NOT NULL DEFAULT 0, -- Urutan tampilan
    "isVisible" BOOLEAN NOT NULL DEFAULT true, -- Apakah menu ditampilkan
    "isEnabled" BOOLEAN NOT NULL DEFAULT true, -- Apakah menu aktif
    "allowedRoles" TEXT[],   -- Array role yang dapat mengakses menu
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuConfig_pkey" PRIMARY KEY ("id")
);
```

### 3.2. API Endpoints

Menambahkan endpoint API untuk manajemen konfigurasi menu:

- `GET /api/menu-config` - Mendapatkan konfigurasi menu untuk toko tertentu
- `POST /api/menu-config` - Menyimpan konfigurasi menu baru
- `PUT /api/menu-config/[id]` - Memperbarui konfigurasi menu
- `DELETE /api/menu-config/[id]` - Menghapus konfigurasi menu

### 3.3. Komponen Frontend

#### 3.3.1. Sidebar.js

Memodifikasi komponen `Sidebar.js` untuk:
- Mengambil konfigurasi menu dari API berdasarkan role dan toko
- Menampilkan menu sesuai dengan konfigurasi yang disimpan
- Tetap menjaga fungsionalitas filtering berdasarkan role

#### 3.3.2. Halaman Pengaturan Menu

Membuat halaman baru di `/manager/menu-settings` untuk:
- Menampilkan daftar menu yang dapat dikonfigurasi
- Memberikan interface untuk mengatur visibilitas, urutan, dan hak akses menu
- Menyimpan perubahan konfigurasi ke database

## 4. Implementasi Langkah demi Langkah

### Langkah 1: Persiapan Database
- Membuat migrasi database untuk tabel `MenuConfig`
- Menjalankan migrasi ke database

### Langkah 2: Pembuatan API
- Membuat API routes untuk manajemen konfigurasi menu
- Menambahkan validasi dan proteksi akses (hanya MANAGER yang bisa mengubah)

### Langkah 3: Modifikasi Sidebar
- Mengganti menu statis dengan menu dinamis dari API
- Menjaga backward compatibility untuk role lain

### Langkah 4: Pembuatan Halaman Pengaturan
- Membuat halaman pengaturan menu di dashboard manager
- Menambahkan form untuk mengelola konfigurasi menu

### Langkah 5: Testing
- Testing fungsionalitas untuk masing-masing role
- Testing hak akses dan filtering menu
- Testing UI/UX di berbagai ukuran layar

## 5. Pertimbangan Keamanan

- Hanya role MANAGER yang dapat mengakses dan mengubah konfigurasi menu
- Validasi input untuk mencegah XSS dan injeksi SQL
- Proteksi API routes dengan middleware otentikasi dan otorisasi

## 6. Potensi Masalah dan Solusi

### 6.1. Performansi
- Potensi penurunan performansi karena pengambilan data menu dari database
- Solusi: Implementasi caching untuk konfigurasi menu

### 6.2. Kompatibilitas
- Harus memastikan bahwa perubahan tidak mempengaruhi fungsionalitas untuk role lain
- Solusi: Menerapkan fallback ke konfigurasi default jika konfigurasi kustom tidak ditemukan

### 6.3. UX
- Interface pengaturan menu harus intuitif dan mudah digunakan
- Solusi: Menggunakan drag-and-drop untuk mengatur urutan menu dan checkbox untuk mengatur visibilitas

## 7. Jadwal Pelaksanaan

- Hari 1: Persiapan database dan API
- Hari 2: Modifikasi komponen sidebar dan pembuatan halaman pengaturan
- Hari 3: Testing dan debugging
- Hari 4: Penyesuaian UI/UX dan dokumentasi

## 8. Penutup

Fitur manajemen menu sidebar akan meningkatkan fleksibilitas sistem Toko Sakinah, memungkinkan MANAGER untuk menyesuaikan antarmuka sesuai kebutuhan operasional toko mereka. Implementasi harus dilakukan dengan hati-hati untuk memastikan keamanan dan kompatibilitas dengan sistem yang sudah ada.