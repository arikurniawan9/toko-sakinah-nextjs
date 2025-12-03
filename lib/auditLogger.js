import prisma from './prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './authOptions';

/**
 * Fungsi untuk mencatat aktivitas ke audit log
 * @param {string} userId - ID user yang melakukan aksi
 * @param {string} action - Tindakan yang dilakukan (CREATE, UPDATE, DELETE, LOGIN, dll)
 * @param {string} entity - Entitas yang dipengaruhi (User, Product, Sale, dll)
 * @param {string} entityId - ID entitas yang dipengaruhi
 * @param {object} oldValue - Data sebelum perubahan
 * @param {object} newValue - Data setelah perubahan
 * @param {object} req - Request object untuk mendapatkan IP dan user agent
 * @param {string} storeId - ID toko yang terkait dengan aktivitas
 */
export async function logAudit(
  userId,
  action,
  entity,
  entityId = null,
  oldValue = null,
  newValue = null,
  req = null,
  storeId = null
) {
  try {
    // Dapatkan IP address dari request
    let ipAddress = null;
    let userAgent = null;

    if (req) {
      // Ambil IP address dari berbagai kemungkinan header
      ipAddress =
        req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] ||
        req.headers['x-client-ip'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
        null;

      // Ambil user agent
      userAgent = req.headers['user-agent'] || null;
    }

    // Jika storeId tidak disediakan dari parameter, coba dapatkan dari session
    if (!storeId && req) {
      const session = await getServerSession(authOptions);
      if (session && session.user && session.user.storeId) {
        storeId = session.user.storeId;
      }
    }

    // Validasi storeId
    if (!storeId) {
      throw new Error('storeId is required for audit log');
    }

    // Buat entri log audit
    const auditLog = await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        ipAddress,
        userAgent,
        storeId,
      },
    });

    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Jangan biarkan error audit log menggagalkan operasi utama
    return null;
  }
}

/**
 * Fungsi untuk mencatat aktivitas login
 */
export async function logLogin(userId, req, additionalInfo = null, storeId = null) {
  return logAudit(userId, 'LOGIN', 'AUTH', null, null, additionalInfo, req, storeId);
}

/**
 * Fungsi untuk mencatat aktivitas logout
 */
export async function logLogout(userId, req, storeId = null) {
  return logAudit(userId, 'LOGOUT', 'AUTH', null, null, null, req, storeId);
}

/**
 * Fungsi untuk mencatat aktivitas pembuatan entitas
 */
export async function logCreate(userId, entity, entityId, newData, req, storeId = null) {
  return logAudit(userId, 'CREATE', entity, entityId, null, newData, req, storeId);
}

/**
 * Fungsi untuk mencatat aktivitas pembaruan entitas
 */
export async function logUpdate(userId, entity, entityId, oldValue, newValue, req, storeId = null) {
  return logAudit(userId, 'UPDATE', entity, entityId, oldValue, newValue, req, storeId);
}

/**
 * Fungsi untuk mencatat aktivitas penghapusan entitas
 */
export async function logDelete(userId, entity, entityId, deletedData, req, storeId = null) {
  return logAudit(userId, 'DELETE', entity, entityId, deletedData, null, req, storeId);
}

/**
 * Fungsi untuk mengambil log audit berdasarkan filter
 */
export async function getAuditLogs(filter = {}) {
  try {
    const {
      userId,
      action,
      entity,
      entityId,
      startDate,
      endDate,
      limit = 50,
      page = 1,
    } = filter;

    const where = {
      ...(userId && { userId }),
      ...(action && { action }),
      ...(entity && { entity }),
      ...(entityId && { entityId }),
      ...(startDate && { createdAt: { gte: new Date(startDate) } }),
      ...(endDate && { createdAt: { lte: new Date(endDate) } }),
    };

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
    });

    const total = await prisma.auditLog.count({ where });

    return {
      logs,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}