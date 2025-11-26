# Toko Sakinah - Aplikasi Kasir Toko Pakaian

Aplikasi kasir untuk toko pakaian Toko Sakinah, dibangun dengan Next.js 14, Prisma ORM, SQLite, dan Tailwind CSS.

## ⚙️ Teknologi yang Digunakan

- **Next.js 14** (App Router)
- **Prisma ORM** (dengan SQLite sebagai database default)
- **Tailwind CSS** (tema ungu muda pastel)
- **NextAuth.js** (untuk otentikasi role-based)
- **Zustand** (untuk state management sederhana)
- **recharts** (untuk grafik laporan)

## 🚀 Setup Development

### 1. Instalasi Dependencies

```bash
npm install
```

### 2. Konfigurasi Environment

Salin file `.env.example` ke `.env` dan sesuaikan konfigurasi:

```bash
cp .env.example .env
```

Pastikan untuk mengubah `NEXTAUTH_SECRET` dengan nilai yang aman di lingkungan produksi.

### 3. Prisma Setup

Jalankan migrasi database dan generate Prisma Client:

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Seed Database (Opsional)

Untuk membuat data awal:

```bash
npx prisma db seed
```

### 5. Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan di http://localhost:3000

## 🔐 Roles & Akses

Aplikasi memiliki 3 role pengguna:

1. **Admin**: 
   - Full akses CRUD (kategori, produk, supplier, member, kasir, pelayan)
   - Melihat laporan
   - Mengatur potongan harga
   - Ekspor CSV/PDF

2. **Kasir**:
   - Membuat transaksi
   - Memilih produk
   - Memilih member
   - Mencetak struk
   - Stok berkurang otomatis

3. **Pelayan**:
   - Melihat produk/stok/kategori
   - Membuat daftar belanja sementara
   - Tidak bisa mengubah data atau melakukan transaksi

## 💾 Migrasi ke PostgreSQL / Supabase

### 1. Update Prisma Schema

Ubah file `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Konfigurasi Environment

Di file `.env`, ganti `DATABASE_URL` dengan koneksi PostgreSQL Anda:

```env
DATABASE_URL="postgresql://username:password@host:port/database_name"
```

Jika menggunakan Supabase, URL akan seperti:

```env
DATABASE_URL="postgresql://postgres.your-project-id.supabase.co:5432/your-database-name?user=postgres&password=your-password"
```

### 3. Deployment

Setelah mengubah konfigurasi, jalankan:

```bash
npx prisma migrate dev
npx prisma generate
```

## 📊 Struktur Database

### Model Utama

- **User**: Untuk autentikasi (admin, kasir, pelayan)
- **Category**: Kategori produk
- **Product**: Produk dengan harga dan diskon
- **Supplier**: Pemasok produk
- **Member**: Member dengan level diskon
- **Sale**: Transaksi penjualan
- **SaleDetail**: Detail item dalam transaksi
- **TempCart**: Keranjang sementara untuk pelayan

### Logika Diskon

- Qty 1-3: Potongan per-item default 1000 (bisa diubah admin)
- Qty 4-6: Potongan per-item sesuai `discount4_6` di produk
- Qty >6: Gunakan `discountMore` jika diisi admin
- Diskon member: Persentase ditambahkan setelah potongan per-item

## 📁 Struktur Proyek

```
toko-sakinah/
├── app/
│   ├── (auth)/login/      # Halaman login untuk masing-masing role
│   ├── admin/            # Halaman untuk admin
│   ├── kasir/            # Halaman untuk kasir
│   ├── pelayan/          # Halaman untuk pelayan
│   ├── api/
│   │   ├── auth/         # API untuk autentikasi
│   │   ├── produk/       # API untuk produk
│   │   ├── transaksi/    # API untuk transaksi
│   │   └── laporan/      # API untuk laporan
├── components/           # Komponen UI
├── prisma/               # Schema database dan seed
├── public/               # File statis
│   └── uploads/          # Upload gambar produk
├── styles/               # File CSS global
└── utils/                # Utility functions
```

## 🔧 API Tersedia

- `GET /api/produk` - Mendapatkan daftar produk
- `POST /api/produk` - Membuat produk baru
- `POST /api/transaksi/calculate` - Menghitung total transaksi
- `GET /api/auth/check-role` - Memeriksa role pengguna

## 🎨 Warna Tema

- Utama: #C084FC (ungu muda pastel)
- Sekunder: #A78BFA

## 💻 Akun Default

Setelah seeding, akun default tersedia:

- **Admin**: username: `admin`, password: `admin123`
- **Kasir**: username: `kasir`, password: `kasir123`
- **Pelayan**: username: `pelayan`, password: `pelayan123`

## 📈 Fitur Lanjutan (Tersedia)

- Sistem log stock (stock in/out)
- Notifikasi stok rendah langsung di halaman transaksi
- Export/import CSV
- Export ke Excel (.xlsx) dan PDF dengan preview sebelum download
- Caching Redis untuk performa lebih cepat
- Undo transaksi dalam 5 menit pertama setelah transaksi selesai
- Audit log untuk admin
- Integrasi printer thermal
- Realtime via Supabase Realtime

## 🚀 Fitur-fitur Baru

- **Tombol Pembayaran Cepat**: Tombol untuk pembayaran dengan nominal umum (Rp20K, Rp50K, Rp100K, Rp200K) di halaman transaksi
- **Notifikasi Stok Rendah**: Muncul secara real-time dalam bentuk modal saat produk dengan stok kurang dari 5 buah ditambahkan ke keranjang
- **Tombol Undo Transaksi**: Memungkinkan pembatalan transaksi dalam waktu 5 menit pertama di halaman riwayat
- **Detail Diskon Lengkap**: Struk thermal menampilkan detail perhitungan diskon (diskon item, member, dan tambahan)
- **Metode Pembayaran QRIS**: Menyediakan opsi pembayaran QRIS sebagai tambahan dari CASH dan TRANSFER
- **Fitur Export Lengkap**: Ekspor data ke format Excel (.xlsx), PDF (dengan pratinjau), dan CSV dengan struktur data yang konsisten
- **Caching dengan Redis**: Meningkatkan performa sistem dengan caching data yang sering diakses