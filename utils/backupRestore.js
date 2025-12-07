import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';
import zlib from 'zlib';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import prisma from '@/lib/prisma';

const pipelineAsync = promisify(pipeline);

// Konstanta untuk enkripsi
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // Bytes
const SALT_LENGTH = 64; // Bytes

// Fungsi untuk mengenkripsi data backup
export async function encryptBackup(data, password) {
  if (!password) {
    return data; // Jika tidak ada password, kembalikan data mentah
  }

  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  const key = await promisify(scrypt)(password, salt, 32);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Gabungkan salt, IV, authTag, dan data terenkripsi
  const result = Buffer.concat([salt, iv, authTag, encrypted]);
  
  return result;
}

// Fungsi untuk mendekripsi data backup
export async function decryptBackup(encryptedData, password) {
  if (!password) {
    return encryptedData.toString(); // Jika tidak ada password, kembalikan data mentah
  }

  const salt = encryptedData.slice(0, SALT_LENGTH);
  const iv = encryptedData.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = encryptedData.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + 16);
  const encrypted = encryptedData.slice(SALT_LENGTH + IV_LENGTH + 16);

  const key = await promisify(scrypt)(password, salt, 32);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  
  return decrypted.toString();
}

// Fungsi untuk membuat backup terkompresi
export async function createCompressedBackup(data) {
  const compressed = await pipelineAsync(
    async function* () {
      yield data;
    },
    zlib.createGzip()
  );
  
  return compressed;
}

// Fungsi untuk mengekstrak backup terkompresi
export async function extractCompressedBackup(compressedData) {
  const extracted = await pipelineAsync(
    async function* () {
      yield compressedData;
    },
    zlib.createGunzip()
  );
  
  return extracted.toString();
}

// Fungsi untuk membuat direktori backup jika belum ada
export function ensureBackupDirectory() {
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
}

// Fungsi untuk membersihkan file backup lama
export function cleanupOldBackups(backupDir, retentionDays = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const files = fs.readdirSync(backupDir);
  let deletedCount = 0;

  files.forEach(file => {
    const filePath = path.join(backupDir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.mtime < cutoffDate) {
      fs.unlinkSync(filePath);
      deletedCount++;
    }
  });

  return deletedCount;
}

// Fungsi untuk mendapatkan informasi backup
export function getBackupInfo(backupPath) {
  if (!fs.existsSync(backupPath)) {
    throw new Error('Backup file not found');
  }

  const stats = fs.statSync(backupPath);
  return {
    path: backupPath,
    name: path.basename(backupPath),
    size: stats.size,
    created: stats.ctime,
    modified: stats.mtime,
  };
}

// Fungsi untuk membuat query backup yang aman
export function buildSafeBackupQuery(tableName, storeId, excludedColumns = []) {
  // Validasi nama tabel untuk mencegah SQL injection
  const validTableNames = [
    'users', 'categories', 'products', 'suppliers', 'members', 
    'sales', 'saleDetails', 'purchases', 'purchaseItems', 'expenses',
    'expenseCategories', 'tempCarts', 'auditLogs', 'settings', 'storeUsers'
  ];
  
  if (!validTableNames.includes(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }
  
  // Bangun query dengan parameter yang aman
  const excludedColumnsStr = excludedColumns.length > 0 
    ? ` AND column_name NOT IN (${excludedColumns.map(() => '?').join(',')})` 
    : '';
  
  return {
    tableName,
    storeId,
    excludedColumns
  };
}

// Fungsi untuk mengkonversi data ke format SQL aman
export function convertToSafeSQL(data, tableName) {
  if (!data || !Array.isArray(data)) return [];

  // Daftar kolom sensitif yang perlu dienkripsi atau disaring
  const sensitiveColumns = {
    'users': ['password'],
    'settings': ['apiKey', 'secretKey'],
  };

  const sensitiveCols = sensitiveColumns[tableName] || [];

  return data.map(item => {
    const safeItem = { ...item };
    
    // Saring kolom sensitif
    sensitiveCols.forEach(col => {
      if (safeItem[col]) {
        // Jangan sertakan kolom sensitif dalam backup, atau enkripsi
        delete safeItem[col];
      }
    });
    
    // Sanitasi nilai string
    Object.keys(safeItem).forEach(key => {
      if (typeof safeItem[key] === 'string') {
        // Lakukan sanitasi dasar untuk mencegah SQL injection
        safeItem[key] = safeItem[key].replace(/'/g, "''").replace(/;/g, '');
      }
    });
    
    return safeItem;
  });
}

// Fungsi untuk membuat backup data toko
export async function backupStoreData(storeId, includeUsers = false) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      id: true,
      name: true,
      code: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!store) {
    throw new Error('Store not found');
  }

  // Bangun query backup berdasarkan struktur Prisma schema
  const backupData = {
    store: store,
    categories: await prisma.category.findMany({
      where: { storeId },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    products: await prisma.product.findMany({
      where: { storeId },
      select: {
        id: true,
        name: true,
        productCode: true,
        stock: true,
        purchasePrice: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        categoryId: true,
        supplierId: true
      }
    }),
    suppliers: await prisma.supplier.findMany({
      where: { storeId },
      select: {
        id: true,
        code: true,
        name: true,
        contactPerson: true,
        address: true,
        phone: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    members: await prisma.member.findMany({
      where: { storeId },
      select: {
        id: true,
        code: true,
        name: true,
        phone: true,
        address: true,
        membershipType: true,
        discount: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    sales: await prisma.sale.findMany({
      where: { storeId },
      select: {
        id: true,
        invoiceNumber: true,
        cashierId: true,
        attendantId: true,
        memberId: true,
        date: true,
        total: true,
        discount: true,
        additionalDiscount: true,
        tax: true,
        payment: true,
        change: true,
        status: true,
        createdAt: true,
        paymentMethod: true,
        referenceNumber: true,
        saleDetails: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            price: true,
            discount: true,
            subtotal: true
          }
        }
      }
    }),
    purchases: await prisma.purchase.findMany({
      where: { storeId },
      select: {
        id: true,
        supplierId: true,
        userId: true,
        purchaseDate: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            purchasePrice: true,
            subtotal: true
          }
        }
      }
    }),
    expenses: await prisma.expense.findMany({
      where: { storeId },
      select: {
        id: true,
        expenseCategoryId: true,
        amount: true,
        description: true,
        date: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    expenseCategories: await prisma.expenseCategory.findMany({
      where: { storeId },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    settings: await prisma.setting.findUnique({
      where: { storeId },
      select: {
        id: true,
        shopName: true,
        address: true,
        phone: true,
        themeColor: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    auditLogs: await prisma.auditLog.findMany({
      where: { storeId },
      select: {
        id: true,
        userId: true,
        action: true,
        entity: true,
        entityId: true,
        oldValue: true,
        newValue: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true
      }
    }),
    tempCarts: await prisma.tempCart.findMany({
      where: { storeId },
      select: {
        id: true,
        attendantId: true,
        productId: true,
        quantity: true,
        createdAt: true
      }
    })
  };

  // Tambahkan data pengguna jika diminta dan pengguna adalah MANAGER
  if (includeUsers) {
    const storeUsers = await prisma.storeUser.findMany({
      where: { storeId },
      select: {
        id: true,
        userId: true,
        role: true,
        status: true,
        assignedAt: true,
        assignedBy: true
      }
    });

    const userIds = storeUsers.map(su => su.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        username: true,
        employeeNumber: true,
        code: true,
        gender: true,
        address: true,
        phone: true,
        status: true,
        role: true,
        createdAt: true,
        updatedAt: true
        // Jangan sertakan kolom password dalam backup
      }
    });

    backupData.users = users;
    backupData.storeUsers = storeUsers;
  } else {
    // Tetap masukkan user yang terkait dengan toko untuk referensi
    const storeUsers = await prisma.storeUser.findMany({
      where: { storeId },
      select: {
        id: true,
        userId: true,
        role: true,
        status: true,
        assignedAt: true,
        assignedBy: true
      }
    });
    
    // Ambil hanya informasi dasar user tanpa password
    const userIds = storeUsers.map(su => su.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        username: true,
        employeeNumber: true,
        code: true,
        gender: true,
        address: true,
        phone: true,
        status: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    backupData.users = users;
    backupData.storeUsers = storeUsers;
  }

  // Tambahkan informasi backup
  backupData.backupInfo = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    storeId: storeId
  };

  return backupData;
}

// Fungsi untuk memvalidasi backup sebelum restore
export function validateBackupData(backupData) {
  if (!backupData || typeof backupData !== 'object') {
    throw new Error('Invalid backup data format');
  }

  if (!backupData.store || !backupData.store.id) {
    throw new Error('Backup data missing store information');
  }

  // Validasi struktur backup
  const requiredFields = ['store', 'categories', 'products', 'suppliers', 'members'];
  for (const field of requiredFields) {
    if (!(field in backupData)) {
      throw new Error(`Backup data missing required field: ${field}`);
    }
  }

  return true;
}