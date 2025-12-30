import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const execPromise = promisify(exec);

// Fungsi untuk membuat backup database
export async function createBackup() {
  try {
    // Buat direktori backup jika belum ada
    const backupDir = path.join(process.cwd(), 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    // Nama file backup dengan timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.sql`;
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
    const pgDumpCommand = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --no-password`;

    // Setel password ke environment untuk pg_dump
    const env = { ...process.env, PGPASSWORD: dbPassword };

    // Jalankan perintah backup
    const { stdout } = await execPromise(pgDumpCommand, { env });
    
    // Simpan hasil backup ke file
    await fs.writeFile(backupFilePath, stdout);
    
    console.log(`Backup created successfully: ${backupFilePath}`);
    
    return {
      success: true,
      filePath: backupFilePath,
      fileName: backupFileName,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
}

// Fungsi untuk membuat backup hanya untuk tabel-tabel penting
export async function createSelectiveBackup() {
  try {
    // Buat direktori backup jika belum ada
    const backupDir = path.join(process.cwd(), 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    // Nama file backup dengan timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `selective-backup-${timestamp}.json`;
    const backupFilePath = path.join(backupDir, backupFileName);

    // Ambil data penting dari database
    const stores = await prisma.store.findMany();
    const users = await prisma.user.findMany();
    const products = await prisma.product.findMany();
    const sales = await prisma.sale.findMany({
      include: {
        saleDetails: true,
      },
    });
    const settings = await prisma.setting.findMany();
    const auditLogs = await prisma.auditLog.findMany({
      take: 1000, // Ambil 1000 log terbaru
      orderBy: { createdAt: 'desc' },
    });

    // Buat objek backup
    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
      stores,
      users,
      products,
      sales,
      settings,
      auditLogs,
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
      // Jika bukan JSON, asumsikan file SQL dan gunakan perintah database
      return await restoreSqlBackup(backupFilePath);
    }
  } catch (error) {
    console.error('Error restoring backup:', error);
    throw error;
  }
}

// Fungsi untuk mengembalikan selective backup (JSON)
async function restoreSelectiveBackup(backupFilePath) {
  try {
    // Baca file backup
    const backupContent = await fs.readFile(backupFilePath, 'utf-8');
    const backupData = JSON.parse(backupContent);

    // Hapus data lama (opsional - sesuaikan kebijakan Anda)
    // await prisma.$transaction(async (tx) => {
    //   await tx.saleItem.deleteMany({});
    //   await tx.sale.deleteMany({});
    //   await tx.product.deleteMany({});
    //   await tx.storeUser.deleteMany({});
    //   await tx.user.deleteMany({});
    //   await tx.store.deleteMany({});
    // });

    // Restore data
    await prisma.$transaction(async (tx) => {
      // Restore stores
      for (const store of backupData.stores) {
        await tx.store.upsert({
          where: { id: store.id },
          update: store,
          create: store,
        });
      }

      // Restore users
      for (const user of backupData.users) {
        await tx.user.upsert({
          where: { id: user.id },
          update: { ...user, password: user.password }, // Jaga password tetap terenkripsi
          create: user,
        });
      }

      // Restore products
      for (const product of backupData.products) {
        await tx.product.upsert({
          where: { id: product.id },
          update: product,
          create: product,
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

      // Restore sales
      for (const sale of backupData.sales) {
        const { saleItems, ...saleData } = sale;
        
        await tx.sale.upsert({
          where: { id: saleData.id },
          update: saleData,
          create: saleData,
        });

        // Restore sale items
        for (const item of saleItems) {
          await tx.saleItem.upsert({
            where: { id: item.id },
            update: item,
            create: item,
          });
        }
      }
    });

    console.log(`Selective backup restored successfully from: ${backupFilePath}`);
    
    return {
      success: true,
      message: 'Backup restored successfully',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error restoring selective backup:', error);
    throw error;
  }
}

// Fungsi untuk mengembalikan SQL backup
async function restoreSqlBackup(backupFilePath) {
  try {
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

    // Perintah untuk restore (misalnya untuk PostgreSQL)
    const psqlCommand = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --no-password`;

    // Setel password ke environment untuk psql
    const env = { ...process.env, PGPASSWORD: dbPassword };

    // Jalankan perintah restore
    await execPromise(`cat ${backupFilePath} | ${psqlCommand}`, { env });

    console.log(`SQL backup restored successfully from: ${backupFilePath}`);
    
    return {
      success: true,
      message: 'Backup restored successfully',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error restoring SQL backup:', error);
    throw error;
  }
}

// Fungsi untuk mendapatkan daftar backup yang tersedia
export async function getBackupList() {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    
    // Buat direktori backup jika belum ada
    await fs.mkdir(backupDir, { recursive: true });

    const files = await fs.readdir(backupDir);
    const backupFiles = files
      .filter(file => file.startsWith('backup-') || file.startsWith('selective-backup-'))
      .map(fileName => {
        const filePath = path.join(backupDir, fileName);
        const timestamp = fileName.replace(/^(backup-|selective-backup-)|(\.sql|\.json)$/g, '').replace(/-/g, ':');
        return {
          fileName,
          filePath,
          timestamp: new Date(timestamp).toISOString(),
          size: null, // Akan diisi nanti
          type: fileName.endsWith('.sql') ? 'full' : 'selective'
        };
      });

    // Dapatkan ukuran file
    for (const backupFile of backupFiles) {
      const stats = await fs.stat(backupFile.filePath);
      backupFile.size = stats.size;
    }

    // Urutkan berdasarkan timestamp terbaru
    backupFiles.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return backupFiles;
  } catch (error) {
    console.error('Error getting backup list:', error);
    throw error;
  }
}

// Fungsi untuk menghapus backup lama (misalnya lebih dari 30 hari)
export async function cleanupOldBackups(maxAgeDays = 30) {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    const files = await fs.readdir(backupDir);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    let deletedCount = 0;
    for (const file of files) {
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

// Fungsi untuk backup otomatis (dijalankan secara berkala)
export async function autoBackup() {
  try {
    console.log('Starting automatic backup...');
    
    const result = await createSelectiveBackup();
    
    // Hapus backup yang lebih lama dari 30 hari
    await cleanupOldBackups();
    
    console.log('Automatic backup completed successfully');
    
    return result;
  } catch (error) {
    console.error('Error in automatic backup:', error);
    throw error;
  }
}