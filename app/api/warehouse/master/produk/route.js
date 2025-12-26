export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

// Ini adalah endpoint untuk manajemen master produk gudang
// Kita menggunakan toko dengan ID khusus untuk menyimpan master data gudang
const WAREHOUSE_STORE_ID = 'GM001'; // ID khusus untuk menyimpan master data
const WAREHOUSE_STORE_NAME = 'Master Data Gudang'; // Nama untuk store virtual

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can access this API
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Pastikan store master gudang sudah ada, jika belum maka buat
    let warehouseStore = await globalPrisma.store.findUnique({
      where: { id: WAREHOUSE_STORE_ID }
    });

    if (!warehouseStore) {
      warehouseStore = await globalPrisma.store.create({
        data: {
          id: WAREHOUSE_STORE_ID,
          name: WAREHOUSE_STORE_NAME,
          description: 'Store virtual untuk menyimpan master data gudang',
          status: 'ACTIVE'
        }
      });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const productCode = searchParams.get('productCode');
    const limit = parseInt(searchParams.get('limit')) || 20;

    // Build where clause based on search parameters
    let whereClause = {
      storeId: WAREHOUSE_STORE_ID
    };

    if (search) {
      whereClause = {
        ...whereClause,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { productCode: { contains: search, mode: 'insensitive' } }
        ]
      };
    } else if (productCode) {
      whereClause = {
        ...whereClause,
        productCode: { contains: productCode, mode: 'insensitive' }
      };
    }

    // Fetch master products with search capability
    const products = await globalPrisma.product.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            name: true,
          },
        },
        supplier: {
          select: {
            name: true,
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
      take: limit
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching master products for warehouse:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can access this API
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, productCode, categoryId, purchasePrice, supplierId, stock } = body;

    // Pastikan store master gudang sudah ada, jika belum maka buat
    let warehouseStore = await globalPrisma.store.findUnique({
      where: { id: WAREHOUSE_STORE_ID }
    });

    if (!warehouseStore) {
      warehouseStore = await globalPrisma.store.create({
        data: {
          id: WAREHOUSE_STORE_ID,
          name: WAREHOUSE_STORE_NAME,
          description: 'Store virtual untuk menyimpan master data gudang',
          status: 'ACTIVE'
        }
      });
    }

    // Validate required fields
    if (!name || !productCode || !categoryId || !purchasePrice || !supplierId) {
      return NextResponse.json({ error: 'Semua field wajib diisi: name, productCode, categoryId, purchasePrice, supplierId' }, { status: 400 });
    }

    // Check if a product with the same productCode already exists in the warehouse master store
    const existingProduct = await globalPrisma.product.findFirst({
      where: {
        productCode: productCode,
        storeId: WAREHOUSE_STORE_ID
      }
    });

    if (existingProduct) {
      return NextResponse.json({ error: 'Produk dengan kode yang sama sudah ada di master gudang' }, { status: 400 });
    }

    // Verify that category and supplier belong to the warehouse master store
    const [category, supplier] = await Promise.all([
      globalPrisma.category.findFirst({
        where: {
          id: categoryId,
          storeId: WAREHOUSE_STORE_ID
        }
      }),
      globalPrisma.supplier.findFirst({
        where: {
          id: supplierId,
          storeId: WAREHOUSE_STORE_ID
        }
      })
    ]);

    if (!category) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan di master gudang' }, { status: 400 });
    }

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier tidak ditemukan di master gudang' }, { status: 400 });
    }

    // Create the new master product in the warehouse store
    const newProduct = await globalPrisma.product.create({
      data: {
        name,
        productCode,
        categoryId,
        purchasePrice,
        supplierId,
        stock: stock || 0,
        storeId: WAREHOUSE_STORE_ID
      },
      include: {
        category: true,
        supplier: true
      }
    });

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error) {
    console.error('Error creating master product for warehouse:', error);

    // Check if this is a Prisma-specific error (like foreign key constraint)
    if (error.code === 'P2003' || error.code === 'P2025') {
      return NextResponse.json({ error: 'Kategori, supplier, atau store tidak ditemukan' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}