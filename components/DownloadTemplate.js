// components/DownloadTemplate.js
'use client';

import React from 'react';

const DownloadTemplate = ({ type }) => {
  const downloadTemplate = () => {
    // Create CSV content based on type
    let csvContent = '';
    let filename = '';
    
    if (type === 'kategori') {
      csvContent = 'Nama,Deskripsi\n';
      csvContent += 'Baju,"Pakaian atasan"\n';
      csvContent += 'Celana,"Pakaian bawahan"\n';
      csvContent += 'Aksesoris,"Aksesoris pelengkap"\n';
      filename = 'template-kategori.csv';
    } else if (type === 'produk') {
      csvContent = 'Nama,Kode Produk,Harga Beli,Harga Jual,Stok,Kategori,Supplier,Diskon1_3,Diskon4_6,DiskonMore\n';
      csvContent += 'Kemeja Putih,KMJ001,85000,120000,50,1,1,1000,5000,8000\n';
      csvContent += 'Celana Jeans,CLN001,100000,150000,30,2,1,1000,7000,10000\n';
      filename = 'template-produk.csv';
    } else if (type === 'member') {
      csvContent = 'Nama,No HP,Alamat,Jenis Member,Email\n';
      csvContent += 'Budi Santoso,081234567890,"Jl. Merdeka No. 10",Silver,budi@example.com\n';
      csvContent += 'Ani Lestari,082345678901,"Jl. Sudirman No. 15",Gold,ani@example.com\n';
      filename = 'template-member.csv';
    } else if (type === 'supplier') {
      csvContent = 'Nama,Alamat,Telepon,Email\n';
      csvContent += 'CV. Maju Jaya,"Jl. Industri No. 5",02112345678,sales@maju.com\n';
      csvContent += 'PT. Sejahtera Abadi,"Jl. Perdagangan No. 12",02187654321,info@sejahtera.com\n';
      filename = 'template-supplier.csv';
    }
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={downloadTemplate}
      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      Template {type.charAt(0).toUpperCase() + type.slice(1)}
    </button>
  );
};

export default DownloadTemplate;