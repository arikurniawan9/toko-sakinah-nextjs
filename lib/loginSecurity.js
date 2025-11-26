// lib/loginSecurity.js

// Object to store login attempts by identifier (username, in this case) - (in a real app, use Redis or database)
// For production use, implement a shared storage like Redis
let loginAttempts = {};

// Konstanta konfigurasi
const CONFIG = {
  MAX_ATTEMPTS: 5, // Jumlah maksimal percobaan login
  LOCKOUT_DURATION: 15 * 60 * 1000, // Durasi lockout dalam milidetik (15 menit)
  RESET_DURATION: 15 * 60 * 1000, // Durasi reset attempt count (15 menit)
};

// Fungsi untuk menginisialisasi storage (bisa digunakan untuk mengganti ke Redis nanti)
export function setLoginAttemptStorage(storage) {
  loginAttempts = storage;
}

// Fungsi untuk mengecek apakah identifier (username) terkena lockout
export function isLockedOut(identifier) {
  const attempt = loginAttempts[identifier];
  if (!attempt) return false;

  // Reset attempt count jika sudah melewati durasi reset
  if (Date.now() - attempt.firstAttemptTime > CONFIG.RESET_DURATION) {
    delete loginAttempts[identifier];
    return false;
  }

  // Cek apakah masih dalam lockout
  if (attempt.blockUntil && Date.now() < attempt.blockUntil) {
    return true;
  }

  // Hapus dari block jika sudah melewati lockout duration
  if (attempt.blockUntil && Date.now() >= attempt.blockUntil) {
    delete loginAttempts[identifier];
  }

  return false;
}

// Fungsi untuk mencatat percobaan login gagal
export function recordFailedLoginAttempt(identifier) {
  if (!loginAttempts[identifier]) {
    loginAttempts[identifier] = {
      attempts: 0,
      firstAttemptTime: Date.now(),
      blockUntil: null
    };
  }

  const attempt = loginAttempts[identifier];

  // Reset jika sudah melewati reset duration
  if (Date.now() - attempt.firstAttemptTime > CONFIG.RESET_DURATION) {
    attempt.attempts = 1;
    attempt.firstAttemptTime = Date.now();
    attempt.blockUntil = null;
  } else {
    attempt.attempts += 1;

    // Jika melewati batas attempt, aktifkan lockout
    if (attempt.attempts >= CONFIG.MAX_ATTEMPTS) {
      attempt.blockUntil = Date.now() + CONFIG.LOCKOUT_DURATION;
    }
  }

  return attempt.attempts;
}

// Fungsi untuk mereset percobaan login saat berhasil
export function resetLoginAttempts(identifier) {
  delete loginAttempts[identifier];
}

// Fungsi untuk mendapatkan waktu lockout tersisa
export function getLockoutTimeRemaining(identifier) {
  const attempt = loginAttempts[identifier];
  if (!attempt || !attempt.blockUntil) return 0;

  const remaining = attempt.blockUntil - Date.now();
  return Math.max(0, remaining);
}

// Fungsi untuk memformat waktu lockout menjadi string
export function formatLockoutTime(remainingMs) {
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  return `${minutes} menit ${seconds} detik`;
}