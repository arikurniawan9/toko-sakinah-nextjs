/**
 * Generate readable invoice number for warehouse distribution
 * Format: DIST-YYYYMMDD-XXXX
 * Where XXXX is a sequential number or random alphanumeric code
 */
export function generateDistributionInvoiceNumber() {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
                  String(now.getMonth() + 1).padStart(2, '0') +
                  String(now.getDate()).padStart(2, '0');

  // Generate a random 4-character alphanumeric code
  const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `DIST-${dateStr}-${randomCode}`;
}

/**
 * Generate invoice number with store name (for distribution)
 * Format: DIST-YYYYMMDD-STORENAME-USERCODE
 */
export function generateDistributionInvoiceNumberWithStore(storeName, userCode = 'USR') {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
                  String(now.getMonth() + 1).padStart(2, '0') +
                  String(now.getDate()).padStart(2, '0');

  // Use store name, take first 3 characters and make uppercase
  const storeNameCode = storeName.substring(0, 3).replace(/\s+/g, '').toUpperCase();
  const userCodeFormatted = userCode.substring(0, 3).toUpperCase();

  return `DIST-${dateStr}-${storeNameCode}-${userCodeFormatted}`;
}

/**
 * Generate invoice number with sequential counter (alternative approach)
 * This would require storing the last used number in database
 */
export async function generateSequentialDistributionInvoiceNumber() {
  // This would typically fetch the last invoice number from database
  // and increment it, but for now we'll use a timestamp-based approach
  const now = new Date();
  const timestamp = now.getTime().toString().slice(-6); // Use last 6 digits of timestamp

  const dateStr = now.getFullYear().toString() +
                  String(now.getMonth() + 1).padStart(2, '0') +
                  String(now.getDate()).padStart(2, '0');

  return `DIST-${dateStr}-${timestamp}`;
}