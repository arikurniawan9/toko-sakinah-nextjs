// components/supplier/SupplierToolbar.js
'use client';

import { Plus, Search, LayoutGrid, Table, Upload, Download, Trash2, Loader2, FileText } from 'lucide-react';
import Tooltip from '../Tooltip';
import DownloadTemplate from './DownloadTemplate';

export default function SupplierToolbar({
  searchTerm,
  setSearchTerm,
  onAddNew,
  onDeleteMultiple,
  selectedRowsCount,
  onExport,
  onExportPDF,
  onExportGridPDF, // ADDED
  onImport,
  importLoading,
  exportLoading,
  pdfExportLoading,
  gridPdfExportLoading, // ADDED
  view,
  setView,
  darkMode,
}) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
      {/* Search Input */}
      <div className="relative w-full md:max-w-md">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        <input
          type="text"
          placeholder="Cari supplier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700 text-white focus:ring-cyan-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-cyan-500'} focus:outline-none focus:ring-2`}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
        {/* View Toggle */}
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-700">
          <Tooltip content="Tampilan Grid">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-l-lg ${view === 'grid' ? 'bg-cyan-600 text-white' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100')}`}
              aria-label="Tampilan Grid"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
          </Tooltip>
          <Tooltip content="Tampilan Tabel">
            <button
              onClick={() => setView('table')}
              className={`p-2 rounded-r-lg ${view === 'table' ? 'bg-cyan-600 text-white' : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100')}`}
              aria-label="Tampilan Tabel"
            >
              <Table className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>

        {/* Download Template Button */}
        <DownloadTemplate darkMode={darkMode} />

        {/* Import Button */}
        <Tooltip content="Import data supplier">
          <label
            htmlFor="import-file"
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer ${
              importLoading
                ? 'bg-gray-400 text-gray-700'
                : (darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
            }`}
          >
            {importLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span>Import</span>
              </>
            )}
            <input id="import-file" type="file" accept=".xlsx,.xls,.csv" onChange={onImport} className="hidden" disabled={importLoading} />
          </label>
        </Tooltip>

        {/* Export Button */}
        <Tooltip content="Export data supplier (XLSX)">
          <button
            onClick={onExport}
            disabled={exportLoading}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors ${
              exportLoading
                ? 'bg-gray-400 text-gray-700'
                : (darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
            }`}
          >
            {exportLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                <span>Export</span>
              </>
            )}
          </button>
        </Tooltip>

        {/* Export PDF Button (Table View) */}
        {view === 'table' && (
          <Tooltip content="Export data supplier (PDF)">
            <button
              onClick={onExportPDF}
              disabled={pdfExportLoading}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors ${
                pdfExportLoading
                  ? 'bg-gray-400 text-gray-700'
                  : (darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
              }`}
            >
              {pdfExportLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5" />
                  <span>Export PDF</span>
                </>
              )}
            </button>
          </Tooltip>
        )}

        {/* Export PDF Button (Grid View) */}
        {view === 'grid' && (
          <Tooltip content="Export grid supplier (PDF)">
            <button
              onClick={onExportGridPDF}
              disabled={gridPdfExportLoading}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors ${
                gridPdfExportLoading
                  ? 'bg-gray-400 text-gray-700'
                  : (darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
              }`}
            >
              {gridPdfExportLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Generating Grid PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5" />
                  <span>Export Grid PDF</span>
                </>
              )}
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
