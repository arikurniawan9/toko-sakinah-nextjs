import React from 'react';
import Tooltip from '../Tooltip';
import { Download, Upload, X, Search, Trash2, LayoutGrid, Table } from 'lucide-react';
import DownloadTemplate from './DownloadTemplate';

const KasirToolbar = ({
  searchTerm,
  setSearchTerm,
  itemsPerPage,
  setItemsPerPage,
  onDeleteMultiple,
  selectedRowsCount,
  onExport,
  onImport,
  importLoading,
  exportLoading,
  darkMode,
  view,
  setView,
}) => {
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
            placeholder="Cari kasir..."
            className={`w-full pl-10 pr-4 py-2 border rounded-md shadow-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
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
            className={`w-full px-3 py-2 border rounded-md shadow-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
          >
            <option value={10}>10/halaman</option>
            <option value={20}>20/halaman</option>
            <option value={50}>50/halaman</option>
          </select>
        </div>
      </div>

      {/* Right side: Action Buttons */}
      <div className="flex items-center justify-start md:justify-end flex-wrap gap-3">
        {/* View Toggle */}
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-700">
          <Tooltip content="Tampilan Grid">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-l-lg ${view === 'grid' ? 'bg-purple-600 text-white' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100')}`}
              aria-label="Tampilan Grid"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
          </Tooltip>
          <Tooltip content="Tampilan Tabel">
            <button
              onClick={() => setView('table')}
              className={`p-2 rounded-r-lg ${view === 'table' ? 'bg-purple-600 text-white' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100')}`}
              aria-label="Tampilan Tabel"
            >
              <Table className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>

        {selectedRowsCount > 0 && (
          <Tooltip content={`Hapus ${selectedRowsCount} kasir terpilih`}>
            <button
              onClick={onDeleteMultiple}
              className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4" />
              <span className="ml-2">{selectedRowsCount}</span>
            </button>
          </Tooltip>
        )}
        
        {/* Download Template Button */}
        <DownloadTemplate darkMode={darkMode} />

        <Tooltip content="Import data dari Excel">
          <label className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
            importLoading
              ? 'text-gray-300 bg-gray-700 cursor-not-allowed'
              : (darkMode ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-gray-100 hover:bg-gray-200')
          } cursor-pointer`}>
            {importLoading ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={onImport}
              className="hidden"
              disabled={importLoading}
            />
          </label>
        </Tooltip>
        <Tooltip content="Export data ke file">
          <button
            onClick={onExport}
            disabled={exportLoading}
            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${darkMode ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
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
      </div>
    </div>
  );
};

export default KasirToolbar;