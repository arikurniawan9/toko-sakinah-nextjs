// lib/loginSecurity.js
import { Redis } from 'redis';

// Inisialisasi Redis connection
let redis;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL);
} else {
  // Untuk development, gunakan Map sederhana
  const inMemoryStore = new Map();
  redis = {
    get: async (key) => {
      const item = inMemoryStore.get(key);
      if (!item) return null;
      if (item.expire < Date.now()) {
        inMemoryStore.delete(key);
        return null;
      }
      return item.value;
    },
    set: async (key, value, seconds) => {
      inMemoryStore.set(key, {
        value,
        expire: Date.now() + (seconds * 1000)
      });
    },
    incr: async (key) => {
      const current = await redis.get(key);
      const newValue = current ? parseInt(current) + 1 : 1;
      await redis.set(key, newValue, 900); // 15 menit
      return newValue;
    },
    del: async (key) => {
      inMemoryStore.delete(key);
    },
    setEx: async (key, seconds, value) => {
      inMemoryStore.set(key, {
        value,
        expire: Date.now() + (seconds * 1000)
      });
    }
  };
}

// Konstanta konfigurasi
const CONFIG = {
  MAX_ATTEMPTS: 5, // Jumlah maksimal percobaan login
  LOCKOUT_DURATION: 15 * 60, // Durasi lockout dalam detik (15 menit)
  RESET_DURATION: 15 * 60, // Durasi reset attempt count dalam detik (15 menit)
};

// Fungsi untuk mengecek apakah identifier (username) terkena lockout
export async function isLockedOut(identifier) {
  // Cek apakah key masih dalam lockout
  const lockoutKey = `lockout:${identifier}`;
  const blockUntil = await redis.get(lockoutKey);

  if (blockUntil) {
    const now = Math.floor(Date.now() / 1000);
    if (now < parseInt(blockUntil)) {
      return true;
    } else {
      // Lockout sudah berakhir, hapus key
      await redis.del(lockoutKey);
    }
  }

  return false;
}

// Fungsi untuk mencatat percobaan login gagal
export async function recordFailedLoginAttempt(identifier) {
  // Cek apakah sudah dalam lockout
  if (await isLockedOut(identifier)) {
    return CONFIG.MAX_ATTEMPTS + 1; // Indikasi bahwa user masih dalam lockout
  }

  const attemptKey = `attempts:${identifier}`;
  const timeKey = `firstAttempt:${identifier}`;

  // Cek apakah sudah ada first attempt time
  const firstAttemptTime = await redis.get(timeKey);
  const currentTime = Math.floor(Date.now() / 1000);

  // Jika sudah lebih dari RESET_DURATION dari first attempt, reset
  if (firstAttemptTime && (currentTime - parseInt(firstAttemptTime)) > CONFIG.RESET_DURATION) {
    await resetLoginAttempts(identifier);
  }

  // Simpan first attempt time jika belum ada
  if (!firstAttemptTime) {
    await redis.set(timeKey, currentTime.toString(), CONFIG.RESET_DURATION);
  }

  // Tambahkan jumlah percobaan
  const attempts = await redis.incr(attemptKey);

  // Set expiration untuk jumlah percobaan
  await redis.setEx(attemptKey, CONFIG.RESET_DURATION, attempts.toString());

  // Jika melewati batas attempt, aktifkan lockout
  if (attempts >= CONFIG.MAX_ATTEMPTS) {
    const lockoutUntil = currentTime + CONFIG.LOCKOUT_DURATION;
    await redis.setEx(`lockout:${identifier}`, CONFIG.LOCKOUT_DURATION, lockoutUntil.toString());

    // Hapus jumlah percobaan karena sudah terlockout
    await redis.del(attemptKey);
  }

  return attempts;
}

// Fungsi untuk mereset percobaan login saat berhasil
export async function resetLoginAttempts(identifier) {
  await redis.del(`attempts:${identifier}`);
  await redis.del(`firstAttempt:${identifier}`);
  await redis.del(`lockout:${identifier}`);
}

// Fungsi untuk mendapatkan waktu lockout tersisa
export async function getLockoutTimeRemaining(identifier) {
  const lockoutKey = `lockout:${identifier}`;
  const blockUntil = await redis.get(lockoutKey);

  if (!blockUntil) return 0;

  const now = Math.floor(Date.now() / 1000);
  const remaining = parseInt(blockUntil) - now;

  return Math.max(0, remaining * 1000); // return dalam milidetik
}

// Fungsi untuk memformat waktu lockout menjadi string
export function formatLockoutTime(remainingMs) {
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  return `${minutes} menit ${seconds} detik`;
}