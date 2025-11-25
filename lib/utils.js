// lib/utils.js

/**
 * Generate a unique code based on prefix and timestamp
 * @param {string} prefix - Prefix for the code (e.g., 'MEM' for member, 'USR' for user)
 * @returns {string} - Unique code
 */
export function generateUniqueCode(prefix = 'CODE') {
  const timestamp = Date.now().toString().slice(-6); // Take last 6 digits of timestamp
  const randomNum = Math.floor(1000 + Math.random() * 9000); // Generate 4-digit random number
  return `${prefix}${timestamp}${randomNum}`;
}

/**
 * Generate a short unique code for members/attendants
 * @param {string} prefix - Prefix for the code (e.g., 'MEM' for member, 'USR' for user)
 * @returns {string} - Short unique code
 */
export function generateShortCode(prefix = 'CODE') {
  const timestamp = Date.now().toString().slice(-4); // Take last 4 digits of timestamp
  const randomNum = Math.floor(100 + Math.random() * 900); // Generate 3-digit random number
  return `${prefix}${timestamp}${randomNum}`;
}

/**
 * Generate a 6-digit numeric code for attendants
 * @returns {string} - 6-digit numeric code
 */
export function generateNumericCode() {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit random number
  } while (code.length !== 6); // Ensure it's exactly 6 digits
  return code;
}

/**
 * Validate if a code is in the expected format
 * @param {string} code - The code to validate
 * @param {string} prefix - Expected prefix
 * @returns {boolean} - Whether the code is valid
 */
export function validateCode(code, prefix = 'CODE') {
  const regex = new RegExp(`^${prefix}\\d+$`);
  return regex.test(code);
}