// utils/supplierImportTemplate.js
import * as XLSX from 'xlsx';

export const generateSupplierImportTemplate = () => {
  // Data template contoh
  const templateData = [
    {
      'Kode Supplier': 'SUP001',
      'Nama Supplier': 'Contoh Supplier A',
      'Nama Kontak': 'Budi Santoso',
      'Telepon': '081234567890',
      'Email': 'budi@contoh.com',
      'Alamat': 'Jl. Contoh No. 123, Kota'
    },
    {
      'Kode Supplier': 'SUP002',
      'Nama Supplier': 'Contoh Supplier B',
      'Nama Kontak': 'Ani Wijaya',
      'Telepon': '082134567890',
      'Email': 'ani@contoh.com',
      'Alamat': 'Jl. Contoh No. 456, Kota'
    }
  ];

  // Buat worksheet
  const ws = XLSX.utils.json_to_sheet(templateData);

  // Atur lebar kolom
  ws['!cols'] = [
    { wch: 15 }, // Kode Supplier
    { wch: 25 }, // Nama Supplier
    { wch: 20 }, // Nama Kontak
    { wch: 15 }, // Telepon
    { wch: 25 }, // Email
    { wch: 30 }  // Alamat
  ];

  // Buat workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Supplier');

  // Tambahkan petunjuk di baris pertama
  const range = XLSX.utils.decode_range(ws['!ref']);
  // Geser semua data ke bawah satu baris
  for (let R = range.e.r; R >= range.s.r; R--) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell_address = XLSX.utils.encode_cell({r: R + 1, c: C});
      const prev_cell_address = XLSX.utils.encode_cell({r: R, c: C});
      if (ws[prev_cell_address]) {
        ws[cell_address] = ws[prev_cell_address];
        delete ws[prev_cell_address];
      }
    }
  }

  // Update range
  ws['!ref'] = XLSX.utils.encode_range({
    s: {r: range.s.r, c: range.s.c},
    e: {r: range.e.r + 1, c: range.e.c}
  });

  // Tambahkan header petunjuk
  ws['A1'] = {v: 'Petunjuk Import Supplier:', t: 's', s: {font: {bold: true, sz: 14}}};
  ws['A2'] = {v: '1. Kolom "Kode Supplier", "Nama Supplier", dan "Telepon" wajib diisi', t: 's'};
  ws['A3'] = {v: '2. Format email harus valid (contoh@email.com)', t: 's'};
  ws['A4'] = {v: '3. Kode supplier harus unik untuk setiap toko', t: 's'};
  ws['A5'] = {v: '4. Kolom lainnya opsional', t: 's'};
  ws['A6'] = {v: '5. Hapus atau kosongkan baris petunjuk ini sebelum mengisi data supplier', t: 's'};
  ws['A7'] = {v: '', t: 's'}; // Baris kosong

  // Tambahkan header kolom di baris 8
  const headers = ['Kode Supplier', 'Nama Supplier', 'Nama Kontak', 'Telepon', 'Email', 'Alamat'];
  for (let i = 0; i < headers.length; i++) {
    const cell_address = XLSX.utils.encode_col(i) + '8';
    ws[cell_address] = {v: headers[i], t: 's', s: {font: {bold: true}}};
  }

  // Simpan file
  XLSX.writeFile(wb, 'template_import_supplier.xlsx');
};