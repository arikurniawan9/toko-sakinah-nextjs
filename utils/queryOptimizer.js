// utils/queryOptimizer.js
import prisma from '@/lib/prisma';
import { 
  getFromCache, 
  setToCache, 
  invalidateCache,
  invalidateProductCache,
  invalidateCategoryCache,
  invalidateSupplierCache
} from '@/lib/redis';

// Fungsi untuk membuat cache key yang konsisten
export const generateCacheKey = (entity, storeId, params = {}) => {
  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
  
  return `${entity}:${storeId}:${paramString}`;
};

// Fungsi untuk optimasi query produk dengan caching
export const getCachedProducts = async (storeId, params = {}) => {
  const cacheKey = generateCacheKey('products', storeId, params);
  
  // Cek cache terlebih dahulu
  const cachedResult = await getFromCache(cacheKey);
  if (cachedResult) {
    try {
      return JSON.parse(cachedResult);
    } catch (error) {
      console.error('Error parsing cached products:', error);
    }
  }

  // Jika tidak ada di cache, eksekusi query
  const where = {
    storeId,
    ...(params.productCode && { productCode: params.productCode }),
    ...(params.categoryId && { categoryId: params.categoryId }),
    ...(params.supplierId && { supplierId: params.supplierId }),
    ...(params.minStock !== undefined && params.minStock !== '' && { stock: { gte: parseInt(params.minStock) } }),
    ...(params.maxStock !== undefined && params.maxStock !== '' && { stock: { lte: parseInt(params.maxStock) } }),
    ...(params.minPrice !== undefined && params.minPrice !== '' && {
      priceTiers: {
        some: {
          price: { gte: parseInt(params.minPrice) }
        }
      }
    }),
    ...(params.maxPrice !== undefined && params.maxPrice !== '' && {
      priceTiers: {
        some: {
          price: { lte: parseInt(params.maxPrice) }
        }
      }
    }),
    ...(params.search && !params.productCode && {
      OR: [
        { name: { contains: params.search, mode: 'insensitive' } },
        { productCode: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } }
      ]
    }),
  };

  const skip = (params.page - 1) * params.limit || 0;
  const take = params.limit || 10;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      include: {
        category: {
          select: { id: true, name: true }
        },
        supplier: {
          select: { id: true, name: true }
        },
        priceTiers: {
          orderBy: { minQty: 'asc' },
          select: { id: true, productId: true, minQty: true, maxQty: true, price: true }
        },
      },
      orderBy: { [params.sortBy || 'createdAt']: params.sortOrder || 'desc' },
    }),
    prisma.product.count({ where })
  ]);

  const result = {
    products,
    pagination: {
      page: params.page,
      totalPages: Math.ceil(total / take),
      totalItems: total,
      itemsPerPage: take
    }
  };

  // Simpan ke cache
  await setToCache(cacheKey, JSON.stringify(result), 300); // 5 menit

  return result;
};

// Fungsi untuk optimasi query kategori dengan caching
export const getCachedCategories = async (storeId, params = {}) => {
  const cacheKey = generateCacheKey('categories', storeId, params);
  
  const cachedResult = await getFromCache(cacheKey);
  if (cachedResult) {
    try {
      return JSON.parse(cachedResult);
    } catch (error) {
      console.error('Error parsing cached categories:', error);
    }
  }

  const where = {
    storeId,
    ...(params.search && {
      name: { contains: params.search, mode: 'insensitive' }
    })
  };

  const skip = (params.page - 1) * params.limit || 0;
  const take = params.limit || 10;

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take,
      orderBy: { [params.sortBy || 'createdAt']: params.sortOrder || 'desc' },
    }),
    prisma.category.count({ where })
  ]);

  const result = {
    categories,
    pagination: {
      page: params.page,
      totalPages: Math.ceil(total / take),
      totalItems: total,
      itemsPerPage: take
    }
  };

  await setToCache(cacheKey, JSON.stringify(result), 900); // 15 menit

  return result;
};

// Fungsi untuk optimasi query supplier dengan caching
export const getCachedSuppliers = async (storeId, params = {}) => {
  const cacheKey = generateCacheKey('suppliers', storeId, params);
  
  const cachedResult = await getFromCache(cacheKey);
  if (cachedResult) {
    try {
      return JSON.parse(cachedResult);
    } catch (error) {
      console.error('Error parsing cached suppliers:', error);
    }
  }

  const where = {
    storeId,
    ...(params.search && {
      OR: [
        { name: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
      ]
    })
  };

  const skip = (params.page - 1) * params.limit || 0;
  const take = params.limit || 10;

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      skip,
      take,
      orderBy: { [params.sortBy || 'createdAt']: params.sortOrder || 'desc' },
    }),
    prisma.supplier.count({ where })
  ]);

  const result = {
    suppliers,
    pagination: {
      page: params.page,
      totalPages: Math.ceil(total / take),
      totalItems: total,
      itemsPerPage: take
    }
  };

  await setToCache(cacheKey, JSON.stringify(result), 900); // 15 menit

  return result;
};

// Fungsi untuk optimasi query produk tunggal dengan caching
export const getCachedProduct = async (productId) => {
  const cacheKey = `product:${productId}`;
  
  const cachedResult = await getFromCache(cacheKey);
  if (cachedResult) {
    try {
      return JSON.parse(cachedResult);
    } catch (error) {
      console.error('Error parsing cached product:', error);
    }
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: {
        select: { id: true, name: true }
      },
      supplier: {
        select: { id: true, name: true }
      },
      priceTiers: {
        orderBy: { minQty: 'asc' },
        select: { id: true, productId: true, minQty: true, maxQty: true, price: true }
      },
    }
  });

  if (product) {
    await setToCache(cacheKey, JSON.stringify(product), 1800); // 30 menit
  }

  return product;
};

// Fungsi untuk optimasi query produk berdasarkan kode produk
export const getProductByCode = async (productCode, storeId) => {
  const cacheKey = `product:code:${productCode}:${storeId}`;
  
  const cachedResult = await getFromCache(cacheKey);
  if (cachedResult) {
    try {
      return JSON.parse(cachedResult);
    } catch (error) {
      console.error('Error parsing cached product by code:', error);
    }
  }

  const product = await prisma.product.findUnique({
    where: {
      productCode_storeId: {
        productCode,
        storeId
      }
    },
    include: {
      category: {
        select: { id: true, name: true }
      },
      supplier: {
        select: { id: true, name: true }
      },
      priceTiers: {
        orderBy: { minQty: 'asc' },
        select: { id: true, productId: true, minQty: true, maxQty: true, price: true }
      },
    }
  });

  if (product) {
    await setToCache(cacheKey, JSON.stringify(product), 1800); // 30 menit
  }

  return product;
};

// Fungsi untuk menghapus cache produk tertentu
export const clearProductCache = async (productId) => {
  await invalidateCache(`product:${productId}`);
  await invalidateCache(`product:code:*:*`);
};

// Fungsi untuk optimasi query yang sering digunakan
export const getCachedData = async (entity, storeId, id = null) => {
  const cacheKey = id ? `${entity}:${id}` : `${entity}:all:${storeId}`;
  
  const cachedResult = await getFromCache(cacheKey);
  if (cachedResult) {
    try {
      return JSON.parse(cachedResult);
    } catch (error) {
      console.error(`Error parsing cached ${entity}:`, error);
    }
  }

  let result;
  
  switch (entity) {
    case 'categories':
      result = await prisma.category.findMany({
        where: { storeId },
        orderBy: { name: 'asc' }
      });
      break;
    case 'suppliers':
      result = await prisma.supplier.findMany({
        where: { storeId },
        orderBy: { name: 'asc' }
      });
      break;
    case 'members':
      result = await prisma.member.findMany({
        where: { storeId },
        orderBy: { name: 'asc' }
      });
      break;
    default:
      return null;
  }

  // Cache untuk 1 jam untuk data referensi
  await setToCache(cacheKey, JSON.stringify(result), 3600);

  return result;
};