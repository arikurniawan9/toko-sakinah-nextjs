import React from 'react';
import Tooltip from '../Tooltip';
import { Edit, Trash2 } from 'lucide-react';

const SupplierTable = ({
  suppliers,
  loading,
  darkMode,
  selectedRows,
  handleSelectAll,
  handleSelectRow,
  handleEdit,
  handleDelete,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-pastel-purple-200">
        <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <tr>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 ${
              darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
            }`}>
              <input
                type="checkbox"
                onChange={(e) => {
                  console.log('Select All checkbox onChange fired, checked:', e.target.checked);
                  handleSelectAll(e);
                }}
                checked={selectedRows.length === suppliers.length && suppliers.length > 0}
                className={`h-4 w-4 rounded ${
                  darkMode 
                    ? 'text-purple-600 bg-gray-700 border-gray-600' 
                    : 'text-purple-600 focus:ring-purple-500 border-gray-300'
                }`}
              />
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
              darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
            }`}>
              Nama
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
              darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
            }`}>
              Alamat
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
              darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
            }`}>
              Telepon
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
              darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
            }`}>
              Email
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
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
              darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
            }`}>
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className={`${darkMode ? 'divide-gray-700 bg-gray-800' : 'bg-gray-50'} divide-y ${
          darkMode ? 'divide-gray-700' : 'divide-pastel-purple-200'
        }`}>
          {suppliers.length === 0 ? (
            <tr>
              <td colSpan="8" className={`px-6 py-4 text-center text-sm ${
                darkMode ? 'text-gray-400' : 'text-pastel-purple-700'
              }`}>
                {loading ? 'Memuat data...' : 'Tidak ada data supplier ditemukan'}
              </td>
            </tr>
          ) : (
            suppliers.map((supplier) => (
              <tr key={supplier.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-pastel-purple-50'}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(supplier.id)}
                    onChange={() => {
                      console.log('Individual checkbox onChange fired for ID:', supplier.id);
                      handleSelectRow(supplier.id);
                    }}
                    className={`h-4 w-4 rounded ${
                      darkMode 
                        ? 'text-purple-600 bg-gray-700 border-gray-600' 
                        : 'text-purple-600 focus:ring-purple-500 border-gray-300'
                    }`}
                  />
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {supplier.name}
                </td>
                <td className={`px-6 py-4 text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                } max-w-xs truncate`}>
                  {supplier.address || '-'}
                </td>
                <td className={`px-6 py-4 text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {supplier.phone || '-'}
                </td>
                <td className={`px-6 py-4 text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {supplier.email || '-'}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {new Date(supplier.createdAt).toLocaleDateString('id-ID')}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {new Date(supplier.updatedAt).toLocaleDateString('id-ID')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Tooltip content="Edit supplier">
                    <button
                      onClick={() => handleEdit(supplier)}
                      className={`mr-2 p-1 rounded ${
                        darkMode ? 'text-purple-400 hover:text-purple-300 hover:bg-gray-700' : 'text-purple-600 hover:text-purple-800 hover:bg-purple-100'
                      }`}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Hapus supplier">
                    <button
                      onClick={() => handleDelete(supplier.id)}
                      className={`p-1 rounded ${
                        darkMode ? 'text-red-500 hover:text-red-400 hover:bg-gray-700' : 'text-red-600 hover:text-red-800 hover:bg-red-100'
                      }`}
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
};

export default SupplierTable;
