# Setup Redis untuk Caching di Toko Sakinah

## Instalasi Redis

### Di Lokal (Development)

1. **Instalasi Redis**:
   - Windows: Gunakan Chocolatey `choco install redis`
   - Mac: Gunakan Homebrew `brew install redis`
   - Linux: `sudo apt-get install redis-server`

2. **Jalankan Redis**:
   - Secara manual: `redis-server`
   - Atau gunakan service manager sistem Anda

3. **Verifikasi instalasi**:
   ```bash
   redis-cli ping
   ```
   Harus mengembalikan `PONG`

### Di Produksi

1. **Pilihan Hosting**:
   - Redis lokal di server aplikasi
   - Redis Cloud (Redis Labs, AWS ElastiCache, Google Cloud Memorystore)
   - Docker container

2. **Konfigurasi Aman**:
   - Gunakan otentikasi dengan `requirepass` di redis.conf
   - Nonaktifkan perintah berbahaya
   - Batasi akses jaringan

## Konfigurasi Aplikasi

### Variabel Lingkungan

Tambahkan ke file `.env.local`:

```env
REDIS_URL=redis://localhost:6379
# Atau untuk produksi:
# REDIS_URL=redis://:password@host:port
```

### Pola Caching

Sistem ini menerapkan caching untuk endpoint berikut:

1. **Produk** (`/api/produk`):
   - Key pattern: `products:storeId:page:limit:search:categoryId:productCode:supplierId`
   - TTL: 5 menit
   - Invalidasi: Saat produk dibuat/diperbarui/dihapus

2. **Kategori** (`/api/kategori`):
   - Key pattern: `categories:storeId:page:limit:search` atau `categories:export:storeId:search`
   - TTL: 10 menit
   - Invalidasi: Saat kategori dibuat/diperbarui/dihapus

3. **Supplier** (`/api/supplier`):
   - Key pattern: `suppliers:storeId:page:limit:search`
   - TTL: 10 menit
   - Invalidasi: Saat supplier dibuat/diperbarui/dihapus

## Arsitektur Caching

### Struktur File

```
lib/
├── redis.js          # Konfigurasi dan utilitas Redis
api/
├── produk/route.js   # Implementasi caching endpoint produk
├── kategori/route.js # Implementasi caching endpoint kategori
└── supplier/route.js # Implementasi caching endpoint supplier
```

### Fungsi Utama

1. **Caching Data**:
   - Mengurangi beban database
   - Mempercepat waktu respons API
   - Mengurangi jumlah query ke database

2. **Invalidasi Cache**:
   - Otomatis saat data diubah
   - Berbasis toko (multi-tenant)
   - Mencegah data tidak konsisten

### Implementasi Pagination

- Pagination dilakukan di sisi server
- Menggunakan parameter `page` dan `limit`
- Menyediakan metadata paginasi lengkap
- Menggabungkan pengambilan data dan hitung total dalam satu operasi

### Implementasi Optimasi Query Prisma

- Menggunakan `select` untuk mengambil field spesifik
- Menghindari N+1 query problem
- Menggunakan `_count` untuk menghitung jumlah tanpa mengambil item sebenarnya
- Eager loading efisien untuk relasi

## Best Practices

### Untuk Developer

1. **Validasi Parameter**:
   - Selalu validasi parameter pagination
   - Batasi jumlah data per permintaan (maksimal 100)

2. **Pola Penamaan Key**:
   - Gunakan format konsisten: `{entity}:{storeId}:{params}`
   - Termasuk parameter yang mempengaruhi hasil

3. **TTL Cache**:
   - Gunakan TTL sesuai kebutuhan data
   - Data yang sering berubah: TTL pendek
   - Data statis: TTL lebih panjang

4. **Fallback**:
   - Sistem tetap berfungsi jika Redis tidak tersedia
   - Logging error cache untuk debugging

## Monitoring dan Troubleshooting

### Perintah Redis Umum

```bash
# Lihat semua key
redis-cli keys "*"

# Lihat ukuran database
redis-cli dbsize

# Lihat info server
redis-cli info

# Flush semua cache (dengan hati-hati!)
redis-cli flushall
```

### Pengujian

1. **Cek Cache Bekerja**:
   - Lakukan permintaan pertama (cek log database)
   - Lakukan permintaan kedua (cek log cache hit)

2. **Cek Invalidasi**:
   - Ubah data
   - Pastikan permintaan berikutnya mengambil dari database

### Error Handling

- Sistem memiliki fallback jika Redis tidak tersedia
- Error cache hanya di-log, tidak menggagalkan operasi utama
- Monitoring error untuk mendeteksi masalah Redis