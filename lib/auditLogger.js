import prisma from '@/lib/prisma';

/**
 * Mencatat aktivitas penting ke dalam audit log
 * @param {Object} params - Parameter untuk mencatat audit log
 * @param {string} params.storeId - ID toko terkait (gunakan WAREHOUSE_STORE_ID untuk operasi gudang)
 * @param {string} [params.userId] - ID user yang melakukan aksi
 * @param {string} params.action - Aksi yang dilakukan (CREATE, UPDATE, DELETE, etc)
 * @param {string} params.entity - Entitas yang terlibat (STORE, USER, PRODUCT, etc)
 * @param {string} [params.entityId] - ID entitas yang terlibat
 * @param {Object} [params.oldValue] - Nilai sebelum perubahan
 * @param {Object} [params.newValue] - Nilai setelah perubahan
 * @param {string} [params.ipAddress] - Alamat IP dari pengguna
 * @param {string} [params.userAgent] - User agent dari pengguna
 */
export async function logActivity({
  storeId,
  userId,
  action,
  entity,
  entityId,
  oldValue,
  newValue,
  ipAddress,
  userAgent
}) {
  try {
    await prisma.auditLog.create({
      data: {
        storeId,
        userId: userId || null,
        action,
        entity,
        entityId: entityId || null,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Jangan memunculkan error ke pengguna jika audit log gagal
  }
}

/**
 * Mencatat aktivitas pembuatan toko
 * @param {string} userId - ID user yang membuat toko
 * @param {Object} storeData - Data toko yang dibuat
 * @param {string} ipAddress - Alamat IP
 * @param {string} userAgent - User agent
 */
export async function logStoreCreation(userId, storeData, ipAddress, userAgent) {
  await logActivity({
    storeId: storeData.id, // ID toko yang baru dibuat
    userId,
    action: 'CREATE',
    entity: 'STORE',
    entityId: storeData.id,
    newValue: storeData,
    ipAddress,
    userAgent
  });
}

/**
 * Mencatat aktivitas pembaruan toko
 * @param {string} userId - ID user yang memperbarui toko
 * @param {string} storeId - ID toko yang diperbarui
 * @param {Object} oldStoreData - Data toko sebelum perubahan
 * @param {Object} newStoreData - Data toko setelah perubahan
 * @param {string} ipAddress - Alamat IP
 * @param {string} userAgent - User agent
 */
export async function logStoreUpdate(userId, storeId, oldStoreData, newStoreData, ipAddress, userAgent) {
  await logActivity({
    storeId,
    userId,
    action: 'UPDATE',
    entity: 'STORE',
    entityId: storeId,
    oldValue: oldStoreData,
    newValue: newStoreData,
    ipAddress,
    userAgent
  });
}

/**
 * Mencatat aktivitas penghapusan/nonaktifasi toko
 * @param {string} userId - ID user yang menonaktifkan toko
 * @param {Object} storeData - Data toko yang dinonaktifkan
 * @param {string} ipAddress - Alamat IP
 * @param {string} userAgent - User agent
 */
export async function logStoreDeactivation(userId, storeData, ipAddress, userAgent) {
  await logActivity({
    storeId: storeData.id,
    userId,
    action: 'DEACTIVATE',
    entity: 'STORE',
    entityId: storeData.id,
    oldValue: storeData,
    newValue: { ...storeData, status: 'INACTIVE' },
    ipAddress,
    userAgent
  });
}

/**
 * Mencatat aktivitas pembuatan user
 * @param {string} userId - ID user yang membuat user baru
 * @param {Object} userData - Data user yang dibuat
 * @param {string} storeId - ID toko terkait
 * @param {string} ipAddress - Alamat IP
 * @param {string} userAgent - User agent
 */
export async function logUserCreation(creatingUserId, userData, storeId, ipAddress, userAgent) {
  await logActivity({
    storeId,
    userId: creatingUserId,
    action: 'CREATE',
    entity: 'USER',
    entityId: userData.id,
    newValue: userData,
    ipAddress,
    userAgent
  });
}

/**
 * Mencatat aktivitas transfer user
 * @param {string} userId - ID user yang melakukan transfer
 * @param {string} targetUserId - ID user yang ditransfer
 * @param {string} fromStoreId - ID toko asal
 * @param {string} toStoreId - ID toko tujuan
 * @param {string} role - Role baru setelah transfer
 * @param {string} ipAddress - Alamat IP
 * @param {string} userAgent - User agent
 */
export async function logUserTransfer(userId, targetUserId, fromStoreId, toStoreId, role, ipAddress, userAgent) {
  await logActivity({
    storeId: toStoreId,
    userId,
    action: 'TRANSFER',
    entity: 'USER',
    entityId: targetUserId,
    oldValue: { storeId: fromStoreId },
    newValue: { storeId: toStoreId, role },
    ipAddress,
    userAgent
  });
}

/**
 * Mencatat aktivitas penghapusan user
 * @param {string} userId - ID user yang menghapus
 * @param {Object} userData - Data user yang dihapus
 * @param {string} storeId - ID toko terkait
 * @param {string} ipAddress - Alamat IP
 * @param {string} userAgent - User agent
 */
export async function logUserDeletion(userId, userData, storeId, ipAddress, userAgent) {
  await logActivity({
    storeId,
    userId,
    action: 'DELETE',
    entity: 'USER',
    entityId: userData.id,
    oldValue: userData,
    newValue: { ...userData, status: 'TIDAK_AKTIF' },
    ipAddress,
    userAgent
  });
}

/**
 * Mencatat aktivitas pembuatan produk
 * @param {string} userId - ID user yang membuat produk
 * @param {Object} productData - Data produk yang dibuat
 * @param {string} storeId - ID toko terkait
 * @param {string} ipAddress - Alamat IP
 * @param {string} userAgent - User agent
 */
export async function logProductCreation(userId, productData, storeId, ipAddress, userAgent) {
  await logActivity({
    storeId,
    userId,
    action: 'CREATE',
    entity: 'PRODUCT',
    entityId: productData.id,
    newValue: productData,
    ipAddress,
    userAgent
  });
}

/**
 * Mencatat aktivitas pembaruan produk
 * @param {string} userId - ID user yang memperbarui produk
 * @param {Object} oldProductData - Data produk sebelum perubahan
 * @param {Object} newProductData - Data produk setelah perubahan
 * @param {string} storeId - ID toko terkait
 * @param {string} ipAddress - Alamat IP
 * @param {string} userAgent - User agent
 */
export async function logProductUpdate(userId, oldProductData, newProductData, storeId, ipAddress, userAgent) {
  await logActivity({
    storeId,
    userId,
    action: 'UPDATE',
    entity: 'PRODUCT',
    entityId: oldProductData.id,
    oldValue: oldProductData,
    newValue: newProductData,
    ipAddress,
    userAgent
  });
}

/**
 * Mencatat aktivitas penghapusan produk
 * @param {string} userId - ID user yang menghapus produk
 * @param {Object} productData - Data produk yang dihapus
 * @param {string} storeId - ID toko terkait
 * @param {string} ipAddress - Alamat IP
 * @param {string} userAgent - User agent
 */
export async function logProductDeletion(userId, productData, storeId, ipAddress, userAgent) {
  await logActivity({
    storeId,
    userId,
    action: 'DELETE',
    entity: 'PRODUCT',
    entityId: productData.id,
    oldValue: productData,
    newValue: { ...productData, isActive: false },
    ipAddress,
    userAgent
  });
}