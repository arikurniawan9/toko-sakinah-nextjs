import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';
import { logWarehousePurchase } from '@/lib/auditLogger';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only WAREHOUSE or MANAGER roles can create warehouse purchases
    if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { supplierId, purchaseDate, items, createdBy } = body;

    // For WAREHOUSE role users, we'll use the warehouse master store
    // If user is WAREHOUSE role, they operate on the warehouse master store
    let effectiveStoreId = 'GM001';

    // If user has MANAGER role, they must have a specific store context
    if (session.user.role === ROLES.MANAGER) {
        if (!session.user.storeId) {
          console.error('MANAGER user does not have storeId:', session.user);
          return NextResponse.json({ error: 'User MANAGER harus memiliki akses ke toko tertentu. Silakan pilih toko terlebih dahulu.' }, { status: 400 });
        }
        effectiveStoreId = session.user.storeId;
    }

    if (!supplierId || !purchaseDate || !items || items.length === 0) {
      return NextResponse.json({ error: 'Data pembelian tidak lengkap' }, { status: 400 });
    }

    // Validate all items have required fields
    for (const item of items) {
      if (!item.productCode || !item.quantity || !item.purchasePrice) {
        return NextResponse.json({ error: 'Setiap item harus memiliki productCode, quantity, dan purchasePrice' }, { status: 400 });
      }
    }

    // Get the warehouse for this store (assuming there's a warehouse associated with each store)
    // Get or create the central warehouse
    let warehouse = await globalPrisma.warehouse.findFirst({
      where: { name: 'Gudang Pusat' } // Default warehouse
    });

    if (!warehouse) {
      // Create the central warehouse if it doesn't exist
      warehouse = await globalPrisma.warehouse.create({
        data: {
          name: 'Gudang Pusat',
          description: 'Gudang utama untuk semua toko',
          status: 'ACTIVE'
        }
      });
    }

    const newPurchase = await globalPrisma.$transaction(async (prisma) => {
      // Process items and handle products properly for warehouse context
      const processedItems = [];

      for (const item of items) {
        // Cek apakah produk sudah ada di toko-toko
        let existingProduct = await prisma.product.findFirst({
          where: {
            productCode: item.productCode,
          },
          include: {
            category: true,
            supplier: true
          }
        });

        let productId;
        let categoryCreated = false;
        let supplierCreated = false;

        if (existingProduct) {
          // Produk sudah ada di toko-toko, ambil id produk tersebut
          productId = existingProduct.id;
          
          // Update existing product with new purchase price and increment stock
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              purchasePrice: item.purchasePrice,
              stock: {
                increment: item.quantity
              }
            }
          });
        } else {
          // Produk belum ada di toko-toko, buat produk baru
          
          // Cek apakah kategori sudah ada atau buat baru
          let category = await prisma.category.findFirst({
            where: {
              name: item.categoryName,
              storeId: effectiveStoreId
            }
          });

          if (!category) {
            // Cek apakah kategori sudah ada di warehouse store
            category = await prisma.category.findFirst({
              where: {
                name: item.categoryName,
                storeId: 'GM001'
              }
            });
            
            if (!category) {
              // Buat kategori baru di effective store
              category = await prisma.category.create({
                data: {
                  name: item.categoryName,
                  description: item.categoryDescription || null,
                  storeId: effectiveStoreId
                }
              });
              categoryCreated = true;
            } else {
              // Duplikasi kategori ke effective store
              category = await prisma.category.create({
                data: {
                  name: category.name,
                  description: category.description,
                  storeId: effectiveStoreId
                }
              });
              categoryCreated = true;
            }
          }

          // Cek apakah supplier sudah ada atau buat baru
          let supplier = await prisma.supplier.findFirst({
            where: {
              code: item.supplierCode,
              storeId: effectiveStoreId
            }
          });

          if (!supplier) {
            // Cek apakah supplier sudah ada di warehouse store
            supplier = await prisma.supplier.findFirst({
              where: {
                code: item.supplierCode,
                storeId: 'GM001'
              }
            });
            
            if (!supplier) {
              // Buat supplier baru di effective store
              supplier = await prisma.supplier.create({
                data: {
                  code: item.supplierCode,
                  name: item.supplierName,
                  contactPerson: item.contactPerson || null,
                  address: item.address || null,
                  phone: item.phone || null,
                  email: item.email || null,
                  storeId: effectiveStoreId
                }
              });
              supplierCreated = true;
            } else {
              // Duplikasi supplier ke effective store
              supplier = await prisma.supplier.create({
                data: {
                  code: supplier.code,
                  name: supplier.name,
                  contactPerson: supplier.contactPerson,
                  address: supplier.address,
                  phone: supplier.phone,
                  email: supplier.email,
                  storeId: effectiveStoreId
                }
              });
              supplierCreated = true;
            }
          }

          // Buat produk baru di effective store
          const newProduct = await prisma.product.create({
            data: {
              name: item.productName,
              productCode: item.productCode,
              categoryId: category.id,
              supplierId: supplierId,
              stock: item.quantity,
              purchasePrice: item.purchasePrice,
              retailPrice: item.retailPrice || 0,
              silverPrice: item.silverPrice || 0,
              goldPrice: item.goldPrice || 0,
              platinumPrice: item.platinumPrice || 0,
              storeId: effectiveStoreId,
              description: item.description || null,
              image: item.image || null
            },
            include: {
              category: true,
              supplier: true
            }
          });
          
          productId = newProduct.id;
        }

        // Buat atau perbarui produk master di warehouse store
        let masterProduct = await prisma.product.findFirst({
          where: {
            productCode: item.productCode,
            storeId: 'GM001'
          }
        });

        if (!masterProduct) {
          // Ambil kategori dan supplier untuk master product
          let masterCategory = await prisma.category.findFirst({
            where: {
              name: item.categoryName,
              storeId: 'GM001'
            }
          });

          if (!masterCategory) {
            // Buat kategori di warehouse store
            masterCategory = await prisma.category.create({
              data: {
                name: item.categoryName,
                description: item.categoryDescription || null,
                storeId: 'GM001'
              }
            });
          }

          let masterSupplier = await prisma.supplier.findFirst({
            where: {
              code: item.supplierCode,
              storeId: 'GM001'
            }
          });

          if (!masterSupplier) {
            // Buat supplier di warehouse store
            masterSupplier = await prisma.supplier.create({
              data: {
                code: item.supplierCode,
                name: item.supplierName,
                contactPerson: item.contactPerson || null,
                address: item.address || null,
                phone: item.phone || null,
                email: item.email || null,
                storeId: 'GM001'
              }
            });
          }

          // Buat master product di warehouse store
          masterProduct = await prisma.product.create({
            data: {
              name: item.productName,
              productCode: item.productCode,
              categoryId: masterCategory.id,
              supplierId: masterSupplier.id,
              stock: 0, // Akan ditambahkan ke warehouse stock
              purchasePrice: item.purchasePrice,
              retailPrice: item.retailPrice || 0,
              silverPrice: item.silverPrice || 0,
              goldPrice: item.goldPrice || 0,
              platinumPrice: item.platinumPrice || 0,
              storeId: 'GM001',
              description: item.description || null,
              image: item.image || null
            }
          });
        } else {
          // Update master product jika sudah ada
          await prisma.product.update({
            where: { id: masterProduct.id },
            data: {
              purchasePrice: item.purchasePrice,
              retailPrice: item.retailPrice || masterProduct.retailPrice || 0,
              silverPrice: item.silverPrice || masterProduct.silverPrice || 0,
              goldPrice: item.goldPrice || masterProduct.goldPrice || 0,
              platinumPrice: item.platinumPrice || masterProduct.platinumPrice || 0,
              name: item.productName,
              description: item.description || masterProduct.description
            }
          });
        }

        processedItems.push({
          productId: masterProduct.id, // Gunakan ID dari master product untuk purchase
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          subtotal: item.quantity * item.purchasePrice,
          storeId: effectiveStoreId
        });
      }

      // 1. Create the Purchase record
      const purchase = await prisma.purchase.create({
        data: {
          storeId: effectiveStoreId, // Use effective store ID for the purchase record
          supplierId,
          userId: session.user.id, // User who made the purchase (WAREHOUSE or MANAGER)
          purchaseDate: new Date(purchaseDate),
          totalAmount: processedItems.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0),
          status: 'COMPLETED', // Or 'PENDING' based on workflow
          items: {
            create: processedItems.map(item => ({
              productId: item.productId, // Use master product ID
              quantity: item.quantity,
              purchasePrice: item.purchasePrice,
              subtotal: item.quantity * item.purchasePrice,
              storeId: effectiveStoreId, // Use effective store ID
            })),
          },
        },
      });

      // 2. Update warehouse stock for all products purchased
      // This adds the purchased items to the actual warehouse inventory
      for (const originalItem of items) {
        // Find the master product in warehouse store
        const masterProduct = await prisma.product.findFirst({
          where: {
            productCode: originalItem.productCode,
            storeId: 'GM001'
          }
        });

        if (masterProduct) {
          // Update or create warehouse stock using the master product ID
          await prisma.warehouseProduct.upsert({
            where: {
              productId_warehouseId: {
                productId: masterProduct.id,
                warehouseId: warehouse.id,
              },
            },
            update: {
              quantity: {
                increment: originalItem.quantity,
              },
            },
            create: {
              productId: masterProduct.id,
              warehouseId: warehouse.id,
              quantity: originalItem.quantity,
            },
          });
        }
      }

      // Log aktivitas pembelian gudang
      // Ambil IP address dan user agent dari request
      const requestHeaders = new Headers(request.headers);
      const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '127.0.0.1';
      const userAgent = requestHeaders.get('user-agent') || '';

      await logWarehousePurchase(
        session.user.id,
        {
          id: purchase.id,
          warehouseId: warehouse.id,
          supplierId,
          totalAmount: purchase.totalAmount,
          status: purchase.status,
          purchasedAt: purchase.purchaseDate,
          purchasedBy: session.user.id,
        },
        ipAddress,
        userAgent,
        'GM001' // Log ke store gudang
      );

      return purchase;
    });

    return NextResponse.json({
      success: true,
      purchase: newPurchase,
      message: 'Pembelian gudang berhasil disimpan dan stok diperbarui',
    });
  } catch (error) {
    console.error('Error creating warehouse purchase with product check:', error);

    // Provide more specific error messages
    if (error.code === 'P2003') { // Foreign key constraint error
      return NextResponse.json({ error: 'Supplier atau produk tidak ditemukan' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}