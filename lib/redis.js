import { createClient } from 'redis';

let redisClient;
let redisConnected = false; // Flag untuk mengetahui status koneksi Redis

export const connectRedis = async () => {
  if (!redisClient) {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
        redisConnected = false;
      });

      redisClient.on('connect', () => {
        console.log('Connected to Redis');
        redisConnected = true;
      });

      redisClient.on('ready', () => {
        console.log('Redis client is ready');
        redisConnected = true;
      });

      await redisClient.connect();
      redisConnected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      redisConnected = false;
      // Jangan lempar error, biarkan aplikasi tetap berjalan dengan fallback
    }
  }

  return redisClient;
};

export const getRedis = async () => {
  return await connectRedis();
};

// Fungsi untuk mengecek apakah Redis tersedia
export const isRedisAvailable = () => {
  return redisConnected && redisClient && redisClient.isReady;
};

// Fungsi untuk mendapatkan data dari cache
export const getFromCache = async (key) => {
  if (!isRedisAvailable()) {
    return null; // Fallback: tidak ada cache
  }

  try {
    const redis = await getRedis();
    const cachedData = await redis.get(key);
    return cachedData;
  } catch (error) {
    console.error('Error getting from cache:', error);
    return null; // Fallback: tidak ada cache
  }
};

// Fungsi untuk menyimpan data ke cache
export const setToCache = async (key, data, ttl = 600) => {
  if (!isRedisAvailable()) {
    return; // Fallback: tidak menyimpan ke cache
  }

  try {
    const redis = await getRedis();
    await redis.setEx(key, ttl, data);
  } catch (error) {
    console.error('Error setting cache:', error);
  }
};

// Fungsi untuk invalidasi cache
export const invalidateCache = async (pattern) => {
  if (!isRedisAvailable()) {
    return; // Fallback: tidak menghapus cache
  }

  try {
    const redis = await getRedis();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
};

// Fungsi untuk invalidasi cache produk
export const invalidateProductCache = async (storeId) => {
  if (!isRedisAvailable()) {
    return; // Fallback: tidak menghapus cache
  }

  try {
    const redis = await getRedis();
    // Hapus semua cache produk untuk toko tertentu
    const productKeys = await redis.keys(`products:${storeId}:*`);
    if (productKeys.length > 0) {
      await redis.del(productKeys);
    }
    // Juga hapus cache produk tanpa parameter pencarian
    await redis.del(`products:${storeId}:1:10:::::`); // Default cache key
  } catch (error) {
    console.error('Error invalidating product cache:', error);
  }
};

// Fungsi untuk invalidasi cache kategori
export const invalidateCategoryCache = async (storeId) => {
  if (!isRedisAvailable()) {
    return; // Fallback: tidak menghapus cache
  }

  try {
    const redis = await getRedis();
    // Hapus semua cache kategori untuk toko tertentu
    const categoryKeys = await redis.keys(`categories:${storeId}:*`);
    if (categoryKeys.length > 0) {
      await redis.del(categoryKeys);
    }
    // Juga hapus cache export kategori
    await redis.del(`categories:export:${storeId}:`);
  } catch (error) {
    console.error('Error invalidating category cache:', error);
  }
};

// Fungsi untuk invalidasi cache supplier
export const invalidateSupplierCache = async (storeId) => {
  if (!isRedisAvailable()) {
    return; // Fallback: tidak menghapus cache
  }

  try {
    const redis = await getRedis();
    // Hapus semua cache supplier untuk toko tertentu
    const supplierKeys = await redis.keys(`suppliers:${storeId}:*`);
    if (supplierKeys.length > 0) {
      await redis.del(supplierKeys);
    }
  } catch (error) {
    console.error('Error invalidating supplier cache:', error);
  }
};