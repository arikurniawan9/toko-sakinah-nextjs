// components/kasir/KasirCategoryToolbar.js
'use client';

import { Search, X } from 'lucide-react';
// Tooltip is no longer needed if no action buttons are present, but keeping it for now in case other elements use it.
// import Tooltip from '../Tooltip'; 

export default function KasirCategoryToolbar({ 
  searchTerm, 
  setSearchTerm, 
  itemsPerPage, 
  setItemsPerPage, 
  darkMode 
}) {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
      {/* Left side: Search and Filters */}
      <div className="flex-grow flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <label htmlFor="search" className="sr-only">Cari</label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kategori..."
            className={`w-full pl-10 pr-4 py-2 border rounded-md shadow-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-pastel-purple-500`}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
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
