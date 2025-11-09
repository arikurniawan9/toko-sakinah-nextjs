// components/produk/ProductTable.js
'use client';

import { Edit, Trash2, Info } from 'lucide-react';
import Tooltip from '../Tooltip';

export default function ProductTable({
  products,
  loading,
  darkMode,
  selectedRows,
  handleSelectAll,
  handleSelectRow,
  onEdit,
  onDelete,
  onViewDetails,
  showActions = true, // Add showActions prop with default true
}) {
  if (loading && products.length === 0) {
    return (
      <div className="animate-pulse">
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} h-12 rounded mb-4`}></div>
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} h-96 rounded`}></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-pastel-purple-200">
        <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
          <tr>
            {showActions && ( // Conditionally render select all checkbox header
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 ${darkMode ? 'text-pastel-purple-300' : 'text-pastel-purple-700'}`}>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={products.length > 0 && selectedRows.length === products.length}
                  className={`h-4 w-4 rounded ${darkMode ? 'text-pastel-purple-600 bg-gray-700 border-gray-600' : 'text-pastel-purple-600 focus:ring-pastel-purple-500 border-pastel-purple-300'}`}
                />
              </th>
            )}
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-pastel-purple-300' : 'text-pastel-purple-700'}`}>
              Kode
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-pastel-purple-300' : 'text-pastel-purple-700'}`}>
              Nama
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-pastel-purple-300' : 'text-pastel-purple-700'}`}>
              Harga
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-pastel-purple-300' : 'text-pastel-purple-700'}`}>
              Stok
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-pastel-purple-300' : 'text-pastel-purple-700'}`}>
              Kategori
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-pastel-purple-300' : 'text-pastel-purple-700'}`}>
              Supplier
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-pastel-purple-300' : 'text-pastel-purple-700'}`}>
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className={`${darkMode ? 'divide-gray-700 bg-gray-950' : 'bg-gray-50'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-pastel-purple-200'}`}>
          {products.length === 0 ? (
            <tr>
              <td colSpan={showActions ? "8" : "7"} className={`px-6 py-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-pastel-purple-700'}`}>
                {loading ? 'Memuat data...' : 'Tidak ada data produk ditemukan'}
              </td>
            </tr>
          ) : (
            products.map((product) => {
              const basePrice = product.priceTiers?.sort((a, b) => a.minQty - b.minQty)[0]?.price || 0;
              return (
              <tr key={product.id} className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-pastel-purple-50'}`}>
                {showActions && ( // Conditionally render individual checkbox
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(product.id)}
                      onChange={() => handleSelectRow(product.id)}
                      className={`h-4 w-4 rounded ${darkMode ? 'text-purple-600 bg-gray-700 border-gray-600' : 'text-purple-600 focus:ring-purple-500 border-gray-300'}`}
                    />
                  </td>
                )}
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {product.productCode}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {product.name}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Rp {basePrice.toLocaleString('id-ID')}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {product.stock || 0}
                </td>
                <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-xs truncate`}>
                  {product.category?.name || '-'}
                </td>
                <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-xs truncate`}>
                  {product.supplier?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Tooltip content="Lihat Detail">
                    <button
                      onClick={() => onViewDetails(product)}
                      className={`mr-2 p-1 rounded ${darkMode ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-700' : 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'}`}
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  {showActions && ( // Conditionally render Edit and Delete buttons
                    <>
                      <Tooltip content="Edit produk">
                        <button
                          onClick={() => onEdit(product)}
                          className={`mr-2 p-1 rounded ${darkMode ? 'text-purple-400 hover:text-purple-300 hover:bg-gray-700' : 'text-purple-600 hover:text-purple-800 hover:bg-purple-100'}`}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Hapus produk">
                        <button
                          onClick={() => onDelete(product.id)}
                          className={`p-1 rounded ${darkMode ? 'text-red-500 hover:text-red-400 hover:bg-gray-700' : 'text-red-600 hover:text-red-800 hover:bg-red-100'}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    </>
                  )}
                </td>
              </tr>
            )})
          )}
        </tbody>
      </table>
    </div>
  );
}
