import React from 'react';
import Tooltip from '@/components/Tooltip';
import { Edit, Trash2, Inbox } from 'lucide-react';

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
    </td>
  </tr>
);

const CategoryTable = ({
  categories,
  loading,
  selectedRows,
  handleSelectAll,
  handleSelectRow,
  handleEdit,
  handleDelete,
  isAdmin,
}) => {
  const tableHeaderClasses = "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider";

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              {isAdmin && <th scope="col" className={tableHeaderClasses}><input type="checkbox" className="h-4 w-4 rounded" disabled /></th>}
              <th scope="col" className={tableHeaderClasses}>Nama</th>
              <th scope="col" className={tableHeaderClasses}>Deskripsi</th>
              <th scope="col" className={tableHeaderClasses}>Tanggal Dibuat</th>
              <th scope="col" className={tableHeaderClasses}>Tanggal Diubah</th>
              {isAdmin && <th scope="col" className={tableHeaderClasses}>Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </tbody>
        </table>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-16">
        <Inbox className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-semibold">Tidak Ada Kategori</h3>
        <p className="mt-1 text-sm text-gray-500">Belum ada kategori yang ditambahkan.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            {isAdmin && (
              <th scope="col" className={tableHeaderClasses}>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={categories.length > 0 && selectedRows.length === categories.length}
                  className="h-4 w-4 rounded bg-transparent border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                />
              </th>
            )}
            <th scope="col" className={tableHeaderClasses}>Nama</th>
            <th scope="col" className={tableHeaderClasses}>Deskripsi</th>
            <th scope="col" className={tableHeaderClasses}>Tanggal Dibuat</th>
            <th scope="col" className={tableHeaderClasses}>Tanggal Diubah</th>
            {isAdmin && <th scope="col" className={tableHeaderClasses}>Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {categories.map((category) => (
            <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              {isAdmin && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(category.id)}
                    onChange={() => handleSelectRow(category.id)}
                    className="h-4 w-4 rounded bg-transparent border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                  />
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {category.name}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                {category.description || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {new Date(category.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {new Date(category.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
              </td>
              {isAdmin && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Tooltip content="Edit kategori">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-blue-500 dark:hover:bg-gray-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Hapus kategori">
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CategoryTable;
