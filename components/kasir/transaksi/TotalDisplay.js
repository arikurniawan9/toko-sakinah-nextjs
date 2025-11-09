// components/kasir/transaksi/TotalDisplay.js
'use client';

import terbilang from 'terbilang';

const TotalDisplay = ({ total, darkMode }) => {
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

  const terbilangText = capitalize(terbilang(total)) + ' Rupiah';

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
};

export default TotalDisplay;
