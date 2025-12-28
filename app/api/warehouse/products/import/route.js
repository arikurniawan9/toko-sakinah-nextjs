import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { ROLES, WAREHOUSE_STORE_ID } from '@/lib/constants';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

// Helper to get or create the master store
async function getMasterStore() {
    // First, try to find the store using the official constant
    let masterStore = await globalPrisma.store.findUnique({
        where: { code: WAREHOUSE_STORE_ID },
    });

    // If not found, try to find the old 'WHS-MASTER' store
    if (!masterStore) {
        masterStore = await globalPrisma.store.findUnique({
            where: { code: 'WHS-MASTER' },
        });

        // If found, update its code to the official one for consistency
        if (masterStore) {
            masterStore = await globalPrisma.store.update({
                where: { id: masterStore.id },
                data: { code: WAREHOUSE_STORE_ID }
            });
        }
    }

    // If still not found (neither official nor old existed), create a new one
    if (!masterStore) {
        masterStore = await globalPrisma.store.create({
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

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const force = formData.get('force') === 'true'; // Parameter untuk menentukan apakah akan menimpa produk yang sudah ada

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    let records = [];
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'csv') {
      // Parse CSV file
      const csvString = new TextDecoder().decode(buffer);
      records = parse(csvString, { columns: true, skip_empty_lines: true });
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
      // Parse Excel file
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      records = XLSX.utils.sheet_to_json(sheet);
    } else {
      return NextResponse.json({ error: 'Format file tidak didukung. Gunakan CSV, XLSX, atau XLS' }, { status: 400 });
    }

    if (!records || records.length === 0) {
      return NextResponse.json({ error: 'File kosong atau tidak valid' }, { status: 400 });
    }

    // Get or create the central warehouse
    let centralWarehouse = await globalPrisma.warehouse.findFirst({
      where: { name: 'Gudang Pusat' }
    });

    if (!centralWarehouse) {
      centralWarehouse = await globalPrisma.warehouse.create({
        data: {
          name: 'Gudang Pusat',
          description: 'Gudang pusat untuk distribusi ke toko-toko',
          status: 'ACTIVE'
        }
      });
    }

    const masterStore = await getMasterStore();
    if (!masterStore) {
        return NextResponse.json({ error: 'Master store could not be configured.' }, { status: 500 });
    }
    const masterStoreId = masterStore.id;

    // Group records by product to handle import
    const groupedRecords = {};
    for (const record of records) {
      // Handle different possible column names for product code
      const productKey = record['Kode Produk'] || record['productCode'] || record['kode_produk'] || record['Kode'] || record['code'];

      if (!productKey) {
        console.warn('Product code not found in record:', record);
        continue; // Skip this record if product code is missing
      }

      // Initialize the product if not already exists
      if (!groupedRecords[productKey]) {
        // Always use current date for createdAt and updatedAt during import
        const currentDate = new Date();

        groupedRecords[productKey] = {
          name: record['Nama Produk'] || record['name'] || record['nama_produk'] || record['Nama'] || record['name'] || '',
          productCode: productKey,
          stock: !isNaN(parseInt(record['Stok'] || record['stock'])) ? parseInt(record['Stok'] || record['stock']) : 0, // Default to 0 if not specified
          category: record['Kategori'] || record['category'] || record['kategori'] || '',
          supplier: record['Supplier'] || record['supplier'] || record['supplier'] || '', // Could be empty as per requirement
          description: record['Deskripsi'] || record['description'] || record['deskripsi'] || '',
          createdAt: currentDate,
          updatedAt: currentDate,
          purchasePrice: !isNaN(parseInt(record['Harga Beli'] || record['purchase_price'])) ? parseInt(record['Harga Beli'] || record['purchase_price']) : 0,
          retailPrice: !isNaN(parseInt(record['Harga Eceran'] || record['retailPrice'] || record['hargaEceran'] || record['Harga Umum'])) ? parseInt(record['Harga Eceran'] || record['retailPrice'] || record['hargaEceran'] || record['Harga Umum']) : 0,
          silverPrice: !isNaN(parseInt(record['Harga Silver'] || record['silverPrice'] || record['hargaSilver'])) ? parseInt(record['Harga Silver'] || record['silverPrice'] || record['hargaSilver']) : 0,
          goldPrice: !isNaN(parseInt(record['Harga Gold'] || record['goldPrice'] || record['hargaGold'])) ? parseInt(record['Harga Gold'] || record['goldPrice'] || record['hargaGold']) : 0,
          platinumPrice: !isNaN(parseInt(record['Harga Platinum'] || record['platinumPrice'] || record['hargaPlatinum'])) ? parseInt(record['Harga Platinum'] || record['platinumPrice'] || record['hargaPlatinum']) : 0,
        };
      }
    }

    let importedCount = 0;
    const errors = [];

    // If force is true, proceed directly with import regardless of existing products
    if (force) {
      // Process each unique product with upsert logic
      for (const [productCode, productData] of Object.entries(groupedRecords)) {
        try {
          await globalPrisma.$transaction(async (tx) => {
            // Find or create category
            let category = null;
            if (productData.category) {
              category = await tx.category.findFirst({
                where: {
                  name: productData.category,
                  storeId: masterStoreId
                }
              });

              if (!category) {
                category = await tx.category.create({
                  data: {
                    name: productData.category,
                    storeId: masterStoreId
                  }
                });
              }
            }

            // Find or create supplier
            let supplier = null;
            if (productData.supplier) {
              supplier = await tx.supplier.findFirst({
                where: {
                  name: productData.supplier,
                  storeId: masterStoreId
                }
              });

              if (!supplier) {
                let uniqueCode;
                let counter = 0;
                const baseCode = productData.supplier.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase();

                while (true) {
                  uniqueCode = counter === 0 ? baseCode : `${baseCode}${counter}`;
                  const existingSupplier = await tx.supplier.findUnique({
                    where: {
                      code_storeId: {
                        code: uniqueCode,
                        storeId: masterStoreId
                      }
                    }
                  });
                  if (!existingSupplier) {
                    break;
                  }
                  counter++;
                }

                supplier = await tx.supplier.create({
                  data: {
                    name: productData.supplier,
                    code: uniqueCode,
                    storeId: masterStoreId
                  }
                });
              }
            }

            // Check if product exists (across all stores, not just master store)
            let product = await tx.product.findFirst({
              where: {
                productCode: productCode
              }
            });

            // Validasi harga member
            if (productData.silverPrice > productData.retailPrice) {
              throw new Error(`Harga Silver (${productData.silverPrice}) lebih tinggi dari Harga Umum (${productData.retailPrice}) untuk produk ${productCode}. Harga member harus lebih rendah.`);
            }
            if (productData.goldPrice > productData.silverPrice) {
              throw new Error(`Harga Gold (${productData.goldPrice}) lebih tinggi dari Harga Silver (${productData.silverPrice}) untuk produk ${productCode}. Harga member harus lebih rendah.`);
            }
            if (productData.platinumPrice > productData.goldPrice) {
              throw new Error(`Harga Platinum (${productData.platinumPrice}) lebih tinggi dari Harga Gold (${productData.goldPrice}) untuk produk ${productCode}. Harga member harus lebih rendah.`);
            }

            const productUpsertData = {
              name: productData.name,
              productCode: productCode,
              description: productData.description,
              purchasePrice: productData.purchasePrice,
              retailPrice: productData.retailPrice || 0,
              silverPrice: productData.silverPrice || 0,
              goldPrice: productData.goldPrice || 0,
              platinumPrice: productData.platinumPrice || 0,
              updatedAt: new Date(productData.updatedAt)
            };

            if (category?.id) productUpsertData.categoryId = category.id;
            if (supplier?.id) productUpsertData.supplierId = supplier.id;

            if (!product) {
              // Create new product
              product = await tx.product.create({
                data: {
                  ...productUpsertData,
                  storeId: masterStoreId, // Assign to master store when creating
                  stock: productData.stock, // Set initial stock
                  createdAt: new Date(productData.createdAt)
                }
              });
            } else {
              // Update existing product based on force parameter
              if (force) {
                // If force is true, update all product data and increment stock
                product = await tx.product.update({
                  where: { id: product.id },
                  data: {
                    ...productUpsertData,
                    stock: { increment: productData.stock || 0 } // Add to existing stock
                  }
                });
              } else {
                // If force is false, only increment stock without changing other data
                product = await tx.product.update({
                  where: { id: product.id },
                  data: {
                    stock: { increment: productData.stock || 0 } // Add to existing stock
                  }
                });
              }
            }

            // Upsert WarehouseProduct for the central warehouse
            await tx.warehouseProduct.upsert({
              where: {
                productId_warehouseId: {
                  productId: product.id,
                  warehouseId: centralWarehouse.id
                }
              },
              update: {
                quantity: { increment: productData.stock || 0 }, // Add to existing quantity
                updatedAt: new Date()
              },
              create: {
                productId: product.id,
                warehouseId: centralWarehouse.id,
                quantity: productData.stock || 0,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
          }); // End transaction

          importedCount++;
        } catch (productError) {
          console.error(`Error importing warehouse product with code ${productCode}:`, productError);
          errors.push(`Gagal mengimport produk dengan kode ${productCode}: ${productError.message}`);
        }
      }

      return NextResponse.json({
        message: `Berhasil mengimport ${importedCount} produk ke gudang`,
        importedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    }

    // If force is false, check for existing products to determine if we need confirmation
    const existingProducts = [];
    const newProducts = [];

    for (const [productCode, productData] of Object.entries(groupedRecords)) {
      // Check if product exists (across all stores, not just master store)
      const existingProduct = await globalPrisma.product.findFirst({
        where: {
          productCode: productCode
        }
      });

      if (existingProduct) {
        existingProducts.push({
          productCode,
          productName: productData.name,
          stockToAdd: productData.stock,
          currentStock: existingProduct.stock,
          product: existingProduct
        });
      } else {
        newProducts.push({
          productCode,
          productData
        });
      }
    }

    // If there are existing products, return them for confirmation
    if (existingProducts.length > 0) {
      return NextResponse.json({
        needConfirmation: true,
        duplicateProducts: existingProducts,
        newProductsCount: newProducts.length,
        message: `Ditemukan ${existingProducts.length} produk yang sudah ada. Harap konfirmasi untuk melanjutkan import.`
      });
    }

    // If no existing products, proceed with import
    for (const [productCode, productData] of Object.entries(groupedRecords)) {
      try {
        await globalPrisma.$transaction(async (tx) => {
          // Find or create category
          let category = null;
          if (productData.category) {
            category = await tx.category.findFirst({
              where: {
                name: productData.category,
                storeId: masterStoreId
              }
            });

            if (!category) {
              category = await tx.category.create({
                data: {
                  name: productData.category,
                  storeId: masterStoreId
                }
              });
            }
          }

          // Find or create supplier
          let supplier = null;
          if (productData.supplier) {
            supplier = await tx.supplier.findFirst({
              where: {
                name: productData.supplier,
                storeId: masterStoreId
              }
            });

            if (!supplier) {
              let uniqueCode;
              let counter = 0;
              const baseCode = productData.supplier.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase();

              while (true) {
                uniqueCode = counter === 0 ? baseCode : `${baseCode}${counter}`;
                const existingSupplier = await tx.supplier.findUnique({
                  where: {
                    code_storeId: {
                      code: uniqueCode,
                      storeId: masterStoreId
                    }
                  }
                });
                if (!existingSupplier) {
                  break;
                }
                counter++;
              }

              supplier = await tx.supplier.create({
                data: {
                  name: productData.supplier,
                  code: uniqueCode,
                  storeId: masterStoreId
                }
              });
            }
          }

          // Check if product exists (across all stores, not just master store)
          let product = await tx.product.findFirst({
            where: {
              productCode: productCode
            }
          });

          // Validasi harga member
          if (productData.silverPrice > productData.retailPrice) {
            throw new Error(`Harga Silver (${productData.silverPrice}) lebih tinggi dari Harga Umum (${productData.retailPrice}) untuk produk ${productCode}. Harga member harus lebih rendah.`);
          }
          if (productData.goldPrice > productData.silverPrice) {
            throw new Error(`Harga Gold (${productData.goldPrice}) lebih tinggi dari Harga Silver (${productData.silverPrice}) untuk produk ${productCode}. Harga member harus lebih rendah.`);
          }
          if (productData.platinumPrice > productData.goldPrice) {
            throw new Error(`Harga Platinum (${productData.platinumPrice}) lebih tinggi dari Harga Gold (${productData.goldPrice}) untuk produk ${productCode}. Harga member harus lebih rendah.`);
          }

          const productUpsertData = {
            name: productData.name,
            productCode: productCode,
            description: productData.description,
            purchasePrice: productData.purchasePrice,
            retailPrice: productData.retailPrice || 0,
            silverPrice: productData.silverPrice || 0,
            goldPrice: productData.goldPrice || 0,
            platinumPrice: productData.platinumPrice || 0,
            updatedAt: new Date(productData.updatedAt)
          };

          if (category?.id) productUpsertData.categoryId = category.id;
          if (supplier?.id) productUpsertData.supplierId = supplier.id;

          if (!product) {
            // Create new product
            product = await tx.product.create({
              data: {
                ...productUpsertData,
                storeId: masterStoreId, // Assign to master store when creating
                stock: productData.stock, // Set initial stock
                createdAt: new Date(productData.createdAt)
              }
            });
          } else {
            // Update existing product, incrementing stock
            product = await tx.product.update({
              where: { id: product.id },
              data: {
                ...productUpsertData,
                stock: { increment: productData.stock || 0 } // Add to existing stock
              }
            });
          }

          // Upsert WarehouseProduct for the central warehouse
          await tx.warehouseProduct.upsert({
            where: {
              productId_warehouseId: {
                productId: product.id,
                warehouseId: centralWarehouse.id
              }
            },
            update: {
              quantity: { increment: productData.stock || 0 }, // Add to existing quantity
              updatedAt: new Date()
            },
            create: {
              productId: product.id,
              warehouseId: centralWarehouse.id,
              quantity: productData.stock || 0,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }); // End transaction

        importedCount++;
      } catch (productError) {
        console.error(`Error importing warehouse product with code ${productCode}:`, productError);
        errors.push(`Gagal mengimport produk dengan kode ${productCode}: ${productError.message}`);
      }
    }

    return NextResponse.json({
      message: `Berhasil mengimport ${importedCount} produk ke gudang`,
      importedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error importing warehouse products:', error);
    return NextResponse.json({ error: `Gagal mengimport produk gudang: ${error.message}` }, { status: 500 });
  }
}