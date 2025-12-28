import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES, WAREHOUSE_STORE_ID } from '@/lib/constants';
import { logProductCreation, logProductUpdate, logProductDeletion } from '@/lib/auditLogger';

// Helper to get or create the master store
async function getMasterStore() {
    // First, try to find the store using the official constant
    let masterStore = await prisma.store.findUnique({
        where: { code: WAREHOUSE_STORE_ID },
    });

    // If not found, try to find the old 'WHS-MASTER' store
    if (!masterStore) {
        masterStore = await prisma.store.findUnique({
            where: { code: 'WHS-MASTER' },
        });

        // If found, update its code to the official one for consistency
        if (masterStore) {
            masterStore = await prisma.store.update({
                where: { id: masterStore.id },
                data: { code: WAREHOUSE_STORE_ID }
            });
        }
    }

    // If still not found (neither official nor old existed), create a new one
    if (!masterStore) {
        masterStore = await prisma.store.create({
            data: {
                code: WAREHOUSE_STORE_ID,
                name: 'Gudang Master',
                description: 'Store virtual untuk menampung master produk gudang',
                status: 'SYSTEM'
            }
        });
    }
    return masterStore;
}

// GET - Get warehouse products with pagination and search
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || ![ROLES.WAREHOUSE, ROLES.MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';

    // Find the central warehouse
    const centralWarehouse = await prisma.warehouse.findFirst({
        where: { name: 'Gudang Pusat' },
    });

    if (!centralWarehouse) {
        return NextResponse.json({ error: 'Gudang Pusat tidak ditemukan.' }, { status: 500 });
    }

    // Build where clause for search on the related Product model
    let whereClause = {
      warehouseId: centralWarehouse.id
    };

    if (search) {
      whereClause.Product = {
        OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { productCode: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.warehouseProduct.count({
      where: whereClause
    });

    // Get warehouse products with pagination
    const warehouseProducts = await prisma.warehouseProduct.findMany({
      where: whereClause,
      include: { 
        Product: {
          include: {
            category: true,
            supplier: true,
          }
        } 
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { Product: { createdAt: 'desc' } }
    });

    // Transform the data to return a list of products, similar to the old structure
    const products = warehouseProducts.map(wp => ({
      ...wp.Product, // Corrected from wp.product
      stock: wp.quantity // Use the warehouse quantity as the main stock
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      products,
      pagination: {
        currentPage: page,
        totalPages,
        total: totalCount,
        startIndex: (page - 1) * limit + 1,
        endIndex: Math.min(page * limit, totalCount)
      }
    });
  } catch (error) {
    console.error('Error fetching warehouse products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update a warehouse product (upsert logic)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || ![ROLES.WAREHOUSE, ROLES.MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, productCode, categoryId, supplierId, stock, purchasePrice, retailPrice, silverPrice, goldPrice, platinumPrice, description } = body;

    if (!name || !productCode || !categoryId) {
      return NextResponse.json({ error: 'Nama, kode produk, dan kategori wajib diisi' }, { status: 400 });
    }

    const masterStore = await getMasterStore();
    if (!masterStore) {
        return NextResponse.json({ error: 'Master store could not be configured.' }, { status: 500 });
    }

    const centralWarehouse = await prisma.warehouse.findFirst({
        where: { name: 'Gudang Pusat' }
    });

    if (!centralWarehouse) {
        return NextResponse.json({ error: 'Gudang Pusat tidak ditemukan.' }, { status: 500 });
    }

    let product;
    let message;

    // Check if a product with the same productCode already exists (across all stores)
    const existingProduct = await prisma.product.findFirst({
      where: { productCode: productCode }
    });

    if (existingProduct) {
      // Product exists, so update its stock and warehouse product entry
      product = await prisma.$transaction(async (tx) => {
        // Update stock in the main Product table
        const updatedProduct = await tx.product.update({
          where: { id: existingProduct.id },
          data: {
            name: name, // Allow updating name/description even if product exists
            categoryId: categoryId,
            supplierId: supplierId || null,
            description: description || null,
            purchasePrice: purchasePrice || 0,
            retailPrice: retailPrice || 0,
            silverPrice: silverPrice || 0,
            goldPrice: goldPrice || 0,
            platinumPrice: platinumPrice || 0,
            stock: { increment: stock || 0 }, // Add to existing stock
            updatedAt: new Date()
          },
          include: { category: true, supplier: true }
        });

        // Upsert WarehouseProduct for the central warehouse
        await tx.warehouseProduct.upsert({
          where: {
            productId_warehouseId: {
              productId: updatedProduct.id,
              warehouseId: centralWarehouse.id
            }
          },
          update: {
            quantity: { increment: stock || 0 }, // Add to existing quantity
            updatedAt: new Date()
          },
          create: {
            productId: updatedProduct.id,
            warehouseId: centralWarehouse.id,
            quantity: stock || 0,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        return updatedProduct;
      });
      message = `Stok produk dengan kode ${productCode} berhasil ditambahkan.`;
    } else {
      // Product does not exist, create a new one
      product = await prisma.$transaction(async (tx) => {
        const newProduct = await tx.product.create({
          data: {
            storeId: masterStore.id, // Assign to master store when creating
            name,
            productCode,
            categoryId,
            supplierId: supplierId || null,
            stock: stock || 0,
            purchasePrice: purchasePrice || 0,
            retailPrice: retailPrice || 0,
            silverPrice: silverPrice || 0,
            goldPrice: goldPrice || 0,
            platinumPrice: platinumPrice || 0,
            description: description || null
          },
          include: { category: true, supplier: true }
        });

        // Create WarehouseProduct entry for the central warehouse
        await tx.warehouseProduct.create({
          data: {
            productId: newProduct.id,
            warehouseId: centralWarehouse.id,
            quantity: stock || 0,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        return newProduct;
      });
      message = 'Produk berhasil ditambahkan ke gudang.';
    }

    const requestHeaders = new Headers(request.headers);
    // Log either creation or update
    if (existingProduct) {
        // You might want a specific log for stock update vs. full product update
        await logProductUpdate(
            session.user.id,
            product.id,
            product,
            masterStore.id, // Or the actual product's storeId if applicable
            requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1',
            requestHeaders.get('user-agent') || ''
        );
    } else {
        await logProductCreation(
            session.user.id,
            product,
            masterStore.id,
            requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1',
            requestHeaders.get('user-agent') || ''
        );
    }

    return NextResponse.json({
      success: true,
      product: product,
      message: message
    });
  } catch (error) {
    console.error('Error processing warehouse product (upsert):', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || ![ROLES.WAREHOUSE, ROLES.MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, productCode, categoryId, supplierId, stock, purchasePrice, retailPrice, silverPrice, goldPrice, platinumPrice, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID produk wajib diisi' }, { status: 400 });
    }

    const masterStore = await getMasterStore();
    if (!masterStore) {
        return NextResponse.json({ error: 'Master store could not be configured.' }, { status: 500 });
    }

    const centralWarehouse = await prisma.warehouse.findFirst({
        where: { name: 'Gudang Pusat' }
    });

    if (!centralWarehouse) {
        return NextResponse.json({ error: 'Gudang Pusat tidak ditemukan.' }, { status: 500 });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    const product = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: id },
        data: {
          name: name,
          productCode: productCode,
          categoryId: categoryId,
          supplierId: supplierId || null,
          description: description || null,
          purchasePrice: purchasePrice || 0,
          retailPrice: retailPrice || 0,
          silverPrice: silverPrice || 0,
          goldPrice: goldPrice || 0,
          platinumPrice: platinumPrice || 0,
          updatedAt: new Date()
        },
        include: { category: true, supplier: true }
      });

      await tx.warehouseProduct.update({
        where: {
          productId_warehouseId: {
            productId: updatedProduct.id,
            warehouseId: centralWarehouse.id
          }
        },
        data: {
          quantity: stock,
          updatedAt: new Date()
        }
      });
      return updatedProduct;
    });

    const requestHeaders = new Headers(request.headers);
    await logProductUpdate(
        session.user.id,
        existingProduct,
        product,
        masterStore.id,
        requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1',
        requestHeaders.get('user-agent') || ''
    );

    return NextResponse.json({
      success: true,
      product: product,
      message: `Produk dengan kode ${productCode} berhasil diperbarui.`
    });
  } catch (error) {
    console.error('Error updating warehouse product:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

// DELETE - Delete warehouse product(s)
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || ![ROLES.WAREHOUSE, ROLES.MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids } = await request.json();
    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: 'ID produk tidak boleh kosong' }, { status: 400 });
    }

    const masterStore = await getMasterStore();
    if (!masterStore) {
        return NextResponse.json({ error: 'Master store could not be configured.' }, { status: 500 });
    }

    const productsToDelete = await prisma.product.findMany({
      where: { id: { in: ids }, storeId: masterStore.id },
      select: { id: true, name: true, productCode: true }
    });

    if (productsToDelete.length === 0) {
      return NextResponse.json({ error: 'Produk tidak ditemukan atau tidak ada yang dapat dihapus dari gudang ini' }, { status: 404 });
    }

    const deletedProductIds = productsToDelete.map(p => p.id);

    await prisma.$transaction(async (tx) => {
      // First, delete related records in other tables if they exist
      await tx.WarehouseProduct.deleteMany({ where: { productId: { in: deletedProductIds } } });
      await tx.SaleDetail.deleteMany({ where: { productId: { in: deletedProductIds } } });
      await tx.PurchaseItem.deleteMany({ where: { productId: { in: deletedProductIds } } });
      await tx.TempCart.deleteMany({ where: { productId: { in: deletedProductIds } } });
      
      // Finally, delete the products
      await tx.product.deleteMany({ where: { id: { in: deletedProductIds }, storeId: masterStore.id } });
    });

    const requestHeaders = new Headers(request.headers);
    const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
    const userAgent = requestHeaders.get('user-agent') || '';

    for (const product of productsToDelete) {
      await logProductDeletion(session.user.id, product.id, product, masterStore.id, ipAddress, userAgent);
    }

    return NextResponse.json({
      success: true,
      deletedCount: productsToDelete.length,
      message: `${productsToDelete.length} produk berhasil dihapus dari gudang`
    });
  } catch (error) {
    console.error('Error deleting warehouse product(s):', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}