// components/kasir/transaksi/DiscountInput.js
'use client';

import { memo } from 'react';

const DiscountInput = ({ 
  additionalDiscount, 
  setAdditionalDiscount, 
  calculation, 
  darkMode 
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDiscountChange = (e) => {
    const value = Math.max(0, parseInt(e.target.value) || 0);
    // Batasi diskon maksimal hingga total sebelum diskon
    const maxDiscount = calculation?.subTotal || 0;
    setAdditionalDiscount(Math.min(value, maxDiscount));
  };

  return (
    <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Diskon Keseluruhan</h3>
        {calculation && (
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Maks: {formatCurrency(calculation.subTotal || 0)}
          </span>
        )}
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="additionalDiscount" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Jumlah Diskon
          </label>
          <div className="relative">
            <input
              type="number"
              id="additionalDiscount"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
              value={additionalDiscount}
              onChange={handleDiscountChange}
              min="0"
              max={calculation?.subTotal || Number.MAX_SAFE_INTEGER}
              placeholder="Masukkan jumlah diskon"
            />
            <div className={`absolute right-3 top-2.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              IDR
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setAdditionalDiscount(Math.floor((calculation?.subTotal || 0) * 0.05))}
            className={`px-3 py-2 text-sm rounded-md ${
              darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
            type="button"
          >
            5%
          </button>
          <button
            onClick={() => setAdditionalDiscount(Math.floor((calculation?.subTotal || 0) * 0.10))}
            className={`px-3 py-2 text-sm rounded-md ${
              darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
            type="button"
          >
            10%
          </button>
          <button
            onClick={() => setAdditionalDiscount(Math.floor((calculation?.subTotal || 0) * 0.15))}
            className={`px-3 py-2 text-sm rounded-md ${
              darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
            type="button"
          >
            15%
          </button>
        </div>
      </div>
      
      {calculation && (
        <div className="mt-2 text-sm">
          <div className="flex justify-between">
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal:</span>
            <span className={darkMode ? 'text-white' : 'text-gray-900'}>{formatCurrency(calculation.subTotal || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Diskon Tambahan:</span>
            <span className={`${darkMode ? 'text-red-400' : 'text-red-600'} font-medium`}>-{formatCurrency(additionalDiscount)}</span>
          </div>
          <div className="flex justify-between font-bold mt-1 pt-1 border-t border-gray-300 dark:border-gray-600">
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Total Setelah Diskon:</span>
            <span className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              {formatCurrency((calculation.subTotal || 0) - additionalDiscount)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountInput;