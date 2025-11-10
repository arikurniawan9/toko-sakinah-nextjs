
// app/api/produk/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

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
  supplierId: z.string().min(1, { message: 'Supplier wajib dipilih' }),
  description: z.string().trim().optional().nullable(),
  priceTiers: z.array(priceTierSchema).min(1, { message: 'Minimal harus ada satu tingkatan harga' }),
});

const productUpdateSchema = productSchema.extend({
  id: z.string().min(1, { message: 'ID produk wajib disediakan' }),
});


// GET /api/produk - Get all products with pagination, search, and filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const productCode = searchParams.get('productCode') || '';

    const offset = (page - 1) * limit;

    const where = {
      ...(productCode && { productCode: { equals: productCode } }),
      ...(categoryId && { categoryId }),
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
        category: true,
        supplier: true,
        priceTiers: { orderBy: { minQty: 'asc' } },
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

    const existingProduct = await prisma.product.findUnique({
      where: { productCode: productData.productCode },
    });
    
    if (existingProduct) {
      return NextResponse.json({ error: 'Kode produk sudah digunakan' }, { status: 409 });
    }
    
    // Pisahkan field categoryId dan supplierId dari productData
    const { categoryId, supplierId, ...restProductData } = productData;
    
    const createdProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ...restProductData,
          category: { connect: { id: categoryId } },
          supplier: { connect: { id: supplierId } },
        },
      });

      await tx.priceTier.createMany({
        data: priceTiers.map(tier => ({ ...tier, productId: product.id })),
      });

      return product;
    });
    
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
    
    const existingProduct = await prisma.product.findFirst({
      where: {
        productCode: productData.productCode,
        id: { not: id },
      },
    });
    
    if (existingProduct) {
      return NextResponse.json({ error: 'Kode produk sudah digunakan' }, { status: 409 });
    }
    
    // Pisahkan field categoryId dan supplierId dari productData
    const { categoryId, supplierId, ...restProductData } = productData;
    
    const updatedProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: {
          ...restProductData,
          category: { connect: { id: categoryId } },
          supplier: { connect: { id: supplierId } },
        },
      });

      await tx.priceTier.deleteMany({ where: { productId: id } });
      await tx.priceTier.createMany({
        data: priceTiers.map(tier => ({ ...tier, productId: id })),
      });

      return product;
    });
    
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

    const productsWithSales = await prisma.saleDetail.count({
      where: { productId: { in: idsToDelete } },
    });
    
    if (productsWithSales > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus karena produk masih memiliki riwayat transaksi.` }, 
        { status: 400 }
      );
    }
    
    const { count } = await prisma.product.deleteMany({
      where: { id: { in: idsToDelete } },
    });

    if (count === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }
    
    return NextResponse.json({ message: `Berhasil menghapus ${count} produk` });
  } catch (error) {
    console.error('Error deleting products:', error);
    return NextResponse.json({ error: 'Gagal menghapus produk' }, { status: 500 });
  }
}
