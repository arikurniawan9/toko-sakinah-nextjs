const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Validasi direktori template
const templateDir = path.join(process.cwd(), 'public', 'templates');
if (!fs.existsSync(templateDir)) {
  fs.mkdirSync(templateDir, { recursive: true });
}

// Data contoh untuk template
const templateData = [
  {
    "Nama": "Kemeja Lengan Panjang",
    "Kode": "KLP-001",
    "Stok": 100,
    "Kategori": "Pakaian",
    "Supplier": "Supplier A",
    "Deskripsi": "Kemeja lengan panjang motif kotak",
    "Tanggal Dibuat": "2025-01-01",
    "Tanggal Diubah": "2025-01-01",
    "Harga Beli": 50000,
    "Harga Jual Min": 1,
    "Harga Jual Max": 10,
    "Harga Jual": 75000
  },
  {
    "Nama": "Kemeja Lengan Panjang",
    "Kode": "KLP-001",
    "Stok": 100,
    "Kategori": "Pakaian",
    "Supplier": "Supplier A",
    "Deskripsi": "Kemeja lengan panjang motif kotak",
    "Tanggal Dibuat": "2025-01-01",
    "Tanggal Diubah": "2025-01-01",
    "Harga Beli": 50000,
    "Harga Jual Min": 11,
    "Harga Jual Max": 20,
    "Harga Jual": 70000
  },
  {
    "Nama": "Kemeja Lengan Panjang",
    "Kode": "KLP-001",
    "Stok": 100,
    "Kategori": "Pakaian",
    "Supplier": "Supplier A",
    "Deskripsi": "Kemeja lengan panjang motif kotak",
    "Tanggal Dibuat": "2025-01-01",
    "Tanggal Diubah": "2025-01-01",
    "Harga Beli": 50000,
    "Harga Jual Min": 21,
    "Harga Jual Max": "",  // Harga Jual Max bisa kosong untuk tier terakhir
    "Harga Jual": 65000
  },
  {
    "Nama": "Celana Jeans",
    "Kode": "CJ-001",
    "Stok": 50,
    "Kategori": "Pakaian",
    "Supplier": "Supplier B",
    "Deskripsi": "Celana jeans model slim fit",
    "Tanggal Dibuat": "2025-01-01",
    "Tanggal Diubah": "2025-01-01",
    "Harga Beli": 80000,
    "Harga Jual Min": 1,
    "Harga Jual Max": 5,
    "Harga Jual": 120000
  },
  {
    "Nama": "Celana Jeans",
    "Kode": "CJ-001",
    "Stok": 50,
    "Kategori": "Pakaian",
    "Supplier": "Supplier B",
    "Deskripsi": "Celana jeans model slim fit",
    "Tanggal Dibuat": "2025-01-01",
    "Tanggal Diubah": "2025-01-01",
    "Harga Beli": 80000,
    "Harga Jual Min": 6,
    "Harga Jual Max": "",  // Harga Jual Max bisa kosong untuk tier terakhir
    "Harga Jual": 100000
  },
  {
    "Nama": "Tas Ransel",
    "Kode": "TR-001",
    "Stok": 30,
    "Kategori": "Aksesoris",
    "Supplier": "Supplier C",
    "Deskripsi": "Tas ransel untuk laptop 15 inci",
    "Tanggal Dibuat": "2025-01-01",
    "Tanggal Diubah": "2025-01-01",
    "Harga Beli": 120000,
    "Harga Jual Min": 1,
    "Harga Jual Max": "",
    "Harga Jual": 200000
  }
];

// Membuat workbook baru
const workbook = XLSX.utils.book_new();

// Membuat worksheet dari data
const worksheet = XLSX.utils.json_to_sheet(templateData);

// Menyesuaikan lebar kolom
const colWidths = [
  { wch: 20 }, // Nama
  { wch: 12 }, // Kode
  { wch: 8 },  // Stok
  { wch: 15 }, // Kategori
  { wch: 15 }, // Supplier
  { wch: 30 }, // Deskripsi
  { wch: 12 }, // Tanggal Dibuat
  { wch: 12 }, // Tanggal Diubah
  { wch: 12 }, // Harga Beli
  { wch: 12 }, // Harga Jual Min
  { wch: 12 }, // Harga Jual Max
  { wch: 12 }  // Harga Jual
];

worksheet['!cols'] = colWidths;

// Menambahkan worksheet ke workbook
XLSX.utils.book_append_sheet(workbook, worksheet, "Template Produk");

// Menyimpan file ke public/templates dengan validasi keamanan
const filePath = path.join(templateDir, 'template-produk-updated.xlsx');

// Cek apakah path aman (tidak mengandung traversal path seperti ../)
const resolvedPath = path.resolve(templateDir);
const requestedPath = path.resolve(filePath);

if (!requestedPath.startsWith(resolvedPath)) {
  throw new Error('Path traversal detected! Requested path is outside of template directory.');
}

XLSX.writeFile(workbook, filePath);

console.log(`Template Excel produk berhasil dibuat di ${filePath}`);