require('dotenv').config({ override: true }); // Load environment variables from .env file, overriding existing ones

const { Client } = require('pg');

// Ambil URL dari environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL tidak ditemukan di environment');
  process.exit(1);
}

console.log('Mencoba koneksi ke database:', databaseUrl);

// Konfigurasi koneksi ke Supabase dengan SSL
const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
    sslmode: 'require',
    ca: null,
    cert: null,
    key: null
  }
});

async function testConnection() {
  try {
    await client.connect();
    console.log('Koneksi ke database berhasil!');

    // Coba query sederhana
    const result = await client.query('SELECT NOW()');
    console.log('Query berhasil:', result.rows[0]);

    await client.end();
    console.log('Koneksi ditutup.');
  } catch (err) {
    console.error('Error dalam koneksi ke database:', err.message);
  }
}

testConnection();