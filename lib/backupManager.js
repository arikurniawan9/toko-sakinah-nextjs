// lib/backupManager.js
import prisma from './prisma';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logAudit, AUDIT_ACTIONS } from './auditLogger';

const execPromise = promisify(exec);

class BackupManager {
  constructor(backupDir = './backups') {
    this.backupDir = backupDir;
    this.ensureBackupDirectory();
  }

  // Membuat direktori backup jika belum ada
  async ensureBackupDirectory() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error('Gagal membuat direktori backup:', error);
    }
  }

  // Membuat backup database
  async createBackup(userId = null, storeId = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(this.backupDir, filename);

    try {
      // Ambil semua data penting dari database
      const backupData = {
        timestamp: new Date().toISOString(),
        schemaVersion: process.env.DB_SCHEMA_VERSION || '1.0',
        users: await prisma.user.findMany(),
        stores: await prisma.store.findMany(),
        products: await prisma.product.findMany(),
        transactions: await prisma.transaction.findMany({
          include: {
            items: true,
            customer: true,
          }
        }),
        categories: await prisma.category.findMany(),
        suppliers: await prisma.supplier.findMany(),
        storeUsers: await prisma.storeUser.findMany(),
        auditLogs: await prisma.auditLog.findMany({
          where: {
            timestamp: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Hanya log 30 hari terakhir
            }
          }
        }),
        settings: await prisma.setting.findMany(), // Jika ada tabel settings
      };

      // Simpan backup sebagai file JSON
      await fs.writeFile(filepath, JSON.stringify(backupData, null, 2));

      // Log aktivitas backup
      await logAudit({
        userId,
        action: AUDIT_ACTIONS.SETTINGS_UPDATE, // Gunakan action yang sesuai
        tableName: 'backup',
        recordId: filename,
        newValue: { filepath, size: backupData.size },
        storeId,
        additionalData: { type: 'database_backup' }
      });

      console.log(`Backup berhasil dibuat: ${filepath}`);
      return { success: true, filepath, message: 'Backup berhasil dibuat' };
    } catch (error) {
      console.error('Gagal membuat backup:', error);

      // Log error ke audit
      await logAudit({
        userId,
        action: AUDIT_ACTIONS.SECURITY_ALERT,
        tableName: 'backup',
        recordId: filename,
        additionalData: { 
          type: 'backup_error', 
          error: error.message,
          filepath 
        },
        storeId
      });

      return { 
        success: false, 
        error: error.message, 
        message: 'Gagal membuat backup: ' + error.message 
      };
    }
  }

  // Mengembalikan data dari backup
  async restoreFromBackup(filepath, userId = null, storeId = null) {
    try {
      // Validasi file backup
      if (!filepath || !filepath.endsWith('.json')) {
        throw new Error('File backup tidak valid');
      }

      const backupData = JSON.parse(await fs.readFile(filepath, 'utf8'));

      // Validasi struktur backup
      if (!backupData.timestamp || !backupData.users) {
        throw new Error('Struktur backup tidak valid');
      }

      // Hapus data lama (opsional, bisa diatur sebagai parameter)
      await this.clearNonSystemData();

      // Mulai transaksi untuk restore data
      await prisma.$transaction(async (tx) => {
        // Restore users
        if (backupData.users) {
          // Hapus dulu untuk mencegah konflik
          await tx.user.deleteMany();
          
          for (const user of backupData.users) {
            // Jangan restore password langsung, mungkin perlu pendekatan berbeda
            const { password, ...safeUserData } = user;
            await tx.user.create({
              data: {
                ...safeUserData,
                password: user.password, // Tergantung kebijakan keamanan
              }
            });
          }
        }

        // Restore stores
        if (backupData.stores) {
          await tx.store.deleteMany();
          for (const store of backupData.stores) {
            await tx.store.create({
              data: store
            });
          }
        }

        // Restore categories
        if (backupData.categories) {
          await tx.category.deleteMany();
          for (const category of backupData.categories) {
            await tx.category.create({
              data: category
            });
          }
        }

        // Restore suppliers
        if (backupData.suppliers) {
          await tx.supplier.deleteMany();
          for (const supplier of backupData.suppliers) {
            await tx.supplier.create({
              data: supplier
            });
          }
        }

        // Restore products
        if (backupData.products) {
          await tx.product.deleteMany();
          for (const product of backupData.products) {
            await tx.product.create({
              data: product
            });
          }
        }

        // Restore store users
        if (backupData.storeUsers) {
          await tx.storeUser.deleteMany();
          for (const storeUser of backupData.storeUsers) {
            await tx.storeUser.create({
              data: storeUser
            });
          }
        }

        // Restore transactions
        if (backupData.transactions) {
          await tx.transaction.deleteMany();
          for (const transaction of backupData.transactions) {
            const { items, customer, ...transactionData } = transaction;
            
            // Create transaction
            const createdTransaction = await tx.transaction.create({
              data: {
                ...transactionData,
                customerId: transactionData.customerId || null,
              }
            });

            // Create transaction items
            if (items && items.length > 0) {
              for (const item of items) {
                await tx.transactionItem.create({
                  data: {
                    ...item,
                    transactionId: createdTransaction.id
                  }
                });
              }
            }
          }
        }

        // Restore audit logs
        if (backupData.auditLogs) {
          await tx.auditLog.deleteMany();
          for (const log of backupData.auditLogs) {
            await tx.auditLog.create({
              data: log
            });
          }
        }

        // Restore settings
        if (backupData.settings) {
          await tx.setting.deleteMany();
          for (const setting of backupData.settings) {
            await tx.setting.create({
              data: setting
            });
          }
        }
      });

      // Log aktivitas restore
      await logAudit({
        userId,
        action: AUDIT_ACTIONS.SETTINGS_UPDATE,
        tableName: 'restore',
        recordId: path.basename(filepath),
        newValue: { filepath },
        storeId,
        additionalData: { type: 'database_restore' }
      });

      console.log(`Restore berhasil dari: ${filepath}`);
      return { success: true, message: 'Restore berhasil dilakukan' };
    } catch (error) {
      console.error('Gagal melakukan restore:', error);

      // Log error ke audit
      await logAudit({
        userId,
        action: AUDIT_ACTIONS.SECURITY_ALERT,
        tableName: 'restore',
        recordId: filepath ? path.basename(filepath) : 'unknown',
        additionalData: { 
          type: 'restore_error', 
          error: error.message,
          filepath 
        },
        storeId
      });

      return { 
        success: false, 
        error: error.message, 
        message: 'Gagal melakukan restore: ' + error.message 
      };
    }
  }

  // Menghapus data non-sistem (data pengguna, produk, transaksi, dll)
  async clearNonSystemData() {
    try {
      // Hapus dalam urutan yang benar untuk menghindari constraint violation
      await prisma.transactionItem.deleteMany();
      await prisma.transaction.deleteMany();
      await prisma.product.deleteMany();
      await prisma.storeUser.deleteMany();
      await prisma.user.deleteMany({ where: { username: { not: 'admin' } } }); // Jaga user admin
      await prisma.store.deleteMany();
      await prisma.category.deleteMany();
      await prisma.supplier.deleteMany();
      await prisma.auditLog.deleteMany();
    } catch (error) {
      console.error('Gagal membersihkan data:', error);
      throw error;
    }
  }

  // Mendapatkan daftar file backup
  async getBackupList() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .map(file => {
          const filepath = path.join(this.backupDir, file);
          return {
            filename: file,
            filepath,
            createdAt: this.extractTimestamp(file),
          };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return backupFiles;
    } catch (error) {
      console.error('Gagal mengambil daftar backup:', error);
      return [];
    }
  }

  // Mengekstrak timestamp dari nama file backup
  extractTimestamp(filename) {
    const match = filename.match(/backup-(.+)\.json/);
    if (match) {
      // Ubah format timestamp kembali
      const timestampStr = match[1].replace(/-/g, '.').slice(0, -4).replace(/\./g, ':');
      return new Date(timestampStr).toISOString();
    }
    return null;
  }

  // Menghapus backup lama (menggunakan aturan retensi)
  async cleanupOldBackups(retentionDays = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const backupFiles = await this.getBackupList();
      const oldBackups = backupFiles.filter(backup => 
        new Date(backup.createdAt) < cutoffDate
      );

      for (const backup of oldBackups) {
        await fs.unlink(backup.filepath);
        console.log(`Backup lama dihapus: ${backup.filename}`);
      }

      return { 
        success: true, 
        deletedCount: oldBackups.length,
        message: `Menghapus ${oldBackups.length} backup lama` 
      };
    } catch (error) {
      console.error('Gagal membersihkan backup lama:', error);
      return { 
        success: false, 
        error: error.message, 
        message: 'Gagal membersihkan backup lama: ' + error.message 
      };
    }
  }

  // Validasi file backup
  async validateBackup(filepath) {
    try {
      const backupData = JSON.parse(await fs.readFile(filepath, 'utf8'));
      
      // Validasi struktur minimal
      const requiredFields = ['timestamp', 'users', 'stores', 'products'];
      const missingFields = requiredFields.filter(field => !(field in backupData));
      
      if (missingFields.length > 0) {
        return {
          valid: false,
          error: `File backup tidak lengkap, field hilang: ${missingFields.join(', ')}`
        };
      }

      // Validasi timestamp
      const timestampDate = new Date(backupData.timestamp);
      if (isNaN(timestampDate.getTime())) {
        return {
          valid: false,
          error: 'Timestamp backup tidak valid'
        };
      }

      return {
        valid: true,
        data: {
          timestamp: backupData.timestamp,
          userCount: backupData.users?.length || 0,
          productCount: backupData.products?.length || 0,
          transactionCount: backupData.transactions?.length || 0
        }
      };
    } catch (error) {
      return {
        valid: false,
        error: `File backup rusak atau tidak dapat dibaca: ${error.message}`
      };
    }
  }
}

// Fungsi untuk membuat instance backup manager
export const backupManager = new BackupManager();

// Fungsi helper untuk backup otomatis
export async function scheduleAutomaticBackup(userId, storeId, intervalHours = 24) {
  // Fungsi ini bisa diintegrasikan dengan scheduler
  try {
    const result = await backupManager.createBackup(userId, storeId);
    if (result.success) {
      console.log('Backup otomatis berhasil:', result.filepath);
    } else {
      console.error('Backup otomatis gagal:', result.error);
    }
    
    // Jadwalkan backup berikutnya
    setTimeout(() => {
      scheduleAutomaticBackup(userId, storeId, intervalHours);
    }, intervalHours * 60 * 60 * 1000);
    
    return result;
  } catch (error) {
    console.error('Error dalam backup otomatis:', error);
    return { success: false, error: error.message };
  }
}

export default backupManager;