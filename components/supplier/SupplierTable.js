// components/supplier/SupplierTable.js
'use client';

import { Edit, Trash2, Info } from 'lucide-react';
import Tooltip from '../Tooltip';

export default function SupplierTable({
  suppliers,
  loading,
  darkMode,
  selectedRows,
  handleSelectAll,
  handleSelectRow,
  onEdit,
  onDelete,
  // onViewDetails, // Not needed for Supplier, as details are on card
  showActions = true,
}) {
  if (loading && suppliers.length === 0) {
    return (
      <div className="animate-pulse">
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} h-12 rounded mb-4`}></div>
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} h-96 rounded`}></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
          <tr>
            {showActions && (
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={suppliers.length > 0 && selectedRows.length === suppliers.length}
                  className={`h-4 w-4 rounded ${darkMode ? 'text-cyan-600 bg-gray-700 border-gray-600' : 'text-cyan-600 focus:ring-cyan-500 border-gray-300'}`}
                />
              </th>
            )}
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Nama
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Alamat
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Telepon
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Email
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Produk
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className={`${darkMode ? 'divide-gray-700 bg-gray-950' : 'bg-gray-50'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {suppliers.length === 0 ? (
            <tr>
              <td colSpan={showActions ? "7" : "6"} className={`px-6 py-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                {loading ? 'Memuat data...' : 'Tidak ada data supplier ditemukan'}
              </td>
            </tr>
          ) : (
            suppliers.map((supplier) => (
              <tr key={supplier.id} className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                {showActions && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(supplier.id)}
                      onChange={() => handleSelectRow(supplier.id)}
                      className={`h-4 w-4 rounded ${darkMode ? 'text-cyan-600 bg-gray-700 border-gray-600' : 'text-cyan-600 focus:ring-cyan-500 border-gray-300'}`}
                    />
                  </td>
                )}
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {supplier.name}
                </td>
                <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-xs truncate`}>
                  {supplier.address || '-'}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {supplier.phone || '-'}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {supplier.email || '-'}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {supplier.productCount || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Tooltip content="Edit supplier">
                    <button
                      onClick={() => onEdit(supplier)}
                      className={`mr-2 p-1 rounded ${darkMode ? 'text-cyan-400 hover:text-cyan-300 hover:bg-gray-700' : 'text-cyan-600 hover:text-cyan-800 hover:bg-cyan-100'}`}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Hapus supplier">
                    <button
                      onClick={() => onDelete(supplier.id)}
                      className={`p-1 rounded ${darkMode ? 'text-red-500 hover:text-red-400 hover:bg-gray-700' : 'text-red-600 hover:text-red-800 hover:bg-red-100'}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
