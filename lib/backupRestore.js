import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const execPromise = promisify(exec);

// Fungsi untuk membuat backup database
export async function createBackup(storeId) {
  try {
    // Buat direktori backup jika belum ada
    const backupDir = path.join(process.cwd(), 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    // Nama file backup dengan timestamp dan storeId
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${storeId}-${timestamp}.sql`;
    const backupFilePath = path.join(backupDir, backupFileName);

    // Ambil informasi koneksi dari environment
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Parse URL database
    const dbUrlObj = new URL(dbUrl);
    const dbName = dbUrlObj.pathname.slice(1); // Remove leading '/'
    const dbUser = dbUrlObj.username;
    const dbPassword = dbUrlObj.password;
    const dbHost = dbUrlObj.hostname;
    const dbPort = dbUrlObj.port || '5432';

    // Perintah untuk membuat backup (misalnya untuk PostgreSQL)
    // Untuk sistem multi-tenant, kita perlu filter data berdasarkan storeId
    // Tapi karena pg_dump tidak mendukung filter langsung, kita gunakan pendekatan berbeda
    // Kita akan gunakan selective backup sebagai gantinya untuk sistem multi-tenant
    throw new Error('Full backup using pg_dump tidak didukung untuk sistem multi-tenant. Gunakan selective backup.');
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
}

// Fungsi untuk membuat backup hanya untuk tabel-tabel penting berdasarkan store
export async function createSelectiveBackup(storeId) {
  try {
    // Buat direktori backup jika belum ada
    const backupDir = path.join(process.cwd(), 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    // Nama file backup dengan timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `selective-backup-${storeId}-${timestamp}.json`;
    const backupFilePath = path.join(backupDir, backupFileName);

    // Cek apakah storeId yang diberikan benar-benar ada
    const store = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      throw new Error(`Store dengan ID ${storeId} tidak ditemukan`);
    }

    // Ambil data penting dari database berdasarkan store
    const stores = await prisma.store.findMany({
      where: { id: storeId }
    });

    const users = await prisma.user.findMany({
      include: {
        storeUsers: {
          where: { storeId: storeId }
        }
      }
    });

    // Filter users hanya yang terkait dengan store
    const storeUsers = users.filter(user => user.storeUsers.length > 0);

    const products = await prisma.product.findMany({
      where: { storeId: storeId }
    });

    const sales = await prisma.sale.findMany({
      where: { storeId: storeId },
      include: {
        saleDetails: true,
      },
    });

    const settings = await prisma.setting.findMany({
      where: { storeId: storeId }
    });

    const auditLogs = await prisma.auditLog.findMany({
      where: { storeId: storeId },
      take: 1000, // Ambil 1000 log terbaru
      orderBy: { createdAt: 'desc' },
    });

    // Ambil data terkait lainnya berdasarkan store
    const categories = await prisma.category.findMany({
      where: { storeId: storeId }
    });

    const suppliers = await prisma.supplier.findMany({
      where: { storeId: storeId }
    });

    const members = await prisma.member.findMany({
      where: { storeId: storeId }
    });

    const expenses = await prisma.expense.findMany({
      where: { storeId: storeId }
    });

    const expenseCategories = await prisma.expenseCategory.findMany({
      where: { storeId: storeId }
    });

    const suspendedSales = await prisma.suspendedSale.findMany({
      where: { storeId: storeId }
    });

    const tempCarts = await prisma.tempCart.findMany({
      where: { storeId: storeId }
    });

    const purchases = await prisma.purchase.findMany({
      where: { storeId: storeId },
      include: {
        items: true
      }
    });

    const receivables = await prisma.receivable.findMany({
      where: { storeId: storeId }
    });

    // Buat objek backup
    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        storeId: storeId,
      },
      stores,
      users: storeUsers,
      products,
      sales,
      settings,
      auditLogs,
      categories,
      suppliers,
      members,
      expenses,
      expenseCategories,
      suspendedSales,
      tempCarts,
      purchases,
      receivables,
    };

    // Simpan sebagai JSON
    await fs.writeFile(backupFilePath, JSON.stringify(backupData, null, 2));

    console.log(`Selective backup created successfully: ${backupFilePath}`);

    return {
      success: true,
      filePath: backupFilePath,
      fileName: backupFileName,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating selective backup:', error);
    throw error;
  }
}

// Fungsi untuk mengembalikan (restore) backup
export async function restoreBackup(backupFilePath) {
  try {
    // Cek apakah file backup ada
    await fs.access(backupFilePath);

    // Cek apakah file backup dalam format JSON (selective backup)
    if (backupFilePath.endsWith('.json')) {
      return await restoreSelectiveBackup(backupFilePath);
    } else {
      // Jika bukan JSON, tolak untuk sistem multi-tenant
      throw new Error('SQL backup restore tidak didukung untuk sistem multi-tenant. Gunakan selective backup (JSON).');
    }
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw error;
  }
}

// Fungsi untuk mengembalikan selective backup (JSON) berdasarkan store
async function restoreSelectiveBackup(backupFilePath) {
  try {
    // Baca file backup
    const backupContent = await fs.readFile(backupFilePath, 'utf-8');
    const backupData = JSON.parse(backupContent);

    // Pastikan backup memiliki storeId
    const storeId = backupData.metadata?.storeId;
    if (!storeId) {
      throw new Error('Backup file does not contain store information');
    }

    // Hapus data lama untuk toko ini
    await prisma.$transaction(async (tx) => {
      // Hapus data terkait dalam urutan yang benar untuk menghindari constraint violation
      await tx.saleDetail.deleteMany({ where: { storeId } });
      await tx.sale.deleteMany({ where: { storeId } });
      await tx.purchaseItem.deleteMany({ where: { storeId } });
      await tx.purchase.deleteMany({ where: { storeId } });
      await tx.tempCart.deleteMany({ where: { storeId } });
      await tx.suspendedSale.deleteMany({ where: { storeId } });
      await tx.receivable.deleteMany({ where: { storeId } });
      await tx.expense.deleteMany({ where: { storeId } });
      await tx.expenseCategory.deleteMany({ where: { storeId } });
      await tx.member.deleteMany({ where: { storeId } });
      await tx.supplier.deleteMany({ where: { storeId } });
      await tx.product.deleteMany({ where: { storeId } });
      await tx.category.deleteMany({ where: { storeId } });
      await tx.auditLog.deleteMany({ where: { storeId } });
      await tx.setting.deleteMany({ where: { storeId } });
    });

    // Restore data
    await prisma.$transaction(async (tx) => {
      // Restore stores - hanya update jika sudah ada
      for (const store of backupData.stores) {
        await tx.store.update({
          where: { id: store.id },
          data: {
            name: store.name,
            description: store.description,
            address: store.address,
            phone: store.phone,
            email: store.email,
            status: store.status,
            updatedAt: store.updatedAt,
          },
        });
      }

      // Restore categories
      for (const category of backupData.categories) {
        await tx.category.upsert({
          where: { id: category.id },
          update: { ...category, updatedAt: new Date() },
          create: { ...category, createdAt: new Date(), updatedAt: new Date() },
        });
      }

      // Restore suppliers
      for (const supplier of backupData.suppliers) {
        await tx.supplier.upsert({
          where: { id: supplier.id },
          update: { ...supplier, updatedAt: new Date() },
          create: { ...supplier, createdAt: new Date(), updatedAt: new Date() },
        });
      }

      // Restore products
      for (const product of backupData.products) {
        await tx.product.upsert({
          where: { id: product.id },
          update: { ...product, updatedAt: new Date() },
          create: { ...product, createdAt: new Date(), updatedAt: new Date() },
        });
      }

      // Restore members
      for (const member of backupData.members) {
        await tx.member.upsert({
          where: { id: member.id },
          update: { ...member, updatedAt: new Date() },
          create: { ...member, createdAt: new Date(), updatedAt: new Date() },
        });
      }

      // Restore settings
      for (const setting of backupData.settings) {
        await tx.setting.upsert({
          where: { id: setting.id },
          update: setting,
          create: setting,
        });
      }

      // Restore expense categories
      for (const category of backupData.expenseCategories) {
        await tx.expenseCategory.upsert({
          where: { id: category.id },
          update: { ...category, updatedAt: new Date() },
          create: { ...category, createdAt: new Date(), updatedAt: new Date() },
        });
      }

      // Restore expenses
      for (const expense of backupData.expenses) {
        await tx.expense.upsert({
          where: { id: expense.id },
          update: { ...expense, updatedAt: new Date() },
          create: { ...expense, createdAt: new Date(), updatedAt: new Date() },
        });
      }

      // Restore purchases
      for (const purchase of backupData.purchases) {
        const { items, ...purchaseData } = purchase;

        await tx.purchase.upsert({
          where: { id: purchaseData.id },
          update: purchaseData,
          create: purchaseData,
        });

        // Restore purchase items
        for (const item of items) {
          await tx.purchaseItem.upsert({
            where: { id: item.id },
            update: item,
            create: item,
          });
        }
      }

      // Restore sales
      for (const sale of backupData.sales) {
        const { saleDetails, ...saleData } = sale;

        await tx.sale.upsert({
          where: { id: saleData.id },
          update: saleData,
          create: saleData,
        });

        // Restore sale details
        for (const detail of saleDetails) {
          await tx.saleDetail.upsert({
            where: { id: detail.id },
            update: detail,
            create: detail,
          });
        }
      }

      // Restore receivables
      for (const receivable of backupData.receivables) {
        await tx.receivable.upsert({
          where: { id: receivable.id },
          update: receivable,
          create: receivable,
        });
      }

      // Restore suspended sales
      for (const suspendedSale of backupData.suspendedSales) {
        await tx.suspendedSale.upsert({
          where: { id: suspendedSale.id },
          update: suspendedSale,
          create: suspendedSale,
        });
      }

      // Restore temp carts
      for (const tempCart of backupData.tempCarts) {
        await tx.tempCart.upsert({
          where: { id: tempCart.id },
          update: tempCart,
          create: tempCart,
        });
      }

      // Restore audit logs
      for (const auditLog of backupData.auditLogs) {
        await tx.auditLog.upsert({
          where: { id: auditLog.id },
          update: auditLog,
          create: auditLog,
        });
      }
    });

    console.log(`Selective backup restored successfully from: ${backupFilePath} for store: ${storeId}`);

    return {
      success: true,
      message: 'Backup restored successfully',
      storeId: storeId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error restoring selective backup:', error);
    throw error;
  }
}

// Fungsi untuk mengembalikan SQL backup
async function restoreSqlBackup(backupFilePath) {
  // Karena SQL backup akan mengembalikan seluruh database, kita tidak mendukung ini untuk sistem multi-tenant
  // Kita hanya mendukung selective backup (JSON) untuk sistem multi-tenant
  throw new Error('SQL backup restore tidak didukung untuk sistem multi-tenant. Gunakan selective backup (JSON).');
}

// Fungsi untuk mendapatkan daftar backup yang tersedia berdasarkan store
export async function getBackupList(storeId = null) {
  try {
    const backupDir = path.join(process.cwd(), 'backups');

    // Buat direktori backup jika belum ada
    await fs.mkdir(backupDir, { recursive: true });

    const files = await fs.readdir(backupDir);

    // Filter files berdasarkan storeId jika diberikan
    let filteredFiles = files;
    if (storeId) {
      filteredFiles = files.filter(file =>
        file.startsWith('backup-') || file.startsWith(`selective-backup-${storeId}-`)
      );
    } else {
      filteredFiles = files.filter(file =>
        file.startsWith('backup-') || file.startsWith('selective-backup-')
      );
    }

    const backupFiles = filteredFiles
      .map(fileName => {
        const filePath = path.join(backupDir, fileName);

        // Ekstrak storeId dari nama file jika ada
        let extractedStoreId = null;
        if (fileName.startsWith('selective-backup-')) {
          const match = fileName.match(/selective-backup-([a-zA-Z0-9]+)-/);
          if (match) {
            extractedStoreId = match[1];
          }
        }

        // Ekstrak timestamp dari nama file
        let timestampStr = fileName;
        if (fileName.startsWith('selective-backup-') && extractedStoreId) {
          timestampStr = fileName.replace(`selective-backup-${extractedStoreId}-`, '');
        } else {
          timestampStr = fileName.replace(/^(backup-|selective-backup-)/, '');
        }
        timestampStr = timestampStr.replace(/\.sql|\.json$/, '');

        // Konversi ke format tanggal
        let timestamp;
        try {
          // Coba parse timestamp dari nama file
          const dateParts = timestampStr.split('-');
          if (dateParts.length >= 6) {
            const [year, month, day, hour, minute, second] = dateParts;
            timestamp = new Date(Date.UTC(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day),
              parseInt(hour),
              parseInt(minute),
              parseInt(second.replace(/\.\d+$/, ''))
            )).toISOString();
          } else {
            timestamp = new Date().toISOString();
          }
        } catch (e) {
          timestamp = new Date().toISOString();
        }

        return {
          fileName,
          filePath,
          timestamp,
          size: null, // Akan diisi nanti
          type: fileName.endsWith('.sql') ? 'full' : 'selective',
          storeId: extractedStoreId
        };
      });

    // Dapatkan ukuran file
    for (const backupFile of backupFiles) {
      const stats = await fs.stat(backupFile.filePath);
      backupFile.size = stats.size;
    }

    // Urutkan berdasarkan timestamp terbaru
    backupFiles.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Jika storeId diberikan, filter hasil agar hanya menampilkan backup untuk store tersebut
    if (storeId) {
      return backupFiles.filter(file => file.storeId === storeId);
    }

    return backupFiles;
  } catch (error) {
    console.error('Error getting backup list:', error);
    throw error;
  }
}

// Fungsi untuk menghapus backup lama (misalnya lebih dari 30 hari)
export async function cleanupOldBackups(maxAgeDays = 30, storeId = null) {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    const files = await fs.readdir(backupDir);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    let deletedCount = 0;
    for (const file of files) {
      // Filter file berdasarkan store jika storeId diberikan
      if (storeId) {
        if (file.startsWith(`selective-backup-${storeId}-`)) {
          const filePath = path.join(backupDir, file);
          const stats = await fs.stat(filePath);

          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            deletedCount++;
            console.log(`Deleted old backup for store ${storeId}: ${file}`);
          }
        }
      } else {
        // Jika tidak ada storeId, hapus semua jenis backup yang cocok
        if (file.startsWith('backup-') || file.startsWith('selective-backup-')) {
          const filePath = path.join(backupDir, file);
          const stats = await fs.stat(filePath);

          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            deletedCount++;
            console.log(`Deleted old backup: ${file}`);
          }
        }
      }
    }

    return {
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} old backup files`
    };
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
    throw error;
  }
}

// Fungsi untuk backup otomatis (dijalankan secara berkala) berdasarkan store
export async function autoBackup(storeId) {
  try {
    console.log(`Starting automatic backup for store: ${storeId}...`);

    const result = await createSelectiveBackup(storeId);

    // Hapus backup yang lebih lama dari 30 hari untuk toko ini
    await cleanupOldBackups(30, storeId);

    console.log(`Automatic backup completed successfully for store: ${storeId}`);

    return result;
  } catch (error) {
    console.error('Error in automatic backup:', error);
    throw error;
  }
}