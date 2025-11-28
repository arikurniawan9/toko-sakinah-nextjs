// components/kasir/KasirProductToolbar.js
'use client';

import { useState, useEffect } from 'react';
import { Search, X, Barcode } from 'lucide-react';

export default function KasirProductToolbar({
  searchTerm,
  setSearchTerm,
  itemsPerPage,
  setItemsPerPage,
  darkMode
}) {
  const [inputValue, setInputValue] = useState(searchTerm);
  const [isScanning, setIsScanning] = useState(false);
  const [scanTimeout, setScanTimeout] = useState(null);

  // Sync inputValue dengan searchTerm ketika searchTerm berubah dari luar
  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  // Fungsi debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(inputValue);
    }, 300); // Delay 300ms

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, setSearchTerm]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
  };

  const handleClear = () => {
    setInputValue('');
    setSearchTerm('');
  };

  // Fungsi untuk mendeteksi scan barcode
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        if (isScanning) {
          // Ini kemungkinan besar hasil scan barcode
          event.preventDefault();
          setIsScanning(false);
        }
      } else {
        // Jika ada karakter keyboard lain, kita mulai mode scanning untuk sementara
        if (event.code.length === 1 || event.code.startsWith('Numpad')) {
          setIsScanning(true);

          // Reset timer setiap kali ada input
          if (scanTimeout) {
            clearTimeout(scanTimeout);
          }

          // Set timer untuk reset mode scanning setelah 100ms tanpa input
          const timeout = setTimeout(() => {
            setIsScanning(false);
          }, 100);

          setScanTimeout(timeout);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (scanTimeout) {
        clearTimeout(scanTimeout);
      }
    };
  }, [isScanning, scanTimeout]);

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
      {/* Left side: Search and Filters */}
      <div className="flex-grow flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <label htmlFor="search" className="sr-only">Cari</label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isScanning ? (
              <Barcode className={`h-5 w-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            ) : (
              <Search className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            )}
          </div>
          <input
            type="text"
            id="search"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={isScanning ? "Scan barcode..." : "Cari produk berdasarkan nama atau kode..."}
            className={`w-full pl-10 pr-10 py-2 border rounded-md shadow-sm ${
              darkMode
                ? isScanning ? 'bg-gray-600 border-green-500 text-white' : 'bg-gray-700 border-gray-600 text-white'
                : isScanning ? 'bg-gray-100 border-green-500 text-gray-900' : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-pastel-purple-500`}
          />
          {inputValue && (
            <button
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className={`h-5 w-5 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`} />
            </button>
          )}
        </div>
        <div className="w-full sm:w-auto">
          <label htmlFor="itemsPerPage" className="sr-only">Items per page</label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className={`w-full px-3 py-2 border rounded-md shadow-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-pastel-purple-500`}
          >
            <option value={10}>10/halaman</option>
            <option value={20}>20/halaman</option>
            <option value={50}>50/halaman</option>
          </select>
        </div>
      </div>
    </div>
  );
}
