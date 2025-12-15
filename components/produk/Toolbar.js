// components/produk/Toolbar.js
'use client';

import { Plus, Download, Upload, Trash2, Search, Folder, X } from 'lucide-react';
import Tooltip from '../Tooltip';

export default function Toolbar({
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
            placeholder="Cari produk..."
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

      {/* Right side: Action Buttons */}
      <div className="flex items-center justify-start md:justify-end flex-wrap gap-2">
        {selectedRowsCount > 0 && (
          <Tooltip content={`Hapus ${selectedRowsCount} produk terpilih`} darkMode={darkMode}>
            <button
              onClick={onDeleteMultiple}
              className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4" />
              <span className="ml-2">{selectedRowsCount}</span>
            </button>
          </Tooltip>
        )}
        <Tooltip content="Import produk dari file" darkMode={darkMode}>
          <label className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${darkMode ? 'text-gray-200 bg-gray-800 hover:bg-gray-700' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}>
            <Upload className="h-4 w-4" />
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={onImport}
              disabled={importLoading}
            />
          </label>
        </Tooltip>
        <Tooltip content="Export data ke file" darkMode={darkMode}>
          <button
            onClick={onExport}
            disabled={exportLoading}
            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${darkMode ? 'text-gray-200 bg-gray-800 hover:bg-gray-700' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
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
        <Tooltip content="Template Produk" darkMode={darkMode}>
          <a
            href="/templates/template-produk.xlsx"
            download="template-produk.xlsx"
            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${darkMode ? 'text-gray-200 bg-gray-800 hover:bg-gray-700' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
          >
            <Folder className="h-4 w-4" />
          </a>
        </Tooltip>
        <Tooltip content="Tambah produk baru" darkMode={darkMode}>
          <button
            onClick={onAddNew}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Baru</span>
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
