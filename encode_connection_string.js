// Script untuk meng-generate connection string yang benar untuk Supabase
const { URL } = require('url');

// Connection string asli
const rawConnectionString = 'postgresql://postgres:dzikrullah99@db.oazyjsnhxamlamvotyll.supabase.co:5432/postgres';

try {
  // Parsing URL
  const parsedUrl = new URL(rawConnectionString);
  
  // Encode password
  parsedUrl.password = encodeURIComponent('dzikrullah99');
  
  // Tambahkan parameter sslmode
  parsedUrl.searchParams.set('sslmode', 'require');
  
  const encodedConnectionString = parsedUrl.toString();
  
  console.log('Connection string asli:');
  console.log(rawConnectionString);
  console.log('');
  console.log('Connection string yang telah di-encode:');
  console.log(encodedConnectionString);
  console.log('');
  console.log('Silakan gunakan connection string yang telah di-encode di file .env');
} catch (error) {
  console.error('Error saat mengencode connection string:', error.message);
}