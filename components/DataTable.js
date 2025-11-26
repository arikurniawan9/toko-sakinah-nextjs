// components/DataTable.js
import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Download, Trash2, Edit, Eye, Filter, SortAsc, SortDesc, MinusCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Upload, FileText } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner'; // Import LoadingSpinner

export default function DataTable({
  data,
  columns,
  onAdd,
  onDelete,
  onSearch,
  onExport,
  onExportPDF, // ADDED: Export PDF handler
  loading = false,
  selectedRows = [],
  onSelectAll,
  onSelectRow,
  darkMode = false,
  actions = true,
  showToolbar = true,
  showSearch = true,
  showAdd = true,
  showExport = true,
  showExportPDF = false, // ADDED: Show export PDF button
  showItemsPerPage = true,
  pagination = null,
  onSort = null,
  currentSort = null,
  onItemsPerPageChange = null,
  onDeleteMultiple = null,
  selectedRowsCount = 0,
  mobileColumns = [],
  rowActions = null,
  onImport = null, // ADDED: Import handler
  showImport = true, // ADDED: Show import button
  additionalActions = [], // ADDED: Additional actions for toolbar
  showFilters = false, // ADDED: Show filter toggle
  filterOptions = [], // ADDED: Filter options
  filterValues = {}, // ADDED: Current filter values
  onFilterChange = null, // ADDED: Filter change handler
  onToggleFilters = null // ADDED: Toggle filters handler
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false); // New state to track if component is mounted
  const searchTimeoutRef = useRef(null); // Ref to hold the debounce timeout

  // Check screen size to determine mobile view
  useEffect(() => {
    // Only set mounted to true after component is mounted on client
    setMounted(true);

    const checkScreenSize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };

    // Check screen size after component is mounted
    if (typeof window !== 'undefined') {
      checkScreenSize();
      window.addEventListener('resize', checkScreenSize);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', checkScreenSize);
      }
      // Clear timeout on unmount to prevent memory leaks
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Fallback to false if not mounted to prevent hydration mismatch
  const renderMobileView = mounted && isMobile;

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear the previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set a new timeout to call onSearch after 300ms (debouncing)
    searchTimeoutRef.current = setTimeout(() => {
      // Only trigger search if the search term is at least 2 characters long or empty
      if (value.length >= 2 || value.length === 0) {
        onSearch?.(value);
      }
    }, 300); // 300ms delay
  };

  const handleSort = (columnKey) => {
    if (onSort) {
      const direction = currentSort?.key === columnKey && currentSort.direction === 'asc' ? 'desc' : 'asc';
      onSort({ key: columnKey, direction });
    }
  };

  const getSortIcon = (columnKey) => {
    if (!currentSort || currentSort.key !== columnKey) return null;
    return currentSort.direction === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  const handleItemsPerPageChange = (e) => {
    const value = parseInt(e.target.value);
    onItemsPerPageChange?.(value);
  };

  // Show loading placeholder during hydration to prevent mismatch
  if (!mounted) {
    return (
      <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-grow">
              {showSearch && (
                <div className="relative flex-grow sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari..."
                    value=""
                    onChange={() => {}}
                    className={`pl-10 pr-4 py-2 border rounded-lg w-full ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  // Determine which columns to show based on screen size
  const visibleColumns = isMobile && mobileColumns.length > 0
    ? columns.filter(col => mobileColumns.includes(col.key))
    : columns;

  return (
    <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border relative z-0`}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-grow">
              {showSearch && (
                <div className="relative flex-grow sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className={`pl-10 pr-4 py-2 border rounded-lg w-full ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              )}

              {onDeleteMultiple && selectedRowsCount > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onDeleteMultiple}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    title={`Hapus (${selectedRowsCount})`}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {onItemsPerPageChange && showItemsPerPage && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">Tampil:</span>
                  <select
                    value={pagination?.itemsPerPage || 10}
                    onChange={handleItemsPerPageChange}
                    className={`px-2 py-1 border rounded text-sm ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              )}

              <div className="flex gap-2">
                {additionalActions.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={action.onClick}
                      className={`p-2 rounded-lg hover:opacity-90 transition-colors ${action.className}`}
                      title={action.label}
                    >
                      {IconComponent && <IconComponent className="h-4 w-4" />}
                    </button>
                  );
                })}
                {showAdd && onAdd && (
                  <button
                    onClick={onAdd}
                    className="p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                    title="Tambah"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
                {showExport && onExport && (
                  <button
                    onClick={onExport}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title="Ekspor"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                )}
                {showExportPDF && onExportPDF && (
                  <button
                    onClick={onExportPDF}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title="Ekspor PDF"
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                )}
                {showImport && onImport && (
                  <button
                    onClick={onImport}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title="Impor"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile View (Card-like) */}
      {isMobile && (
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center items-center py-8 h-32">
              <LoadingSpinner />
            </div>
          ) : data && data.length > 0 ? (
            data.map((row, index) => (
              <div
                key={row.id || index}
                className={`
                  mb-3 p-4 rounded-lg border
                  ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}
                  ${selectedRows.includes(row.id) ? (darkMode ? 'ring-2 ring-cyan-500' : 'ring-2 ring-cyan-500') : ''}
                `.trim().replace(/\s+/g, ' ')}
              >
                {/* Mobile Row Header */}
                <div className="flex justify-between items-start mb-2">
                  {onSelectRow && (
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.id)}
                      onChange={() => onSelectRow(row.id)}
                      className="mt-1 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    />
                  )}
                  <div className="flex gap-1 ml-2">
                    {actions && rowActions && typeof rowActions === 'function' && (
                      <div className="flex justify-end space-x-2">
                        {rowActions(row)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Content */}
                <div className="space-y-1">
                  {visibleColumns.map((column) => (
                    <div key={column.key} className="flex justify-between text-sm">
                      <span className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {column.title}:
                      </span>
                      <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>
                        {column.render ? column.render(row[column.key], row) :
                          (row[column.key] !== undefined && row[column.key] !== null ? row[column.key] : '-')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Tidak ada data ditemukan
            </div>
          )}
        </div>
      )}

      {/* Desktop View (Table) */}
      {!isMobile && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                {onSelectAll && (
                  <th className="w-12 px-6 py-3">
                    <input
                      type="checkbox"
                      onChange={onSelectAll}
                      className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${
                      darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                    } ${column.sortable ? 'hover:bg-gray-100 dark:hover:bg-gray-600' : ''} ${column.className || ''}`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className={column.className?.includes('text-center') ? 'flex justify-center items-center' : 'flex items-center'}>
                      {column.title}
                      {column.sortable && (
                        <div className="ml-1">
                          {getSortIcon(column.key)}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
                {actions && (
                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
                          <tbody className={`divide-y ${darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                          {loading ? (
                            <tr>
                              <td colSpan={columns.length + (actions ? 2 : (onSelectAll ? 1 : 0))} className="px-6 py-4 text-center">
                                <div className="flex justify-center items-center py-8 h-32">
                                  <LoadingSpinner />
                                </div>
                              </td>
                            </tr>
                          ) : data && Array.isArray(data) && data.length > 0 ? (
                            data.map((row, index) => {
                              // Validasi bahwa row memiliki id atau index untuk key
                              if (!row) {
                                console.warn('Invalid data row:', row);
                                return null;
                              }

                              const rowId = row.id || index;

                              return (
                                <tr
                                  key={rowId}
                                  className={`group ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${
                                    selectedRows.includes(rowId) ? (darkMode ? 'bg-gray-700' : 'bg-blue-50') : ''
                                  } transition-colors`}
                                >
                                  {onSelectRow && (
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <input
                                        type="checkbox"
                                        checked={selectedRows.includes(rowId)}
                                        onChange={() => onSelectRow(rowId)}
                                        className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                      />
                                    </td>
                                  )}
                                  {columns.map((column) => {
                                    if (!column || !column.key) {
                                      console.warn('Invalid column definition:', column);
                                      return null;
                                    }

                                    return (
                                      <td
                                        key={column.key}
                                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                                          darkMode ? 'text-gray-300' : 'text-gray-900'
                                        }`}
                                      >
                                        {column.render
                                          ? (typeof column.render === 'function'
                                              ? column.render(row[column.key], row, index)
                                              : column.render)
                                          : (row[column.key] !== undefined && row[column.key] !== null ? row[column.key] : '-')}
                                      </td>
                                    );
                                  }).filter(Boolean)}
                                  {actions && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      <div className="flex justify-end space-x-2">
                                        {rowActions && typeof rowActions === 'function' && (
                                          <>
                                            {rowActions(row)}
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            }).filter(Boolean)
                          ) : (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 2 : (onSelectAll ? 1 : 0))}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    Tidak ada data ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className={`px-6 py-3 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Menampilkan {pagination.startIndex} - {pagination.endIndex} dari {pagination.totalItems} item
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className={`flex items-center px-3 py-1 rounded-md transition-colors duration-200 ${
                  pagination.currentPage === 1
                    ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1">Sebelumnya</span>
              </button>

              {/* Page Number Buttons */}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => pagination.onPageChange(page)}
                  className={`px-3 py-1 rounded-md transition-colors duration-200 ${
                    pagination.currentPage === page
                      ? 'bg-blue-600 text-white dark:bg-blue-500'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className={`flex items-center px-3 py-1 rounded-md transition-colors duration-200 ${
                  pagination.currentPage === pagination.totalPages
                    ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span className="mr-1">Berikutnya</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}