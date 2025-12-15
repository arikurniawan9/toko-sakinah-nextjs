// lib/auditLogger.js
import prisma from './prisma';

// Enum untuk tipe aktivitas audit
export const AUDIT_ACTIONS = {
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  PRODUCT_CREATE: 'PRODUCT_CREATE',
  PRODUCT_UPDATE: 'PRODUCT_UPDATE',
  PRODUCT_DELETE: 'PRODUCT_DELETE',
  TRANSACTION_CREATE: 'TRANSACTION_CREATE',
  TRANSACTION_UPDATE: 'TRANSACTION_UPDATE',
  TRANSACTION_DELETE: 'TRANSACTION_DELETE',
  SETTINGS_UPDATE: 'SETTINGS_UPDATE',
  PERMISSION_CHANGED: 'PERMISSION_CHANGED',
  SECURITY_ALERT: 'SECURITY_ALERT',
  SALE_CREATE: 'SALE_CREATE',
  SALE_UPDATE: 'SALE_UPDATE',
  SALE_DELETE: 'SALE_DELETE',
  SUPPLIER_CREATE: 'SUPPLIER_CREATE',
  SUPPLIER_UPDATE: 'SUPPLIER_UPDATE',
  SUPPLIER_DELETE: 'SUPPLIER_DELETE',
  CATEGORY_CREATE: 'CATEGORY_CREATE',
  CATEGORY_UPDATE: 'CATEGORY_UPDATE',
  CATEGORY_DELETE: 'CATEGORY_DELETE',
  MEMBER_CREATE: 'MEMBER_CREATE',
  MEMBER_UPDATE: 'MEMBER_UPDATE',
  MEMBER_DELETE: 'MEMBER_DELETE',
  PURCHASE_CREATE: 'PURCHASE_CREATE',
  PURCHASE_UPDATE: 'PURCHASE_UPDATE',
  PURCHASE_DELETE: 'PURCHASE_DELETE',
  EXPENSE_CREATE: 'EXPENSE_CREATE',
  EXPENSE_UPDATE: 'EXPENSE_UPDATE',
  EXPENSE_DELETE: 'EXPENSE_DELETE',
  WAREHOUSE_DISTRIBUTION_CREATE: 'WAREHOUSE_DISTRIBUTION_CREATE',
  WAREHOUSE_DISTRIBUTION_UPDATE: 'WAREHOUSE_DISTRIBUTION_UPDATE',
  WAREHOUSE_DISTRIBUTION_DELETE: 'WAREHOUSE_DISTRIBUTION_DELETE',
  WAREHOUSE_STOCK_ADJUSTMENT: 'WAREHOUSE_STOCK_ADJUSTMENT',
  WAREHOUSE_PURCHASE: 'WAREHOUSE_PURCHASE',
};

// Fungsi helper untuk mencatat aktivitas audit
export async function logAudit({
  userId,
  action,
  tableName = null,
  recordId = null,
  oldValue = null,
  newValue = null,
  ipAddress = null,
  userAgent = null,
  storeId = null,
  additionalData = null,
}) {
  try {
    // Validasi action
    if (!Object.values(AUDIT_ACTIONS).includes(action)) {
      console.warn(`Audit action tidak valid: ${action}`);
      // Tetap lanjutkan logging tapi gunakan action generik
      action = 'UNKNOWN_ACTION';
    }

    // Batasi ukuran data yang disimpan
    const limitDataSize = (data, maxSize = 1000) => {
      if (!data) return null;
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      return str.length > maxSize ? str.substring(0, maxSize) + '...' : str;
    };

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        tableName,
        recordId,
        oldValue: oldValue ? limitDataSize(oldValue) : null,
        newValue: newValue ? limitDataSize(newValue) : null,
        ipAddress,
        userAgent,
        storeId,
        additionalData: additionalData ? limitDataSize(additionalData) : null,
      },
    });

    console.log(`Audit logged: ${action} by user ${userId} at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Gagal mencatat audit log:', error);
    // Jangan membatalkan operasi utama jika logging audit gagal
  }
}

// Fungsi untuk mendapatkan log audit
export async function getAuditLogs(filters = {}, pagination = { page: 1, limit: 50 }) {
  const { page, limit } = pagination;
  const { action, userId, storeId, startDate, endDate, tableName } = filters;

  try {
    const whereClause = {};
    
    if (action) whereClause.action = action;
    if (userId) whereClause.userId = userId;
    if (storeId) whereClause.storeId = storeId;
    if (tableName) whereClause.tableName = tableName;
    
    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) whereClause.timestamp.gte = new Date(startDate);
      if (endDate) whereClause.timestamp.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            }
          },
          store: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      }),
      prisma.auditLog.count({ where: whereClause })
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Gagal mengambil audit logs:', error);
    throw error;
  }
}

// Fungsi middleware untuk logging otomatis
export function withAuditLogging(action, tableName = null) {
  return async (handler) => {
    return async (req, ...args) => {
      const session = req.session || (req.nextauth && req.nextauth.token) || null;
      const userId = session?.user?.id || null;
      const storeId = session?.user?.storeId || null;
      
      // Ambil IP address
      const ipAddress = 
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        (req.headers['x-real-ip']) ||
        'unknown';
      
      const userAgent = req.headers['user-agent'] || 'unknown';

      try {
        const result = await handler(req, ...args);
        
        // Log aktivitas jika berhasil
        if (result && result.status >= 200 && result.status < 300) {
          await logAudit({
            userId,
            action,
            tableName,
            ipAddress,
            userAgent,
            storeId,
            newValue: req.body || null,
          });
        }
        
        return result;
      } catch (error) {
        // Log security alert jika terjadi error
        await logAudit({
          userId,
          action: AUDIT_ACTIONS.SECURITY_ALERT,
          tableName,
          ipAddress,
          userAgent,
          storeId,
          additionalData: {
            error: error.message,
            actionAttempted: action,
          },
        });
        
        throw error;
      }
    };
  };
}

// Fungsi untuk membersihkan log audit lama (retensi data)
export async function cleanupAuditLogs(retentionDays = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  try {
    const deletedCount = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`Membersihkan ${deletedCount.count} audit log yang lebih lama dari ${retentionDays} hari`);
    return deletedCount.count;
  } catch (error) {
    console.error('Gagal membersihkan audit logs:', error);
    throw error;
  }
}

// Fungsi untuk mencatat pembuatan produk
export async function logProductCreation(userId, product, storeId, ipAddress, userAgent) {
  await logAudit({
    userId,
    action: AUDIT_ACTIONS.PRODUCT_CREATE,
    tableName: 'Product',
    recordId: product.id,
    newValue: {
      name: product.name,
      productCode: product.productCode,
      stock: product.stock,
      purchasePrice: product.purchasePrice,
      description: product.description,
    },
    ipAddress,
    userAgent,
    storeId,
  });
}

// Fungsi untuk mencatat pembaruan produk
export async function logProductUpdate(userId, oldProduct, newProduct, storeId, ipAddress, userAgent) {
  const oldValue = {
    name: oldProduct.name,
    productCode: oldProduct.productCode,
    stock: oldProduct.stock,
    purchasePrice: oldProduct.purchasePrice,
    description: oldProduct.description,
  };

  const newValue = {
    name: newProduct.name,
    productCode: newProduct.productCode,
    stock: newProduct.stock,
    purchasePrice: newProduct.purchasePrice,
    description: newProduct.description,
  };

  await logAudit({
    userId,
    action: AUDIT_ACTIONS.PRODUCT_UPDATE,
    tableName: 'Product',
    recordId: newProduct.id,
    oldValue,
    newValue,
    ipAddress,
    userAgent,
    storeId,
  });
}

// Fungsi untuk mencatat penghapusan produk
export async function logProductDeletion(userId, product, storeId, ipAddress, userAgent) {
  await logAudit({
    userId,
    action: AUDIT_ACTIONS.PRODUCT_DELETE,
    tableName: 'Product',
    recordId: product.id,
    oldValue: {
      name: product.name,
      productCode: product.productCode,
      stock: product.stock,
      purchasePrice: product.purchasePrice,
      description: product.description,
    },
    ipAddress,
    userAgent,
    storeId,
  });
}

// Fungsi untuk mencatat pembuatan transaksi
export async function logSaleCreation(userId, sale, storeId, ipAddress, userAgent) {
  await logAudit({
    userId,
    action: AUDIT_ACTIONS.SALE_CREATE,
    tableName: 'Sale',
    recordId: sale.id,
    newValue: {
      invoiceNumber: sale.invoiceNumber,
      cashierId: sale.cashierId,
      total: sale.total,
      payment: sale.payment,
      paymentMethod: sale.paymentMethod,
    },
    ipAddress,
    userAgent,
    storeId,
  });
}

// Fungsi untuk mencatat pembuatan supplier
export async function logSupplierCreation(userId, supplier, storeId, ipAddress, userAgent) {
  await logAudit({
    userId,
    action: AUDIT_ACTIONS.SUPPLIER_CREATE,
    tableName: 'Supplier',
    recordId: supplier.id,
    newValue: {
      code: supplier.code,
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
    },
    ipAddress,
    userAgent,
    storeId,
  });
}

// Fungsi untuk mencatat pembuatan kategori
export async function logCategoryCreation(userId, category, storeId, ipAddress, userAgent) {
  await logAudit({
    userId,
    action: AUDIT_ACTIONS.CATEGORY_CREATE,
    tableName: 'Category',
    recordId: category.id,
    newValue: {
      name: category.name,
      description: category.description,
    },
    ipAddress,
    userAgent,
    storeId,
  });
}

// Fungsi untuk mencatat pembuatan member
export async function logMemberCreation(userId, member, storeId, ipAddress, userAgent) {
  await logAudit({
    userId,
    action: AUDIT_ACTIONS.MEMBER_CREATE,
    tableName: 'Member',
    recordId: member.id,
    newValue: {
      code: member.code,
      name: member.name,
      phone: member.phone,
      membershipType: member.membershipType,
      discount: member.discount,
    },
    ipAddress,
    userAgent,
    storeId,
  });
}

// Fungsi untuk mencatat pembuatan pembelian
export async function logPurchaseCreation(userId, purchase, storeId, ipAddress, userAgent) {
  await logAudit({
    userId,
    action: AUDIT_ACTIONS.PURCHASE_CREATE,
    tableName: 'Purchase',
    recordId: purchase.id,
    newValue: {
      supplierId: purchase.supplierId,
      totalAmount: purchase.totalAmount,
      status: purchase.status,
    },
    ipAddress,
    userAgent,
    storeId,
  });
}

// Fungsi untuk mencatat pembuatan pengeluaran
export async function logExpenseCreation(userId, expense, storeId, ipAddress, userAgent) {
  await logAudit({
    userId,
    action: AUDIT_ACTIONS.EXPENSE_CREATE,
    tableName: 'Expense',
    recordId: expense.id,
    newValue: {
      expenseCategoryId: expense.expenseCategoryId,
      amount: expense.amount,
      description: expense.description,
      date: expense.date,
    },
    ipAddress,
    userAgent,
    storeId,
  });
}

// Fungsi tambahan untuk audit yang mungkin digunakan di tempat lain
export async function logStoreCreation(userId, store, ipAddress, userAgent) {
  await logAudit({
    userId,
    action: AUDIT_ACTIONS.USER_CREATE, // menggunakan action yang sesuai
    tableName: 'Store',
    recordId: store.id,
    newValue: {
      name: store.name,
      code: store.code,
      description: store.description,
      address: store.address,
      phone: store.phone,
      email: store.email,
      status: store.status,
    },
    ipAddress,
    userAgent,
    storeId: store.id,
  });
}

export async function logStoreUpdate(userId, oldStore, newStore, ipAddress, userAgent) {
  await logAudit({
    userId,
    action: AUDIT_ACTIONS.USER_UPDATE, // menggunakan action yang sesuai
    tableName: 'Store',
    recordId: newStore.id,
    oldValue: {
      name: oldStore.name,
      code: oldStore.code,
      description: oldStore.description,
      address: oldStore.address,
      phone: oldStore.phone,
      email: oldStore.email,
      status: oldStore.status,
    },
    newValue: {
      name: newStore.name,
      code: newStore.code,
      description: newStore.description,
      address: newStore.address,
      phone: newStore.phone,
      email: newStore.email,
      status: newStore.status,
    },
    ipAddress,
    userAgent,
    storeId: newStore.id,
  });
}

export async function logStoreDeactivation(userId, store, ipAddress, userAgent) {
  await logAudit({
    userId,
    action: AUDIT_ACTIONS.USER_UPDATE, // menggunakan action yang sesuai
    tableName: 'Store',
    recordId: store.id,
    oldValue: { status: store.status },
    newValue: { status: 'INACTIVE' },
    ipAddress,
    userAgent,
    storeId: store.id,
  });
}

export async function logUserCreation(userId, user, ipAddress, userAgent, storeId) {
  await logAudit({
    userId,
    action: AUDIT_ACTIONS.USER_CREATE,
    tableName: 'User',
    recordId: user.id,
    newValue: {
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    ipAddress,
    userAgent,
    storeId,
  });
}

export async function logUserDeletion(userId, user, ipAddress, userAgent, storeId) {
  await logAudit({
    userId,
    action: AUDIT_ACTIONS.USER_DELETE,
    tableName: 'User',
    recordId: user.id,
    oldValue: {
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    ipAddress,
    userAgent,
    storeId,
  });
}

export async function logUserTransfer(userId, user, fromStoreId, toStoreId, ipAddress, userAgent) {
  await logAudit({
    userId,
    action: AUDIT_ACTIONS.USER_UPDATE,
    tableName: 'User',
    recordId: user.id,
    oldValue: { storeId: fromStoreId },
    newValue: { storeId: toStoreId },
    ipAddress,
    userAgent,
    storeId: toStoreId,
  });
}

export async function logCreate(userId, entityName, entityData, ipAddress, userAgent, storeId) {
  const actionMap = {
    'Product': AUDIT_ACTIONS.PRODUCT_CREATE,
    'Supplier': AUDIT_ACTIONS.SUPPLIER_CREATE,
    'Category': AUDIT_ACTIONS.CATEGORY_CREATE,
    'Member': AUDIT_ACTIONS.MEMBER_CREATE,
    'Sale': AUDIT_ACTIONS.SALE_CREATE,
    'Purchase': AUDIT_ACTIONS.PURCHASE_CREATE,
    'Expense': AUDIT_ACTIONS.EXPENSE_CREATE,
    'User': AUDIT_ACTIONS.USER_CREATE,
  };

  // Buat objek data yang disederhanakan untuk menghindari objek kompleks atau fungsi
  let simplifiedData = {};
  if (entityData && typeof entityData === 'object') {
    // Ambil hanya field-field penting untuk mencegah masalah serialisasi
    switch(entityName) {
      case 'Sale':
        simplifiedData = {
          id: entityData.id,
          invoiceNumber: entityData.invoiceNumber,
          cashierId: entityData.cashierId,
          attendantId: entityData.attendantId,
          memberId: entityData.memberId,
          total: entityData.total,
          discount: entityData.discount,
          additionalDiscount: entityData.additionalDiscount,
          tax: entityData.tax,
          payment: entityData.payment,
          change: entityData.change,
          status: entityData.status,
          paymentMethod: entityData.paymentMethod,
          referenceNumber: entityData.referenceNumber,
        };
        break;
      case 'Product':
        simplifiedData = {
          id: entityData.id,
          name: entityData.name,
          productCode: entityData.productCode,
          stock: entityData.stock,
          purchasePrice: entityData.purchasePrice,
          description: entityData.description,
        };
        break;
      case 'User':
        simplifiedData = {
          id: entityData.id,
          name: entityData.name,
          username: entityData.username,
          email: entityData.email,
          role: entityData.role,
          status: entityData.status,
        };
        break;
      default:
        // Untuk entitas lain, ambil field yang umum
        simplifiedData = {
          id: entityData.id,
          ...(entityData.name && { name: entityData.name }),
          ...(entityData.code && { code: entityData.code }),
          ...(entityData.email && { email: entityData.email }),
          ...(entityData.phone && { phone: entityData.phone }),
          ...(entityData.status && { status: entityData.status }),
        };
        break;
    }
  } else {
    simplifiedData = entityData;
  }

  await logAudit({
    userId,
    action: actionMap[entityName] || AUDIT_ACTIONS.USER_CREATE,
    tableName: entityName,
    recordId: simplifiedData.id || null,
    newValue: simplifiedData,
    ipAddress,
    userAgent,
    storeId,
  });
}

export async function logDelete(userId, entityName, entityData, ipAddress, userAgent, storeId) {
  const actionMap = {
    'Product': AUDIT_ACTIONS.PRODUCT_DELETE,
    'Supplier': AUDIT_ACTIONS.SUPPLIER_DELETE,
    'Category': AUDIT_ACTIONS.CATEGORY_DELETE,
    'Member': AUDIT_ACTIONS.MEMBER_DELETE,
    'Sale': AUDIT_ACTIONS.SALE_DELETE,
    'Purchase': AUDIT_ACTIONS.PURCHASE_DELETE,
    'Expense': AUDIT_ACTIONS.EXPENSE_DELETE,
    'User': AUDIT_ACTIONS.USER_DELETE,
  };

  await logAudit({
    userId,
    action: actionMap[entityName] || AUDIT_ACTIONS.USER_DELETE,
    tableName: entityName,
    recordId: entityData.id || null,
    oldValue: entityData,
    ipAddress,
    userAgent,
    storeId,
  });
}

// Fungsi untuk mencatat aktivitas distribusi gudang
export async function logWarehouseDistribution(userId, distributionData, ipAddress, userAgent, storeId) {
  await logAudit({
    userId,
    action: AUDIT_ACTIONS.WAREHOUSE_DISTRIBUTION_CREATE,
    tableName: 'WarehouseDistribution',
    recordId: distributionData.id,
    newValue: {
      warehouseId: distributionData.warehouseId,
      storeId: distributionData.storeId,
      productId: distributionData.productId,
      quantity: distributionData.quantity,
      unitPrice: distributionData.unitPrice,
      totalAmount: distributionData.totalAmount,
      status: distributionData.status,
      notes: distributionData.notes,
      distributedAt: distributionData.distributedAt,
      distributedBy: distributionData.distributedBy,
    },
    ipAddress,
    userAgent,
    storeId,
  });
}

// Fungsi untuk mencatat aktivitas pembelian gudung
export async function logWarehousePurchase(userId, purchaseData, ipAddress, userAgent, storeId) {
  await logAudit({
    userId,
    action: AUDIT_ACTIONS.WAREHOUSE_PURCHASE,
    tableName: 'WarehousePurchase',
    recordId: purchaseData.id,
    newValue: {
      warehouseId: purchaseData.warehouseId,
      supplierId: purchaseData.supplierId,
      totalAmount: purchaseData.totalAmount,
      status: purchaseData.status,
      purchasedAt: purchaseData.purchasedAt,
      purchasedBy: purchaseData.purchasedBy,
    },
    ipAddress,
    userAgent,
    storeId,
  });
}

// Fungsi untuk mencatat penyesuaian stok gudung
export async function logWarehouseStockAdjustment(userId, adjustmentData, ipAddress, userAgent, storeId) {
  await logAudit({
    userId,
    action: AUDIT_ACTIONS.WAREHOUSE_STOCK_ADJUSTMENT,
    tableName: 'WarehouseProduct',
    recordId: adjustmentData.id,
    newValue: {
      warehouseId: adjustmentData.warehouseId,
      productId: adjustmentData.productId,
      quantity: adjustmentData.quantity,
      adjustmentType: adjustmentData.adjustmentType,
      reason: adjustmentData.reason,
      adjustedAt: adjustmentData.adjustedAt,
      adjustedBy: adjustmentData.adjustedBy,
    },
    ipAddress,
    userAgent,
    storeId,
  });
}

// Fungsi untuk menghitung aktivitas mencurigakan
export async function getSecurityAlerts(sinceHours = 24) {
  const sinceDate = new Date();
  sinceDate.setHours(sinceDate.getHours() - sinceHours);

  try {
    const suspiciousActivities = await prisma.auditLog.findMany({
      where: {
        OR: [
          { action: AUDIT_ACTIONS.SECURITY_ALERT },
          { action: AUDIT_ACTIONS.USER_LOGIN, newValue: { contains: 'failed' } }, // Login gagal
        ],
        timestamp: { gte: sinceDate },
      },
      orderBy: { timestamp: 'desc' },
    });

    return suspiciousActivities;
  } catch (error) {
    console.error('Gagal mengambil alert keamanan:', error);
    throw error;
  }
}