// supabase_config.js
// File konfigurasi untuk koneksi ke Supabase

/**
 * Panduan penggunaan:
 * 1. Ganti placeholder [USER], [PASSWORD], [HOST], [PORT], [DATABASE] 
 *    dengan informasi dari connection string Supabase Anda
 * 2. Simpan informasi ini di file .env
 * 3. Gunakan konfigurasi ini untuk mengganti DATABASE_URL di file .env
 */

const supabaseConfig = {
  // Connection string dari Supabase dashboard
  connectionString: 'postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?sslmode=require',
  
  // Contoh format setelah diisi
  // connectionString: 'postgresql://postgres.your_project_id.supabase.co:5432/postgres?user=postgres&password=your_password&sslmode=require',
  
  // Konfigurasi untuk Prisma
  prismaConfig: {
    datasource: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL,
      directUrl: process.env.DIRECT_URL
    }
  },
  
  // Konfigurasi pool koneksi
  poolConfig: {
    maxConnections: 20,
    minConnections: 1,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    maxUses: 1000, // Jumlah maksimum query sebelum koneksi diganti
  }
};

// Fungsi untuk memvalidasi connection string
function validateConnectionString(connectionString) {
  try {
    const url = new URL(connectionString);
    const requiredParams = ['protocol', 'hostname', 'port', 'pathname'];
    
    for (const param of requiredParams) {
      if (!url[param] || url[param] === '') {
        throw new Error(`Connection string tidak lengkap: ${param} hilang`);
      }
    }
    
    if (!url.searchParams.get('sslmode')) {
      console.warn('Parameter sslmode tidak ditemukan. Disarankan untuk menambahkan ?sslmode=require');
    }
    
    return true;
  } catch (error) {
    console.error('Error memvalidasi connection string:', error.message);
    return false;
  }
}

// Fungsi untuk mengganti placeholder di connection string
function replaceConnectionStringPlaceholders(connectionString, credentials) {
  return connectionString
    .replace('[USER]', credentials.user)
    .replace('[PASSWORD]', credentials.password)
    .replace('[HOST]', credentials.host)
    .replace('[PORT]', credentials.port)
    .replace('[DATABASE]', credentials.database);
}

module.exports = {
  supabaseConfig,
  validateConnectionString,
  replaceConnectionStringPlaceholders
};