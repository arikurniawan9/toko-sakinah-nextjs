# Rekomendasi Optimalisasi Performa Aplikasi Toko Sakinah

Dokumen ini berisi rekomendasi dan implementasi untuk meningkatkan performa sistem admin Toko Sakinah, dengan fokus pada tiga aspek utama: caching, optimalisasi query, dan pagination efisien.

## 1. Implementasi Caching dengan Redis

### Tujuan
Mengurangi beban database dan meningkatkan kecepatan akses data yang sering digunakan seperti kategori, produk populer, dan informasi toko.

### Implementasi

#### A. Instalasi dan Konfigurasi Redis
```bash
npm install redis
```

#### B. Membuat Redis Client
File: `lib/redis.js`
```javascript
import { createClient } from 'redis';

let redisClient;

export const connectRedis = async () => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
  }

  return redisClient;
};

export const getRedis = async () => {
  return await connectRedis();
};
```

#### C. Implementasi Caching di API Routes
Contoh implementasi caching untuk endpoint produk:

```javascript
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getRedis } from '@/lib/redis';

export async function GET(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const productCode = searchParams.get('productCode') || '';
    const supplierId = searchParams.get('supplierId') || '';

    // Buat cache key berdasarkan parameter
    const cacheKey = `products:${session.user.storeId}:${page}:${limit}:${search}:${categoryId}:${productCode}:${supplierId}`;

    try {
      // Coba ambil dari cache dulu
      const redis = await getRedis();
      const cachedData = await redis.get(cacheKey);
      
      if (cachedData) {
        return NextResponse.json(JSON.parse(cachedData));
      }
    } catch (cacheError) {
      console.warn('Redis cache error:', cacheError);
    }

    const offset = (page - 1) * limit;

    const where = {
      storeId: session.user.storeId,
      ...(productCode && { productCode: { equals: productCode } }),
      ...(categoryId && { categoryId }),
      ...(supplierId && { supplierId }),
      ...(search && !productCode && {
        OR: [
          { name: { contains: search } },
          { productCode: { contains: search } },
        ],
      }),
    };

    const products = await prisma.product.findMany({
      where,
      skip: offset,
      take: limit,
      select: {
        id: true,
        name: true,
        productCode: true,
        stock: true,
        description: true,
        purchasePrice: true,
        createdAt: true,
        updatedAt: true,
        categoryId: true,
        supplierId: true,
        category: {
          select: {
            id: true,
            name: true
          }
        },
        supplier: {
          select: {
            id: true,
            name: true
          }
        },
        priceTiers: {
          orderBy: { minQty: 'asc' },
          select: {
            id: true,
            productId: true,
            minQty: true,
            maxQty: true,
            price: true
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalCount = await prisma.product.count({ where });

    const result = {
      products,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // Simpan ke cache
    try {
      const redis = await getRedis();
      await redis.setEx(cacheKey, 300, JSON.stringify(result)); // Cache selama 5 menit
    } catch (cacheError) {
      console.warn('Redis set error:', cacheError);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Gagal mengambil data produk' }, { status: 500 });
  }
}
```

#### D. Strategi Caching
- Cache data kategori, produk, dan supplier karena sering diakses
- Gunakan TTL (Time To Live) yang sesuai dengan kebutuhan data (5-10 menit untuk data dinamis)
- Invalidasi cache secara otomatis saat data diubah

## 2. Optimalisasi Query Prisma

### Tujuan
Mengurangi beban database dan menghindari N+1 problem.

### Implementasi

#### A. Menggunakan `select` untuk Mengambil Field Spesifik
Daripada mengambil semua field dengan `include`, gunakan `select` hanya untuk field yang diperlukan:

```javascript
// Sebelum (inefisien)
const products = await prisma.product.findMany({
  where,
  include: {
    category: true,
    supplier: true,
    priceTiers: true,
  },
});

// Sesudah (efisien)
const products = await prisma.product.findMany({
  where,
  select: {
    id: true,
    name: true,
    productCode: true,
    stock: true,
    purchasePrice: true,
    categoryId: true,
    supplierId: true,
    description: true,
    createdAt: true,
    updatedAt: true,
    category: {
      select: {
        id: true,
        name: true
      }
    },
    supplier: {
      select: {
        id: true,
        name: true
      }
    },
    priceTiers: {
      orderBy: { minQty: 'asc' },
      select: {
        id: true,
        minQty: true,
        maxQty: true,
        price: true
      }
    },
  },
});
```

#### B. Menghindari N+1 Problem
Gunakan `_count` untuk menghitung jumlah tanpa mendapatkan item sebenarnya:

```javascript
const products = await prisma.product.findMany({
  where: {
    storeId: session.user.storeId
  },
  select: {
    id: true,
    name: true,
    productCode: true,
    stock: true,
    purchasePrice: true,
    priceTiers: {
      orderBy: { minQty: 'asc' },
      select: {
        price: true,
        minQty: true
      }
    },
    _count: {
      select: {
        saleDetails: true  // Jumlah penjualan tanpa mengambil detail
      }
    }
  },
});
```

## 3. Implementasi Pagination Efisien

### Tujuan
Mencegah beban berlebih pada browser dan database saat menangani data besar.

### Implementasi

#### A. Server-Side Pagination
Endpoint produk dengan pagination efisien:

```javascript
export async function GET(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    
    // Validasi parameter
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Parameter pagination tidak valid' }, { status: 400 });
    }

    const skip = (page - 1) * limit;
    const where = {
      storeId: session.user.storeId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { productCode: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Ambil data dan hitung total dalam satu operasi
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          productCode: true,
          stock: true,
          purchasePrice: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: { name: true }
          },
          supplier: {
            select: { name: true }
          },
          priceTiers: {
            orderBy: { minQty: 'asc' },
            take: 1, // Ambil hanya harga terendah untuk display
            select: { price: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      products,
      pagination: {
        page,
        totalPages,
        totalItems: total,
        hasMore: page < totalPages,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching products with pagination:', error);
    return NextResponse.json({ error: 'Gagal mengambil data produk' }, { status: 500 });
  }
}
```

#### B. Implementasi di Client-Side
Gunakan teknik lazy loading untuk memuat data saat scroll atau tombol "Load More" ditekan, bukan mengambil semua data sekaligus.

## Keuntungan dari Implementasi Ini

1. **Peningkatan Performa**: Mengurangi response time API dan waktu loading halaman
2. **Efisiensi Database**: Mengurangi beban pada database
3. **Penghematan Bandwidth**: Hanya mengirim data yang benar-benar dibutuhkan
4. **Pengalaman Pengguna yang Lebih Baik**: Halaman tidak lambat saat data besar ditampilkan
5. **Skalabilitas**: Sistem lebih siap untuk menangani pertumbuhan data di masa depan

## Catatan Penting

1. Pastikan Redis server tersedia di lingkungan produksi
2. Monitor penggunaan memory untuk cache
3. Lakukan pengujian performa sebelum dan sesudah implementasi
4. Sesuaikan TTL cache berdasarkan frekuensi perubahan data
5. Pertimbangkan fallback mechanism jika Redis tidak tersedia