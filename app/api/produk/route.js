
// app/api/produk/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import { logCreate, logUpdate, logDelete } from '@/lib/auditLogger';

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
  supplierId: z.string().min(1, { message: 'Supplier wajib dipilih' }).optional().nullable(),
  description: z.string().trim().optional().nullable(),
  priceTiers: z.array(priceTierSchema).min(1, { message: 'Minimal harus ada satu tingkatan harga' }),
});

const productUpdateSchema = productSchema.extend({
  id: z.string().min(1, { message: 'ID produk wajib disediakan' }),
});


// GET /api/produk - Get all products with pagination, search, and filtering
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
    const supplierId = searchParams.get('supplierId') || ''; // Add supplier ID parameter

    const offset = (page - 1) * limit;

    const where = {
      storeId: session.user.storeId, // Filter by store ID
      ...(productCode && { productCode: { equals: productCode } }),
      ...(categoryId && { categoryId }),
      ...(supplierId && { supplierId }), // Add supplier filter if provided
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
      include: {
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
    
    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
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
    const validatedData = productSchema.parse(body);
    const { priceTiers, ...productData } = validatedData;

    // Gunakan storeId dari session untuk compound key
    const existingProduct = await prisma.product.findUnique({
      where: {
        productCode_storeId: {
          productCode: productData.productCode,
          storeId: session.user.storeId
        }
      },
    });

    if (existingProduct) {
      return NextResponse.json({ error: 'Kode produk sudah digunakan' }, { status: 409 });
    }

    // Pisahkan field categoryId dan supplierId dari productData
    const { categoryId, supplierId, ...restProductData } = productData;

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

    // Log audit untuk pembuatan produk
    await logCreate(session.user.id, 'Product', createdProduct.id, createdProduct, request);

    return NextResponse.json(createdProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
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
    const validatedData = productUpdateSchema.parse(body);
    const { id, priceTiers, ...productData } = validatedData;

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

    // Pisahkan field categoryId dan supplierId dari productData
    const { categoryId, supplierId, ...restProductData } = productData;

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

    // Log audit untuk pembaruan produk
    await logUpdate(session.user.id, 'Product', updatedProduct.id, existingProduct, updatedProduct, request);

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
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
      if (body.ids && Array.isArray(body.ids)) {
        idsToDelete = body.ids;
      }
    } catch (e) {
      // Ignore error if body is empty
    }

    if (idsToDelete.length === 0) {
      const id = searchParams.get('id');
      if (id) idsToDelete = [id];
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json({ error: 'ID produk harus disediakan' }, { status: 400 });
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

    // Log audit untuk penghapusan produk
    for (const product of deletedProducts) {
      await logDelete(session.user.id, 'Product', product.id, product, request);
    }

    return NextResponse.json({ message: `Berhasil menghapus ${count} produk` });
  } catch (error) {
    console.error('Error deleting products:', error);
    return NextResponse.json({ error: 'Gagal menghapus produk' }, { status: 500 });
  }
}
