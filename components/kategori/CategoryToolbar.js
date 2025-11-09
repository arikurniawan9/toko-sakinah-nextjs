'use client';

import { Plus, Download, Upload, Trash2, Search, Folder, X } from 'lucide-react';
import Tooltip from '@/components/Tooltip';

export default function CategoryToolbar({ 
  searchTerm, 
  setSearchTerm, 
  itemsPerPage, 
  setItemsPerPage, 
  onAddNew, 
  onDeleteMultiple, 
  selectedRowsCount, 
  onExport, 
  onImport, 
  importLoading, 
  exportLoading, 
  isAdmin
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      {/* Left side: Search and Filters */}
      <div className="flex-grow flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <label htmlFor="search" className="sr-only">Cari</label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kategori..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-200" />
            </button>
          )}
        </div>
        <div className="w-full sm:w-auto">
          <label htmlFor="itemsPerPage" className="sr-only">Items per page</label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
          >
            <option value={10}>10/halaman</option>
            <option value={20}>20/halaman</option>
            <option value={50}>50/halaman</option>
          </select>
        </div>
      </div>

      {/* Right side: Action Buttons */}
      {isAdmin && (
        <div className="flex items-center justify-start md:justify-end flex-wrap gap-2">
          {selectedRowsCount > 0 && (
            <Tooltip content={`Hapus ${selectedRowsCount} kategori terpilih`}>
              <button
                onClick={onDeleteMultiple}
                className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4" />
                <span className="ml-2 sm:hidden lg:inline">{selectedRowsCount}</span>
              </button>
            </Tooltip>
          )}
          <Tooltip content="Import data dari file (segera hadir)">
            <label className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg shadow-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 opacity-50 cursor-not-allowed">
              <Upload className="h-4 w-4" />
              <input type="file" className="hidden" disabled />
            </label>
          </Tooltip>
          <Tooltip content="Export data ke CSV">
            <button
              onClick={onExport}
              disabled={exportLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {exportLoading ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Download className="h-4 w-4" />
              )}
            </button>
          </Tooltip>
          <Tooltip content="Tambah kategori baru">
            <button
              onClick={onAddNew}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Plus className="h-4 w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Baru</span>
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
}