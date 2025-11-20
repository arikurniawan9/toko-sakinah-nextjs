// components/DataTable.js
import { useState, useEffect } from 'react';
import { Search, Plus, Download, Trash2, Edit, Eye, Filter, SortAsc, SortDesc, MinusCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner'; // Import LoadingSpinner

export default function DataTable({
  data,
  columns,
  onAdd,
  onDelete,
  onSearch,
  onExport,
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
  showItemsPerPage = true,
  pagination = null,
  onSort = null,
  currentSort = null,
  onItemsPerPageChange = null,
  onDeleteMultiple = null,
  selectedRowsCount = 0,
  mobileColumns = [],
  rowActions = null
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false); // New state to track if component is mounted

  // Check screen size to determine mobile view
  useEffect(() => {
    setMounted(true); // Component is mounted on client
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Render desktop view by default on server, switch to mobile only after mounted on client
  const renderMobileView = mounted && isMobile;

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    onSearch?.(e.target.value);
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

  // Determine which columns to show based on screen size
  const visibleColumns = isMobile && mobileColumns.length > 0
    ? columns.filter(col => mobileColumns.includes(col.key))
    : columns;

  return (
    <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
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
                className={`mb-3 p-4 rounded-lg border ${
                  darkMode ? 'bg-gray-750 border-gray-600' : 'bg-white border-gray-200'
                } ${selectedRows.includes(row.id) ? (darkMode ? 'ring-2 ring-cyan-500' : 'ring-2 ring-cyan-500') : ''}`}
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
                      <div className="flex justify-end space-x-2"> {/* Match desktop wrapper for consistency */}
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
                    } ${column.sortable ? 'hover:bg-gray-100 dark:hover:bg-gray-600' : ''}`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center">
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
                          ) : data && data.length > 0 ? (                data.map((row, index) => (
                  <tr
                    key={row.id || index}
                    className={`group ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${
                      selectedRows.includes(row.id) ? (darkMode ? 'bg-gray-700' : 'bg-blue-50') : ''
                    } transition-colors`}
                  >
                    {onSelectRow && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(row.id)}
                          onChange={() => onSelectRow(row.id)}
                          className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-900'
                        }`}
                      >
                        {column.render ? column.render(row[column.key], row, index) :
                          (row[column.key] !== undefined && row[column.key] !== null ? row[column.key] : '-')}
                      </td>
                    ))}
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
                ))
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