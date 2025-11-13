// components/kasir/transaksi/TotalDisplay.js
'use client';

import terbilang from 'terbilang';
import { memo } from 'react';

const TotalDisplay = memo(({ total, darkMode }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const capitalize = (s) => {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  // Fungsi untuk mengonversi angka ke teks rupiah, dengan penanganan error
  const getTerbilangText = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return 'Nol Rupiah';
    }
    
    if (amount < 0) {
      return 'Angka negatif tidak valid';
    }
    
    try {
      // Untuk jumlah besar, terbilang bisa gagal, jadi kita gunakan try-catch
      const result = terbilang(amount);
      if (typeof result === 'string') {
        return capitalize(result) + ' Rupiah';
      } else {
        return capitalize(terbilang(Math.round(amount))) + ' Rupiah';
      }
    } catch (error) {
      console.error('Error converting number to terbilang:', error);
      // Fallback jika terbilang gagal
      return `Jumlah: ${formatCurrency(amount)}`;
    }
  };

  const terbilangText = getTerbilangText(total);

  return (
    <div className={`rounded-lg shadow p-6 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h2 className={`text-sm font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Total Bayar
      </h2>
      <p className={`text-6xl font-bold my-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
        {formatCurrency(total)}
      </p>
      <p className={`text-md italic ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        {terbilangText}
      </p>
    </div>
  );
});

export default TotalDisplay;
