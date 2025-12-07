// lib/notificationManager.js
import prisma from './prisma';
import { logAudit, AUDIT_ACTIONS } from './auditLogger';

// Enum untuk jenis notifikasi
export const NOTIFICATION_TYPES = {
  LOW_STOCK: 'LOW_STOCK',
  HIGH_VALUE_TRANSACTION: 'HIGH_VALUE_TRANSACTION',
  SECURITY_ALERT: 'SECURITY_ALERT',
  SYSTEM_ALERT: 'SYSTEM_ALERT',
  USER_LOGIN: 'USER_LOGIN',
  FAILED_LOGIN: 'FAILED_LOGIN',
  DATA_BACKUP: 'DATA_BACKUP',
  SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE',
};

// Enum untuk tingkat keparahan
export const SEVERITY_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

class NotificationManager {
  constructor() {
    this.defaultThresholds = {
      lowStock: 5, // Stok di bawah 5 akan memicu notifikasi
      highValueTransaction: 1000000, // Transaksi di atas 1 juta
      failedLoginAttempts: 3, // Setelah 3 kali gagal
    };
  }

  // Membuat notifikasi baru
  async createNotification({
    type,
    title,
    message,
    userId = null,
    storeId = null,
    severity = SEVERITY_LEVELS.MEDIUM,
    data = null,
    acknowledged = false,
    expiresAt = null,
  }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          type,
          title,
          message,
          userId,
          storeId,
          severity,
          data: data ? JSON.stringify(data) : null,
          acknowledged,
          expiresAt: expiresAt || null,
        },
      });

      // Log aktivitas notifikasi
      await logAudit({
        userId: userId || null,
        action: AUDIT_ACTIONS.SETTINGS_UPDATE, // Gunakan action yang sesuai
        tableName: 'notifications',
        recordId: notification.id,
        newValue: { type, title, message },
        storeId,
        additionalData: { severity, notificationId: notification.id }
      });

      // Di sini bisa ditambahkan pengiriman notifikasi ke pengguna (email, push notification, dll)
      await this.sendNotificationToUser(notification);

      return notification;
    } catch (error) {
      console.error('Gagal membuat notifikasi:', error);
      
      // Log error ke audit
      await logAudit({
        userId,
        action: AUDIT_ACTIONS.SECURITY_ALERT,
        tableName: 'notifications',
        additionalData: { 
          type: 'notification_error', 
          error: error.message,
          notificationData: { type, title, message }
        },
        storeId
      });

      throw error;
    }
  }

  // Mengirim notifikasi ke pengguna (simulasi)
  async sendNotificationToUser(notification) {
    // Di sini bisa diimplementasikan pengiriman melalui:
    // - Email
    // - Push notification
    // - SMS
    // - WebSocket
    
    console.log(`Notifikasi dikirim: ${notification.title} - ${notification.message}`);
    
    // Contoh implementasi sederhana untuk email (akan menggunakan layanan email)
    if (process.env.SMTP_HOST && notification.userId) {
      try {
        // Di sini bisa diintegrasikan dengan layanan email seperti:
        // - Nodemailer
        // - SendGrid
        // - AWS SES
        // - dll
        console.log(`Email notifikasi dikirim ke pengguna: ${notification.userId}`);
      } catch (emailError) {
        console.error('Gagal kirim email notifikasi:', emailError);
      }
    }
  }

  // Mendapatkan notifikasi untuk pengguna tertentu
  async getUserNotifications(userId, filters = {}, pagination = { page: 1, limit: 20 }) {
    const { page, limit } = pagination;
    const { type, severity, acknowledged = null } = filters;

    try {
      const whereClause = {
        userId,
        ...(type && { type }),
        ...(severity && { severity }),
        ...(acknowledged !== null && { acknowledged }),
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      };

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.notification.count({ where: whereClause })
      ]);

      return {
        notifications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Gagal mengambil notifikasi pengguna:', error);
      throw error;
    }
  }

  // Mendapatkan notifikasi untuk toko tertentu
  async getStoreNotifications(storeId, filters = {}, pagination = { page: 1, limit: 20 }) {
    const { page, limit } = pagination;
    const { type, severity, acknowledged = null } = filters;

    try {
      const whereClause = {
        storeId,
        OR: [
          { userId: null }, // Notifikasi global toko
          { userId: { not: null } } // Notifikasi spesifik pengguna
        ],
        ...(type && { type }),
        ...(severity && { severity }),
        ...(acknowledged !== null && { acknowledged }),
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      };

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.notification.count({ where: whereClause })
      ]);

      return {
        notifications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Gagal mengambil notifikasi toko:', error);
      throw error;
    }
  }

  // Menandai notifikasi sebagai telah dibaca
  async acknowledgeNotification(notificationId, userId) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
      });

      if (!notification) {
        throw new Error('Notifikasi tidak ditemukan');
      }

      // Pastikan hanya pengguna yang berhak yang bisa mengakui notifikasi
      if (notification.userId && notification.userId !== userId) {
        throw new Error('Tidak memiliki akses untuk mengakui notifikasi ini');
      }

      const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: { acknowledged: true, acknowledgedAt: new Date() }
      });

      // Log aktivitas pengakuan notifikasi
      await logAudit({
        userId,
        action: 'NOTIFICATION_ACKNOWLEDGED',
        tableName: 'notifications',
        recordId: notificationId,
        newValue: { acknowledged: true },
        storeId: notification.storeId,
        additionalData: { notificationTitle: notification.title }
      });

      return updatedNotification;
    } catch (error) {
      console.error('Gagal mengakui notifikasi:', error);
      throw error;
    }
  }

  // Mendapatkan jumlah notifikasi belum dibaca
  async getUnreadNotificationCount(userId) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          acknowledged: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        }
      });

      return count;
    } catch (error) {
      console.error('Gagal menghitung notifikasi belum dibaca:', error);
      return 0;
    }
  }

  // Fungsi untuk mengecek dan membuat notifikasi stok rendah
  async checkLowStockNotifications(storeId, userId = null) {
    try {
      const lowStockThreshold = process.env.LOW_STOCK_THRESHOLD || this.defaultThresholds.lowStock;

      const lowStockProducts = await prisma.product.findMany({
        where: {
          storeId,
          stock: { lte: parseInt(lowStockThreshold) },
          stock: { gt: 0 }, // Hanya produk yang stoknya habis
        }
      });

      for (const product of lowStockProducts) {
        await this.createNotification({
          type: NOTIFICATION_TYPES.LOW_STOCK,
          title: `Stok Rendah: ${product.name}`,
          message: `Produk ${product.name} stoknya tinggal ${product.stock} unit. Segera lakukan pemesanan ulang.`,
          userId,
          storeId,
          severity: SEVERITY_LEVELS.MEDIUM,
          data: {
            productId: product.id,
            productName: product.name,
            currentStock: product.stock,
            threshold: lowStockThreshold,
          }
        });
      }

      return { success: true, lowStockItems: lowStockProducts.length };
    } catch (error) {
      console.error('Gagal cek notifikasi stok rendah:', error);
      return { success: false, error: error.message };
    }
  }

  // Fungsi untuk mengecek dan membuat notifikasi transaksi bernilai tinggi
  async checkHighValueTransactionNotifications(transaction, userId) {
    try {
      const highValueThreshold = process.env.HIGH_VALUE_THRESHOLD || this.defaultThresholds.highValueTransaction;

      if (transaction.total >= parseInt(highValueThreshold)) {
        await this.createNotification({
          type: NOTIFICATION_TYPES.HIGH_VALUE_TRANSACTION,
          title: `Transaksi Bernilai Tinggi`,
          message: `Transaksi baru dengan total Rp ${transaction.total.toLocaleString('id-ID')} telah dibuat oleh ${userId}.`,
          userId: null, // Notifikasi global untuk manajer
          storeId: transaction.storeId,
          severity: SEVERITY_LEVELS.HIGH,
          data: {
            transactionId: transaction.id,
            total: transaction.total,
            userId: userId,
            timestamp: transaction.createdAt,
          }
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Gagal cek notifikasi transaksi bernilai tinggi:', error);
      return { success: false, error: error.message };
    }
  }

  // Fungsi untuk membuat notifikasi login gagal berulang
  async createFailedLoginNotification(ipAddress, username, attemptCount) {
    try {
      const severity = attemptCount >= 5 ? SEVERITY_LEVELS.CRITICAL : SEVERITY_LEVELS.HIGH;

      await this.createNotification({
        type: NOTIFICATION_TYPES.FAILED_LOGIN,
        title: `Percobaan Login Gagal Berulang`,
        message: `Terdeteksi ${attemptCount} kali percobaan login gagal untuk username "${username}" dari IP ${ipAddress}.`,
        storeId: null, // Notifikasi global
        severity: severity,
        data: {
          ipAddress,
          username,
          attemptCount,
          timestamp: new Date().toISOString(),
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Gagal buat notifikasi login gagal:', error);
      return { success: false, error: error.message };
    }
  }

  // Fungsi untuk membuat notifikasi keamanan
  async createSecurityAlert(alertData) {
    try {
      await this.createNotification({
        type: NOTIFICATION_TYPES.SECURITY_ALERT,
        title: alertData.title || 'Peringatan Keamanan',
        message: alertData.message || 'Terdeteksi aktivitas mencurigakan',
        storeId: alertData.storeId || null,
        severity: alertData.severity || SEVERITY_LEVELS.HIGH,
        data: alertData.data || {},
      });

      return { success: true };
    } catch (error) {
      console.error('Gagal buat notifikasi keamanan:', error);
      return { success: false, error: error.message };
    }
  }

  // Membersihkan notifikasi lama
  async cleanupOldNotifications(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const deletedCount = await prisma.notification.deleteMany({
        where: {
          OR: [
            { 
              createdAt: { lt: cutoffDate },
              acknowledged: true // Hanya hapus yang sudah diakui
            },
            {
              expiresAt: { lt: new Date() } // Atau yang sudah kadaluarsa
            }
          ]
        }
      });

      console.log(`Membersihkan ${deletedCount.count} notifikasi lama`);
      return deletedCount.count;
    } catch (error) {
      console.error('Gagal membersihkan notifikasi lama:', error);
      throw error;
    }
  }

  // Fungsi untuk mengirim notifikasi sistem
  async sendSystemAlert(message, severity = SEVERITY_LEVELS.MEDIUM) {
    try {
      await this.createNotification({
        type: NOTIFICATION_TYPES.SYSTEM_ALERT,
        title: 'Peringatan Sistem',
        message: message,
        severity: severity,
        storeId: null, // Notifikasi global
      });

      return { success: true };
    } catch (error) {
      console.error('Gagal kirim alert sistem:', error);
      return { success: false, error: error.message };
    }
  }
}

// Membuat instance notification manager
export const notificationManager = new NotificationManager();

// Fungsi helper untuk integrasi dengan API
export async function handleNotificationRequest(req, session) {
  const { type, title, message, severity, data } = req.body;

  try {
    const notification = await notificationManager.createNotification({
      type,
      title,
      message,
      userId: session.user.id,
      storeId: session.user.storeId,
      severity,
      data,
    });

    return { success: true, notification };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export default notificationManager;