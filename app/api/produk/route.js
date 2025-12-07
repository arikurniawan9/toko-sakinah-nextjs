
// app/api/produk/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import {
  getFromCache,
  setToCache,
  invalidateProductCache
} from '@/lib/redis'; // Tambahkan import fungsi cache
import { logProductCreation, logProductUpdate, logProductDeletion } from '@/lib/auditLogger';
import {
  validateSQLInjection,
  sanitizeInput,
  validateProductFilters,
  sanitizeQueryParams
} from '@/utils/inputValidation';

// Zod Schemas for Product
const priceTierSchema = z.object({
  minQty: z.preprocess((val) => typeof val === 'string' ? parseInt(val) : val, z.number().int().positive({ message: 'Kuantitas minimum harus lebih dari 0' })),
  price: z.preprocess((val) => typeof val === 'string' ? parseInt(val) : val, z.number().int().positive({ message: 'Harga harus lebih dari 0' })),
  maxQty: z.preprocess((val) => typeof val === 'string' ? parseInt(val) : val, z.number().int().positive().optional().nullable()).optional().nullable(),
});

const productSchema = z.object({
  name: z.string().trim().min(1, { message: 'Nama produk wajib diisi' }),
  productCode: z.string().trim().min(1, { message: 'Kode produk wajib diisi' }),
  stock: z.preprocess((val) => typeof val === 'string' ? parseInt(val) : val, z.number().int().min(0, { message: 'Stok tidak boleh negatif' }).default(0)),
  purchasePrice: z.preprocess((val) => typeof val === 'string' ? parseInt(val) : val, z.number().int().min(0, { message: 'Harga beli tidak boleh negatif' }).default(0)),
  categoryId: z.string().min(1, { message: 'Kategori wajib dipilih' }),
  supplierId: z.string().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  priceTiers: z.array(priceTierSchema).min(1, { message: 'Minimal harus ada satu tingkatan harga' }).default([{ minQty: '1', maxQty: '', price: '0' }]),
});

const productUpdateSchema = productSchema.extend({
  id: z.string().min(1, { message: 'ID produk wajib disediakan' }),
});


// GET /api/produk - Get all products with pagination, search, and filtering
export async function GET(request) {
  const session = await getSession();
  // Allow both ADMIN and CASHIER roles to access products
  if (!session || !['ADMIN', 'CASHIER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);

    // Sanitasi dan validasi query parameter
    const params = sanitizeQueryParams(searchParams);

    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 10;
    const search = params.search || '';
    const category = params.category || '';
    const supplier = params.supplier || '';
    const productCode = params.productCode || '';
    const minStock = params.minStock || '';
    const maxStock = params.maxStock || '';
    const minPrice = params.minPrice || '';
    const maxPrice = params.maxPrice || '';

    // Validasi SQL injection pada parameter
    if (!validateSQLInjection(search) || !validateSQLInjection(category) ||
        !validateSQLInjection(supplier) || !validateSQLInjection(productCode)) {
      return NextResponse.json({ error: 'Parameter mengandung karakter SQL yang berbahaya' }, { status: 400 });
    }

    // Validasi parameter
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Parameter pagination tidak valid' }, { status: 400 });
    }

    // Validasi bahwa min/max value adalah angka
    if ((minStock && isNaN(parseInt(minStock))) || (maxStock && isNaN(parseInt(maxStock))) ||
        (minPrice && isNaN(parseInt(minPrice))) || (maxPrice && isNaN(parseInt(maxPrice)))) {
      return NextResponse.json({ error: 'Parameter filter harus berupa angka' }, { status: 400 });
    }

    // Buat cache key berdasarkan parameter
    const cacheKey = `products:${session.user.storeId}:${page}:${limit}:${search}:${category}:${productCode}:${supplier}:${minStock}:${maxStock}:${minPrice}:${maxPrice}`;

    // Coba ambil dari cache dulu
    const cachedData = await getFromCache(cacheKey);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    const offset = (page - 1) * limit;

    const where = {
      storeId: session.user.storeId, // Filter by store ID
      ...(productCode && { productCode: { equals: productCode } }),
      ...(category && { categoryId: category }),
      ...(supplier && { supplierId: supplier }),
      ...(minStock !== '' && { stock: { gte: parseInt(minStock) } }),
      ...(maxStock !== '' && { stock: { lte: parseInt(maxStock) } }),
      ...(minPrice !== '' && {
        priceTiers: {
          some: {
            price: { gte: parseInt(minPrice) }
          }
        }
      }),
      ...(maxPrice !== '' && {
        priceTiers: {
          some: {
            price: { lte: parseInt(maxPrice) }
          }
        }
      }),
      ...(search && !productCode && {
        AND: [
          {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { productCode: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } }
            ]
          }
        ]
      }),
    };

    // Ambil data dan hitung total dalam satu operasi
    const [products, total] = await Promise.all([
      prisma.product.findMany({
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
      }),
      prisma.product.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    const result = {
      products,
      pagination: {
        page,
        totalPages,
        totalItems: total,
        hasMore: page < totalPages,
        itemsPerPage: limit
      },
    };

    // Simpan ke cache
    await setToCache(cacheKey, JSON.stringify(result), 300); // Cache selama 5 menit

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    if (error.message.includes('karakter SQL')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal mengambil data produk' }, { status: 500 });
  }
}

// POST /api/produk - Create a new product with dynamic price tiers
export async function POST(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validasi SQL injection pada body request
    const jsonString = JSON.stringify(body);
    if (!validateSQLInjection(jsonString)) {
      return NextResponse.json({ error: 'Request body mengandung karakter SQL yang berbahaya' }, { status: 400 });
    }

    const validatedData = productSchema.parse(body);
    const { priceTiers, ...productData } = validatedData;

    // Sanitasi dan validasi tambahan
    const sanitizedProductData = {
      ...productData,
      name: sanitizeInput(productData.name),
      description: productData.description ? sanitizeInput(productData.description) : productData.description
    };

    // Gunakan storeId dari session untuk compound key
    const existingProduct = await prisma.product.findUnique({
      where: {
        productCode_storeId: {
          productCode: sanitizedProductData.productCode,
          storeId: session.user.storeId
        }
      },
    });

    if (existingProduct) {
      return NextResponse.json({ error: 'Kode produk sudah digunakan' }, { status: 409 });
    }

    // Pisahkan field categoryId dan supplierId dari productData
    const { categoryId, supplierId, ...restProductData } = sanitizedProductData;

    // Handle supplier - create default if not provided
    let finalSupplierId = supplierId;
    if (!finalSupplierId) {
      // Create or find a default supplier for "No Supplier"
      let defaultSupplier = await prisma.supplier.findFirst({
        where: {
          name: "Tidak Ada",
          storeId: session.user.storeId
        }
      });

      if (!defaultSupplier) {
        defaultSupplier = await prisma.supplier.create({
          data: {
            name: "Tidak Ada",
            code: "NO-SUP",
            store: { connect: { id: session.user.storeId } }
          }
        });
      }
      finalSupplierId = defaultSupplier.id;
    }

    const createdProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ...restProductData,
          store: { connect: { id: session.user.storeId } },
          category: { connect: { id: categoryId } },
          supplier: { connect: { id: finalSupplierId } },
        },
        include: {
          category: true,
          supplier: true,
          priceTiers: true,
        },
      });

      await tx.priceTier.createMany({
        data: priceTiers.map(tier => ({ ...tier, productId: product.id })),
      });

      return product;
    });

    // Hapus cache produk untuk toko ini karena ada perubahan data
    await invalidateProductCache(session.user.storeId);

    // Log audit untuk pembuatan produk
    const requestHeaders = new Headers(request.headers);
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
    const userAgent = requestHeaders.get('user-agent') || '';

    await logProductCreation(session.user.id, createdProduct, session.user.storeId, ipAddress, userAgent);

    return NextResponse.json(createdProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.message.includes('karakter SQL')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal membuat produk' }, { status: 500 });
  }
}

// PUT /api/produk - Update a product and its dynamic price tiers
export async function PUT(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validasi SQL injection pada body request
    const jsonString = JSON.stringify(body);
    if (!validateSQLInjection(jsonString)) {
      return NextResponse.json({ error: 'Request body mengandung karakter SQL yang berbahaya' }, { status: 400 });
    }

    const validatedData = productUpdateSchema.parse(body);
    const { id, priceTiers, ...productData } = validatedData;

    // Validasi ID produk
    if (!validateSQLInjection(id)) {
      return NextResponse.json({ error: 'ID produk mengandung karakter berbahaya' }, { status: 400 });
    }

    const duplicateProduct = await prisma.product.findFirst({
      where: {
        productCode: productData.productCode,
        storeId: session.user.storeId, // Tambahkan storeId ke kondisi pencarian
        id: { not: id },
      },
    });

    if (duplicateProduct) {
      return NextResponse.json({ error: 'Kode produk sudah digunakan' }, { status: 409 });
    }

    // Ambil data produk sebelum update untuk logging
    const existingProduct = await prisma.product.findUnique({
      where: {
        id,
        storeId: session.user.storeId // Tambahkan storeId ke kondisi pencarian
      },
      include: {
        category: true,
        supplier: true,
        priceTiers: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    // Sanitasi dan validasi tambahan
    const sanitizedProductData = {
      ...productData,
      name: sanitizeInput(productData.name),
      description: productData.description ? sanitizeInput(productData.description) : productData.description
    };

    // Pisahkan field categoryId dan supplierId dari productData
    const { categoryId, supplierId, ...restProductData } = sanitizedProductData;

    // Handle supplier for update - create default if not provided
    let finalSupplierId = supplierId;
    if (!finalSupplierId) {
      // Create or find a default supplier for "No Supplier"
      let defaultSupplier = await prisma.supplier.findFirst({
        where: {
          name: "Tidak Ada",
          storeId: session.user.storeId
        }
      });

      if (!defaultSupplier) {
        defaultSupplier = await prisma.supplier.create({
          data: {
            name: "Tidak Ada",
            code: "NO-SUP",
            store: { connect: { id: session.user.storeId } }
          }
        });
      }
      finalSupplierId = defaultSupplier.id;
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: {
          id,
          storeId: session.user.storeId // Tambahkan storeId ke kondisi update
        },
        data: {
          ...restProductData,
          store: { connect: { id: session.user.storeId } },
          category: { connect: { id: categoryId } },
          supplier: { connect: { id: finalSupplierId } },
        },
        include: {
          category: true,
          supplier: true,
          priceTiers: true,
        },
      });

      await tx.priceTier.deleteMany({ where: { productId: id } });
      await tx.priceTier.createMany({
        data: priceTiers.map(tier => ({ ...tier, productId: id })),
      });

      return product;
    });

    // Hapus cache produk untuk toko ini karena ada perubahan data
    await invalidateProductCache(session.user.storeId);

    // Log audit untuk pembaruan produk
    const requestHeaders = new Headers(request.headers);
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
    const userAgent = requestHeaders.get('user-agent') || '';

    await logProductUpdate(session.user.id, existingProduct, updatedProduct, session.user.storeId, ipAddress, userAgent);

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    if (error.message.includes('karakter SQL')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Gagal memperbarui produk' }, { status: 500 });
  }
}

// DELETE /api/produk - Delete single or multiple products
export async function DELETE(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let idsToDelete = [];

    try {
      const body = await request.json();

      // Validasi SQL injection pada body request
      const jsonString = JSON.stringify(body);
      if (!validateSQLInjection(jsonString)) {
        return NextResponse.json({ error: 'Request body mengandung karakter SQL yang berbahaya' }, { status: 400 });
      }

      if (body.ids && Array.isArray(body.ids)) {
        idsToDelete = body.ids;
      }
    } catch (e) {
      // Ignore error if body is empty
    }

    // Validasi parameter query
    const paramId = searchParams.get('id');
    if (paramId && !validateSQLInjection(paramId)) {
      return NextResponse.json({ error: 'Parameter ID mengandung karakter berbahaya' }, { status: 400 });
    }

    if (idsToDelete.length === 0) {
      if (paramId) idsToDelete = [paramId];
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json({ error: 'ID produk harus disediakan' }, { status: 400 });
    }

    // Validasi setiap ID untuk mencegah SQL injection
    for (const id of idsToDelete) {
      if (!validateSQLInjection(id)) {
        return NextResponse.json({ error: 'Salah satu ID produk mengandung karakter berbahaya' }, { status: 400 });
      }
    }

    // Pastikan produk yang akan dihapus milik toko yang sesuai
    const productsWithSales = await prisma.saleDetail.count({
      where: {
        productId: { in: idsToDelete },
        product: { storeId: session.user.storeId } // Tambahkan filter storeId
      },
    });

    if (productsWithSales > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus karena produk masih memiliki riwayat transaksi.` },
        { status: 400 }
      );
    }

    // Ambil data produk sebelum dihapus untuk logging
    const deletedProducts = await prisma.product.findMany({
      where: {
        id: { in: idsToDelete },
        storeId: session.user.storeId // Tambahkan filter storeId
      },
      include: {
        category: true,
        supplier: true,
        priceTiers: true,
      },
    });

    if (deletedProducts.length !== idsToDelete.length) {
      // Jika tidak semua produk ditemukan, berarti beberapa produk bukan milik toko ini
      return NextResponse.json({ error: 'Beberapa produk tidak ditemukan atau tidak memiliki izin untuk dihapus' }, { status: 404 });
    }

    const { count } = await prisma.product.deleteMany({
      where: {
        id: { in: idsToDelete },
        storeId: session.user.storeId // Tambahkan filter storeId
      },
    });

    if (count === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    // Hapus cache produk untuk toko ini karena ada perubahan data
    await invalidateProductCache(session.user.storeId);

    // Log audit untuk penghapusan produk
    const requestHeaders = new Headers(request.headers);
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
    const userAgent = requestHeaders.get('user-agent') || '';

    for (const product of deletedProducts) {
      await logProductDeletion(session.user.id, product, session.user.storeId, ipAddress, userAgent);
    }

    return NextResponse.json({ message: `Berhasil menghapus ${count} produk` });
  } catch (error) {
    console.error('Error deleting products:', error);
    if (error.message.includes('karakter SQL')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Gagal menghapus produk' }, { status: 500 });
  }
}
