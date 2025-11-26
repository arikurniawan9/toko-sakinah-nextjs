# Panduan Setup Redis untuk Sistem Toko Sakinah

## Overview
Redis digunakan sebagai solusi caching untuk meningkatkan performa sistem aplikasi Toko Sakinah, khususnya untuk endpoint produk, kategori, dan supplier. Dokumen ini menjelaskan cara setup dan konfigurasi Redis di berbagai lingkungan.

## Instalasi Redis

### Di Lingkungan Development (Windows)

#### 1. Instalasi melalui Chocolatey (disarankan)
```bash
choco install redis-64
```

Atau jika Anda menggunakan Scoop:
```bash
scoop install redis
```

#### 2. Jalankan Redis Server
Melalui command prompt sebagai administrator:
```bash
redis-server
```

Atau untuk menjalankan sebagai service:
```bash
redis-server --service-install redis.windows.conf
redis-server --service-start
```

#### 3. Verifikasi instalasi
```bash
redis-cli ping
```
Harus mengembalikan "PONG" jika Redis berjalan dengan benar.

### Di Lingkungan Development (macOS)
```bash
# Instalasi
brew install redis

# Jalankan Redis
brew services start redis

# Verifikasi
redis-cli ping
```

### Di Lingkungan Development (Linux - Ubuntu)
```bash
# Instalasi
sudo apt update
sudo apt install redis-server

# Jalankan Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verifikasi
redis-cli ping
```

## Konfigurasi Aplikasi

### 1. Variabel Lingkungan
Tambahkan ke file `.env.local`:
```
REDIS_URL=redis://localhost:6379
# Atau jika menggunakan password:
# REDIS_URL=redis://:password@localhost:6379
# Atau jika menggunakan host dan port berbeda:
# REDIS_URL=redis://host:port
```

Pastikan file `.env.local` disertakan di `.gitignore` untuk melindungi informasi sensitif.

### 2. Konfigurasi di Kode
File `lib/redis.js`:
- Menggunakan redis client yang aman untuk komunikasi
- Memiliki fallback mechanism jika Redis tidak tersedia
- Menggunakan error handling yang robust

## Konfigurasi Production

### Rekomendasi Deployment
1. **Redis Cloud (Disarankan untuk deployment cepat)**
   - Redis Labs (sekarang part of IBM)
   - AWS ElastiCache for Redis
   - Google Cloud Memorystore for Redis
   - Azure Cache for Redis

2. **Self-hosted Redis**
   - Gunakan setup cluster untuk high availability
   - Konfigurasi persistence yang tepat
   - Backup dan monitoring yang teratur

### Konfigurasi Connection Pool
Redis client di aplikasi sudah dikonfigurasi dengan:
- Timeout yang sesuai
- Retry mechanism
- Error handling ketika koneksi gagal

## Pemanfaatan Cache

### Key Pattern
Sistem menggunakan pattern berikut untuk menamai key cache:
- Produk: `products:{storeId}:{page}:{limit}:{search?}:{categoryId?}:{productCode?}:{supplierId?}`
- Kategori: `categories:{storeId}:{page}:{limit}:{search?}`
- Supplier: `suppliers:{storeId}:{page}:{limit}:{search?}`

### TTL (Time To Live)
- Default TTL: 300 detik (5 menit)
- Untuk data yang lebih statis bisa menggunakan TTL lebih lama
- Untuk data yang sering berubah, TTL lebih pendek

### Invalidasi Cache
- Otomatis saat data produk/kategori/supplier diubah
- Menggunakan pattern wildcard untuk menghapus cache grup data
- Contoh: `products:${storeId}:*` untuk menghapus semua cache produk dalam satu toko

## Monitoring dan Troubleshooting

### Command CLI Umum
```bash
# Lihat semua keys
redis-cli keys "*"

# Lihat ukuran database
redis-cli dbsize

# Lihat info server
redis-cli info

# Lihat statistik
redis-cli info stats

# Flush semua cache (HATI-HATI!)
redis-cli flushall
```

### Monitoring di Aplikasi
Fitur logging menyertakan informasi cache hit/miss di log aplikasi. Gunakan ini untuk memantau efektivitas caching.

### Troubleshooting
1. **Cache tidak bekerja?**
   - Periksa apakah Redis server aktif
   - Pastikan REDIS_URL benar di env
   - Cek error log aplikasi

2. **Error koneksi Redis?**
   - Pastikan firewall tidak memblokir port 6379
   - Cek apakah Redis server berjalan

3. **Memory penuh?**
   - Atur TTL yang sesuai
   - Gunakan LRU eviction policy jika perlu
   - Monitor ukuran cache secara berkala

## Best Practices

### 1. Struktur Data
- Gunakan JSON.stringify untuk menyimpan objek kompleks
- Gunakan string untuk data sederhana
- Hindari menyimpan data sangat besar (>1MB) di cache

### 2. Penamaan Key
- Gunakan format konsisten: `{namespace}:{storeId}:{param1}:{param2}`
- Sertakan storeId untuk mendukung multi-tenant
- Gunakan delimiter yang jelas

### 3. Error Handling
- Sistem harus tetap berfungsi jika Redis tidak tersedia
- Gunakan try/catch untuk semua operasi Redis
- Log error dengan jelas untuk debugging

### 4. Performance
- Gunakan pipeline untuk operasi bulk
- Batasi jumlah data per key
- Gunakan compression untuk data besar jika perlu

## Scaling

### Horizontal Scaling
- Gunakan Redis Cluster untuk distribusi beban
- Pertimbangkan multi-instance jika traffic tinggi
- Gunakan CDN tambahan untuk cache statis

### Vertical Scaling
- Tingkatkan RAM server Redis untuk kapasitas lebih
- Monitor penggunaan CPU dan memory
- Gunakan SSD untuk persistence yang lebih cepat

## Security

### Authentication
- Gunakan password untuk koneksi Redis (requirepass di redis.conf)
- Gunakan VPC/private network untuk koneksi

### Network Security
- Batasi akses hanya ke IP yang dikenal
- Gunakan SSL/TLS untuk koneksi jarak jauh
- Nonaktifkan perintah berbahaya di redis.conf

## Backup dan Recovery

### Backup Data Redis
Secara default Redis menyimpan snapshot secara periodik. Untuk backup manual:
```bash
redis-cli BGSAVE
```

File RDB akan disimpan di direktori konfigurasi Redis.

### Recovery
```bash
# Matikan server Redis
# Salin file dump.rdb ke direktori Redis
# Restart server Redis
```

## Integrasi dengan Sistem

### Di Endpoint Produk
Endpoint produk sekarang menggunakan strategi berikut:
1. Cek cache Redis terlebih dahulu
2. Jika tidak ditemukan, query database
3. Simpan hasil ke cache
4. Kembalikan data kepada pengguna

### Cache Invalidation
- Saat produk ditambahkan/diedit/dihapus, cache produk untuk toko tersebut dihapus
- Dilakukan secara async untuk tidak memperlambat response

## Testing

### Unit Testing
```javascript
// Contoh unit test untuk fungsi cache
describe('Redis Cache Functions', () => {
  test('should get data from cache', async () => {
    // implementasi test
  });
  
  test('should handle Redis connection failure gracefully', async () => {
    // implementasi test
  });
});
```

### Load Testing
Gunakan tools seperti Artillery atau JMeter untuk menguji efek caching dalam beban tinggi.

## Troubleshooting Umum

1. **"ECONNREFUSED" saat startup aplikasi**
   - Pastikan server Redis berjalan
   - Periksa apakah port 6379 terbuka

2. **Cache tidak update setelah perubahan data**
   - Pastikan invalidasi cache dijalankan saat perubahan data
   - Cek log untuk error invalidasi cache

3. **Memory usage tinggi**
   - Tinjau TTL yang digunakan
   - Cek apakah ada key yang tidak pernah dihapus

Dokumen ini akan diperbarui saat ada perubahan signifikan pada konfigurasi Redis atau penambahan fitur baru yang menggunakan caching.