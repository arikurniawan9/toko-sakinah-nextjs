import React from 'react';
import Tooltip from '../Tooltip';
import { Edit, Trash2 } from 'lucide-react';

const CategoryTable = ({
  categories,
  loading,
  darkMode,
  selectedRows,
  handleSelectAll,
  handleSelectRow,
  handleEdit,
  handleDelete,
  onRowClick, // Add onRowClick prop
  showActions = true,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-pastel-purple-200">
        <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <tr>
            {showActions && (
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 ${
                darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
              }`}>
                <input
                  type="checkbox"
                  onChange={(e) => handleSelectAll && handleSelectAll(e)}
                  checked={categories.length > 0 && selectedRows.length === categories.length}
                  className={`h-4 w-4 rounded ${
                    darkMode
                      ? 'text-purple-600 bg-gray-700 border-gray-600'
                      : 'text-purple-600 focus:ring-purple-500 border-gray-300'
                  }`}
                />
              </th>
            )}
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
              darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
            }`}>
              Nama
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
              darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
            }`}>
              Deskripsi
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
              darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
            }`}>
              Tanggal Dibuat
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
              darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
            }`}>
              Tanggal Diubah
            </th>
            {showActions && (
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
              }`}>
                Aksi
              </th>
            )}
          </tr>
        </thead>
        <tbody className={`${darkMode ? 'divide-gray-700 bg-gray-800' : 'bg-gray-50'} divide-y ${
          darkMode ? 'divide-gray-700' : 'divide-pastel-purple-200'
        }`}>
          {categories.length === 0 ? (
            <tr>
              <td colSpan={showActions ? "6" : "4"} className={`px-6 py-4 text-center text-sm ${
                darkMode ? 'text-gray-400' : 'text-pastel-purple-700'
              }`}>
                {loading ? 'Memuat data...' : 'Tidak ada data kategori ditemukan'}
              </td>
            </tr>
          ) : (
            categories.map((category) => (
              <tr 
                key={category.id} 
                onClick={() => onRowClick && onRowClick(category)}
                className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-purple-50'} ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {showActions && (
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(category.id)}
                      onChange={() => handleSelectRow && handleSelectRow(category.id)}
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? 'text-purple-600 bg-gray-700 border-gray-600'
                          : 'text-purple-600 focus:ring-purple-500 border-gray-300'
                      }`}
                    />
                  </td>
                )}
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {category.name}
                </td>
                <td className={`px-6 py-4 text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                } max-w-xs truncate`}>
                  {category.description || '-'}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {new Date(category.createdAt).toLocaleDateString('id-ID')}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {new Date(category.updatedAt).toLocaleDateString('id-ID')}
                </td>
                {showActions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                    <Tooltip content="Edit kategori">
                      <button
                        onClick={() => handleEdit && handleEdit(category)}
                        className={`mr-2 p-1 rounded ${
                          darkMode ? 'text-purple-400 hover:text-purple-300 hover:bg-gray-700' : 'text-purple-600 hover:text-purple-800 hover:bg-purple-100'
                        }`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Hapus kategori">
                      <button
                        onClick={() => handleDelete && handleDelete(category.id)}
                        className={`p-1 rounded ${
                          darkMode ? 'text-red-500 hover:text-red-400 hover:bg-gray-700' : 'text-red-600 hover:text-red-800 hover:bg-red-100'
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
export default CategoryTable;