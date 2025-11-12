// components/kasir/transaksi/SearchBar.js
'use client';

import { Search, X } from 'lucide-react';

export default function SearchBar({ onSearch, onClear, darkMode }) {
  return (
    <div className="relative w-full mb-4">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
      </div>
      <input
        type="text"
        placeholder="Cari produk berdasarkan nama, kode, atau scan barcode..."
        onChange={(e) => onSearch(e.target.value)}
        className={`block w-full pl-10 pr-10 py-3 border rounded-lg text-lg ${
          darkMode
            ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
        }`}
      />
      {/* Optional: Add a clear button */}
    </div>
  );
}