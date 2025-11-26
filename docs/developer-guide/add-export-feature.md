# Panduan Developer: Menambahkan Fitur Export dan Caching ke Modul Lain

## Overview
Dokumen ini menjelaskan bagaimana menambahkan fitur export (ke Excel, PDF, CSV) dan caching Redis ke modul aplikasi lain di sistem Toko Sakinah.

## 1. Menambahkan Export ke Modul Baru

### a. Menambahkan fungsi export ke halaman

```javascript
// Di halaman Anda (misalnya: app/admin/modul-baru/page.js)
import { useState } from 'react';
import ExportFormatSelector from '../../../components/export/ExportFormatSelector';
import PDFPreviewModal from '../../../components/export/PDFPreviewModal';

export default function MyModulePage() {
  const [showExportFormatModal, setShowExportFormatModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [pdfPreviewData, setPdfPreviewData] = useState(null);
  const [showPDFPreviewModal, setShowPDFPreviewModal] = useState(false);

  // Fungsi untuk membuka modal format export
  const openExportFormatSelector = () => {
    setShowExportFormatModal(true);
  };

  // Fungsi untuk menangani export dengan format tertentu
  const handleExportWithFormat = async (format) => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/modul-baru');
      if (!response.ok) throw new Error('Gagal mengambil data');
      const data = await response.json();

      // Siapkan data untuk ekspor
      const exportData = data.items.map(item => ({
        'Nama': item.name,
        'Kode': item.code,
        'Deskripsi': item.description,
        'Tanggal Dibuat': new Date(item.createdAt).toLocaleDateString('id-ID'),
        'Tanggal Diubah': new Date(item.updatedAt).toLocaleDateString('id-ID'),
      }));

      if (format === 'pdf') {
        // Tampilkan preview PDF sebelum download
        setPdfPreviewData({
          data: exportData,
          title: 'Laporan Modul Baru',
          darkMode: darkMode
        });
        setShowPDFPreviewModal(true);
      } else if (format === 'excel') {
        // Ekspor ke Excel
        const { utils, writeFile } = await import('xlsx');
        const worksheet = utils.json_to_sheet(exportData);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, 'Modul Baru');
        writeFile(workbook, `modul-baru-${new Date().toISOString().slice(0, 10)}.xlsx`);
      } else {
        // Ekspor ke CSV (default)
        let csvContent = 'Nama,Kode,Deskripsi,Tanggal Dibuat,Tanggal Diubah\n';
        exportData.forEach(row => {
          csvContent += `"${row['Nama']}","${row['Kode']}","${row['Deskripsi']}","${row['Tanggal Dibuat']}","${row['Tanggal Diubah']}"\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `modul-baru-${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setSuccess(`Data berhasil diekspor dalam format ${format.toUpperCase()}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setTableError('Terjadi kesalahan saat export: ' + err.message);
      setTimeout(() => setTableError(''), 5000);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div>
      {/* Tombol export */}
      <button
        onClick={openExportFormatSelector}
        disabled={exportLoading}
        className="p-2 border rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50"
      >
        {exportLoading ? 'Memproses...' : 'Export'}
      </button>

      {/* Modal format export */}
      <ExportFormatSelector
        isOpen={showExportFormatModal}
        onClose={() => setShowExportFormatModal(false)}
        onExport={handleExportWithFormat}
        title="Modul Baru"
        darkMode={darkMode}
      />

      {/* Modal preview PDF */}
      <PDFPreviewModal
        isOpen={showPDFPreviewModal}
        onClose={() => setShowPDFPreviewModal(false)}
        data={pdfPreviewData?.data}
        title={pdfPreviewData?.title}
        darkMode={darkMode}
      />
    </div>
  );
}
```

### b. Implementasi caching di API endpoint

```javascript
// app/api/modul-baru/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from 'next-auth/react';
import { getRedis, setToCache, getFromCache } from '@/lib/redis';

export async function GET(request) {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || 10;
  const search = searchParams.get('search') || '';

  // Buat cache key
  const cacheKey = `modul-baru:${session.user.storeId}:${page}:${limit}:${search}`;

  try {
    // Coba ambil dari cache dulu
    const cachedData = await getFromCache(cacheKey);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    // Jika tidak ada di cache, ambil dari database
    const whereClause = {
      storeId: session.user.storeId,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
        ]
      })
    };

    const [items, totalCount] = await Promise.all([
      prisma.modulBaru.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          supplier: true
        }
      }),
      prisma.modulBaru.count({ where: whereClause })
    ]);

    const result = {
      items,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };

    // Simpan ke cache
    await setToCache(cacheKey, JSON.stringify(result), 300); // Cache 5 menit

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## 2. File-file yang Diperlukan

Pastikan Anda memiliki file-file berikut:

1. **`lib/redis.js`** untuk fungsi caching
2. **`components/export/ExportFormatSelector.js`** untuk modal pilihan format
3. **`components/export/PDFPreviewModal.js`** untuk modal preview PDF
4. Dependencies: `xlsx`, `jspdf`, `jspdf-autotable` di `package.json`

## 3. Best Practices

### A. Struktur Data untuk Ekspor
Gunakan struktur data konsisten untuk memudahkan pengolahan:
```javascript
const exportData = items.map(item => ({
  'Nama': item.name,
  'Kode': item.code,
  'Deskripsi': item.description || '',
  'Tanggal Dibuat': new Date(item.createdAt).toLocaleDateString('id-ID'),
  'Tanggal Diubah': new Date(item.updatedAt).toLocaleDateString('id-ID'),
}));
```

### B. Penamaan Cache Key
Ikuti pola: `nama-modul:storeId:parameter1:parameter2`
```javascript
const cacheKey = `products:${storeId}:${page}:${limit}:${search}:${categoryId}`;
```

### C. Waktu Cache (TTL)
- Data yang sering berubah: 5-15 menit
- Data yang stabil: 30-60 menit
- Data statis: 1-2 jam

## 4. Error Handling

Pastikan untuk menangani error dengan baik:
```javascript
try {
  // Operasi caching atau ekspor
} catch (error) {
  console.error('Error dalam operasi:', error);
  // Fallback ke database jika Redis gagal
  // Atau fallback ke format lain jika export gagal
}
```

## 5. Testing

Untuk menguji implementasi:
1. Lakukan export dan pastikan file terdownload
2. Verifikasi isi file sesuai dengan data asli
3. Test caching dengan membandingkan waktu respons
4. Verifikasi bahwa data tetap akurat setelah perubahan

Dengan mengikuti panduan ini, Anda dapat dengan mudah menambahkan fitur export dan caching ke modul-modul lain dalam sistem Toko Sakinah.