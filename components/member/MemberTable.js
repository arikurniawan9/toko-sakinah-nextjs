import React from 'react';
import Tooltip from '../Tooltip';
import { Edit, Trash2 } from 'lucide-react';

const MemberTable = ({
  members,
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
                checked={members.length > 0 && selectedRows.length === members.length}
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
              Telepon
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
              darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
            }`}>
              Alamat
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
              darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
            }`}>
              Tipe Keanggotaan
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
              darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
            }`}>
              Diskon (%)
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
          {members.length === 0 ? (
            <tr>
              <td colSpan="9" className={`px-6 py-4 text-center text-sm ${
                darkMode ? 'text-gray-400' : 'text-pastel-purple-700'
              }`}>
                {loading ? 'Memuat data...' : 'Tidak ada data member ditemukan'}
              </td>
            </tr>
          ) : (
            members.map((member) => (
              <tr key={member.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-pastel-purple-50'}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(member.id)}
                    onChange={() => {
                      console.log('Individual checkbox onChange fired for ID:', member.id);
                      handleSelectRow(member.id);
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
                  {member.name}
                </td>
                <td className={`px-6 py-4 text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {member.phone || '-'}
                </td>
                <td className={`px-6 py-4 text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                } max-w-xs truncate`}>
                  {member.address || '-'}
                </td>
                <td className={`px-6 py-4 text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    member.membershipType === 'silver' 
                      ? 'bg-gray-100 text-gray-800' 
                      : member.membershipType === 'gold' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-purple-100 text-purple-800'
                  }`}>
                    {member.membershipType.charAt(0).toUpperCase() + member.membershipType.slice(1)}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {member.discount}%
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {new Date(member.createdAt).toLocaleDateString('id-ID')}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {new Date(member.updatedAt).toLocaleDateString('id-ID')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Tooltip content="Edit member">
                    <button
                      onClick={() => handleEdit(member)}
                      className={`mr-2 p-1 rounded ${
                        darkMode ? 'text-pastel-purple-400 hover:text-pastel-purple-300 hover:bg-gray-700' : 'text-pastel-purple-600 hover:text-pastel-purple-800 hover:bg-pastel-purple-100'
                      }`}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Hapus member">
                    <button
                      onClick={() => handleDelete(member.id)}
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

export default MemberTable;
