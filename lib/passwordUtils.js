import bcrypt from 'bcryptjs';

// Konstanta untuk konfigurasi keamanan
export const PASSWORD_CONFIG = {
  SALT_ROUNDS: 12, // Jumlah salt rounds untuk bcrypt - lebih tinggi lebih aman tapi lebih lambat
  MIN_LENGTH: 8,   // Panjang minimum password
  REQUIRE_SPECIAL_CHAR: true, // Apakah harus mengandung karakter spesial
  REQUIRE_NUMBER: true,       // Apakah harus mengandung angka
  REQUIRE_UPPERCASE: true,    // Apakah harus mengandung huruf besar
};

/**
 * Hash password menggunakan bcrypt
 * @param {string} password - Password plain text
 * @returns {Promise<string>} - Password yang sudah di-hash
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password harus berupa string yang valid');
  }

  // Validasi kekuatan password
  validatePasswordStrength(password);

  try {
    const hashedPassword = await bcrypt.hash(password, PASSWORD_CONFIG.SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Gagal meng-hash password');
  }
}

/**
 * Membandingkan password plain text dengan password yang sudah di-hash
 * @param {string} plainPassword - Password plain text
 * @param {string} hashedPassword - Password yang sudah di-hash
 * @returns {Promise<boolean>} - True jika password cocok
 */
export async function verifyPassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) {
    throw new Error('Password dan hashedPassword harus disediakan');
  }

  try {
    const isValid = await bcrypt.compare(plainPassword, hashedPassword);
    return isValid;
  } catch (error) {
    console.error('Error memverifikasi password:', error);
    return false;
  }
}

/**
 * Validasi kekuatan password
 * @param {string} password - Password yang akan divalidasi
 * @returns {void}
 * @throws {Error} - Jika password tidak memenuhi kriteria
 */
export function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password harus berupa string yang valid');
  }

  // Cek panjang minimum
  if (password.length < PASSWORD_CONFIG.MIN_LENGTH) {
    throw new Error(`Password harus memiliki setidaknya ${PASSWORD_CONFIG.MIN_LENGTH} karakter`);
  }

  // Cek kebutuhan karakter spesial
  if (PASSWORD_CONFIG.REQUIRE_SPECIAL_CHAR && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    throw new Error('Password harus mengandung setidaknya satu karakter spesial');
  }

  // Cek kebutuhan angka
  if (PASSWORD_CONFIG.REQUIRE_NUMBER && !/\d/.test(password)) {
    throw new Error('Password harus mengandung setidaknya satu angka');
  }

  // Cek kebutuhan huruf besar
  if (PASSWORD_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    throw new Error('Password harus mengandung setidaknya satu huruf besar');
  }

  // Cek apakah password mengandung username atau bagian dari nama pengguna
  // Ini akan dicek secara opsional di tempat lain karena butuh data pengguna

  return true;
}

/**
 * Validasi apakah password cocok dengan kebijakan keamanan
 * @param {string} password - Password yang akan divalidasi
 * @param {string} username - Username pengguna (opsional, untuk cek jika password mengandung username)
 * @param {string} name - Nama pengguna (opsional, untuk cek jika password mengandung nama)
 * @returns {boolean} - True jika password memenuhi kriteria
 */
export function isValidPassword(password, username = '', name = '') {
  try {
    validatePasswordStrength(password);
    
    // Cek apakah password mengandung username atau nama (jika disediakan)
    if (username && password.toLowerCase().includes(username.toLowerCase())) {
      throw new Error('Password tidak boleh mengandung username');
    }
    
    if (name && password.toLowerCase().includes(name.toLowerCase())) {
      throw new Error('Password tidak boleh mengandung nama lengkap');
    }
    
    return true;
  } catch (error) {
    console.error('Password validation failed:', error.message);
    return false;
  }
}