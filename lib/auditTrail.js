import prisma from '@/lib/prisma';

/**
 * Fungsi untuk mencatat aktivitas pengguna dalam sistem
 * @param {string} userId - ID pengguna yang melakukan aktivitas
 * @param {string} action - Jenis tindakan (CREATE, UPDATE, DELETE, etc.)
 * @param {string} entity - Entitas yang terlibat (STORE, USER, PRODUCT, etc.)
 * @param {string} entityId - ID entitas yang terlibat
 * @param {string} description - Deskripsi aktivitas
 * @param {object} oldValue - Nilai sebelum perubahan (jika ada)
 * @param {object} newValue - Nilai setelah perubahan (jika ada)
 * @param {string} storeId - ID toko (jika relevan)
 * @returns {Promise<object>} - Log aktivitas yang dibuat
 */
export async function logActivity(userId, action, entity, entityId, description, oldValue = null, newValue = null, storeId = null) {
  try {
    const activityLog = await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        additionalData: { description },
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        ...(storeId && { storeId }), // Hanya sertakan storeId jika nilainya tidak null
      },
    });

    return activityLog;
  } catch (error) {
    console.error('Error logging activity:', error);
    throw new Error('Gagal mencatat aktivitas: ' + error.message);
  }
}

/**
 * Fungsi untuk mencatat aktivitas pengguna dalam sistem dengan informasi tambahan
 * @param {object} params - Parameter untuk mencatat aktivitas
 * @param {string} params.userId - ID pengguna yang melakukan aktivitas
 * @param {string} params.action - Jenis tindakan (CREATE, UPDATE, DELETE, etc.)
 * @param {string} params.entity - Entitas yang terlibat (STORE, USER, PRODUCT, etc.)
 * @param {string} params.entityId - ID entitas yang terlibat
 * @param {string} params.description - Deskripsi aktivitas
 * @param {object} params.oldValue - Nilai sebelum perubahan (jika ada)
 * @param {object} params.newValue - Nilai setelah perubahan (jika ada)
 * @param {string} params.storeId - ID toko (jika relevan)
 * @param {string} params.ipAddress - Alamat IP pengguna (jika tersedia)
 * @param {string} params.userAgent - User agent pengguna (jika tersedia)
 * @returns {Promise<object>} - Log aktivitas yang dibuat
 */
export async function logActivityWithDetails({
  userId,
  action,
  entity,
  entityId,
  description,
  oldValue = null,
  newValue = null,
  storeId = null,
  ipAddress = null,
  userAgent = null
}) {
  try {
    const activityLog = await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        additionalData: { description },
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        ...(storeId && { storeId }), // Hanya sertakan storeId jika nilainya tidak null
        ipAddress,
        userAgent,
      },
    });

    return activityLog;
  } catch (error) {
    console.error('Error logging activity with details:', error);
    throw new Error('Gagal mencatat aktivitas: ' + error.message);
  }
}

/**
 * Fungsi untuk mendapatkan log aktivitas berdasarkan filter
 * @param {object} filters - Filter untuk pencarian log
 * @param {string} filters.userId - Filter berdasarkan ID pengguna
 * @param {string} filters.action - Filter berdasarkan tindakan
 * @param {string} filters.entity - Filter berdasarkan entitas
 * @param {string} filters.storeId - Filter berdasarkan ID toko
 * @param {Date} filters.startDate - Filter berdasarkan tanggal mulai
 * @param {Date} filters.endDate - Filter berdasarkan tanggal akhir
 * @param {number} page - Halaman hasil (default: 1)
 * @param {number} limit - Jumlah hasil per halaman (default: 10)
 * @returns {Promise<{logs: Array, total: number, page: number, totalPages: number}>} - Data log aktivitas
 */
export async function getActivityLogs(filters = {}, page = 1, limit = 10) {
  try {
    const whereClause = {};
    
    if (filters.userId) whereClause.userId = filters.userId;
    if (filters.action) whereClause.action = filters.action;
    if (filters.entity) whereClause.entity = filters.entity;
    if (filters.storeId) whereClause.storeId = filters.storeId;
    
    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) whereClause.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) whereClause.createdAt.lte = new Date(filters.endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              role: true
            }
          },
          store: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where: whereClause })
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw new Error('Gagal mengambil log aktivitas: ' + error.message);
  }
}

/**
 * Fungsi untuk membuat deskripsi aktivitas yang lebih user-friendly
 * @param {string} action - Jenis tindakan
 * @param {string} entity - Entitas yang terlibat
 * @param {object} newValue - Nilai baru (jika ada)
 * @param {object} oldValue - Nilai lama (jika ada)
 * @param {string} entityName - Nama entitas (jika tersedia)
 * @returns {string} - Deskripsi aktivitas
 */
export function getFriendlyActivityDescription(action, entity, newValue, oldValue, entityName = null) {
  // Ambil nama dari newValue jika entityName tidak disediakan
  let itemName = entityName;
  if (!itemName) {
    if (newValue && newValue.name) {
      itemName = newValue.name;
    } else if (oldValue && oldValue.name) {
      itemName = oldValue.name;
    }
  }

  // Jika nama tetap tidak ditemukan, gunakan ID atau tipe entitas
  const displayName = itemName || (newValue?.id ? `ID ${newValue.id}` : (oldValue?.id ? `ID ${oldValue.id}` : entity.toLowerCase()));

  const actionLabels = {
    'CREATE': 'Dibuat',
    'UPDATE': 'Diperbarui',
    'DELETE': 'Dihapus',
    'DEACTIVATE': 'Dinonaktifkan',
    'TRANSFER': 'Ditransfer',
    'LOGIN': 'Login',
    'LOGOUT': 'Logout'
  };

  const entityLabels = {
    'STORE': 'Toko',
    'USER': 'Pengguna',
    'PRODUCT': 'Produk',
    'SALE': 'Penjualan',
    'EXPENSE': 'Pengeluaran',
    'WAREHOUSE': 'Gudang',
    'DISTRIBUTION': 'Distribusi'
  };

  // Deskripsi berdasarkan action dan entity
  const actionLabel = actionLabels[action] || action;
  const entityLabel = entityLabels[entity] || entity;

  // Buat deskripsi berdasarkan kombinasi action dan entity
  switch(action) {
    case 'CREATE':
      switch(entity) {
        case 'STORE':
          return `Toko "${displayName}" dibuat`;
        case 'USER':
          return `Pengguna "${displayName}" ditambahkan`;
        case 'PRODUCT':
          return `Produk "${displayName}" ditambahkan`;
        case 'WAREHOUSE':
          return `Gudang "${displayName}" dibuat`;
        default:
          return `${actionLabel} ${entityLabel.toLowerCase()} ${displayName}`;
      }
    case 'UPDATE':
      switch(entity) {
        case 'STORE':
          return `Data toko "${displayName}" diperbarui`;
        case 'USER':
          return `Data pengguna "${displayName}" diperbarui`;
        case 'PRODUCT':
          return `Data produk "${displayName}" diperbarui`;
        case 'WAREHOUSE':
          return `Data gudang "${displayName}" diperbarui`;
        default:
          return `${actionLabel} ${entityLabel.toLowerCase()} ${displayName}`;
      }
    case 'DELETE':
      switch(entity) {
        case 'USER':
          return `Pengguna "${displayName}" dinonaktifkan`;
        case 'PRODUCT':
          return `Produk "${displayName}" dihapus`;
        case 'WAREHOUSE':
          return `Gudang "${displayName}" dihapus`;
        default:
          return `${actionLabel} ${entityLabel.toLowerCase()} ${displayName}`;
      }
    case 'DEACTIVATE':
      switch(entity) {
        case 'STORE':
          return `Toko "${displayName}" dinonaktifkan`;
        case 'USER':
          return `Pengguna "${displayName}" dinonaktifkan`;
        default:
          return `${actionLabel} ${entityLabel.toLowerCase()} ${displayName}`;
      }
    case 'TRANSFER':
      switch(entity) {
        case 'USER':
          return `Pengguna "${displayName}" dipindahkan ke toko lain`;
        default:
          return `${actionLabel} ${entityLabel.toLowerCase()} ${displayName}`;
      }
    default:
      return `${actionLabel} ${entityLabel.toLowerCase()} ${displayName}`;
  }
}