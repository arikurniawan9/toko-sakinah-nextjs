// app/kasir/kategori/page.js
'use client';

import { useState } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Sidebar from '../../../components/Sidebar';
import { useDarkMode } from '../../../components/DarkModeContext';
import { useSession } from 'next-auth/react';

import { useCategoryTable } from '../../../lib/hooks/useCategoryTable';

import CategoryTable from '../../../components/kategori/CategoryTable';
import KasirCategoryToolbar from '../../../components/kasir/KasirCategoryToolbar';
import Pagination from '../../../components/produk/Pagination'; // Reusing product pagination
import CategoryProductsModal from '../../../components/kasir/CategoryProductsModal'; // Import the new modal

export default function KasirCategoryView() {
  const { darkMode } = useDarkMode();
  const { data: session } = useSession();
  const isCashier = session?.user?.role === 'CASHIER';

  const {
    categories,
    loading,
    error: tableError,
    setError: setTableError,
    searchTerm,
    setSearchTerm,
    pagination, // Get pagination object
    setPagination, // Get setPagination function
    fetchCategories,
  } = useCategoryTable();

  const [exportLoading, setExportLoading] = useState(false); // This state is no longer needed
  const [success, setSuccess] = useState('');
  
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setShowProductsModal(true);
  };

  // The handleExport function is no longer needed
  // const handleExport = async () => {
  //   setExportLoading(true);
  //   try {
  //     const response = await fetch('/api/kategori?limit=0'); // Fetch all categories for export
  //     if (!response.ok) throw new Error('Gagal mengambil data untuk export');
  //     const data = await response.json();

  //     let csvContent = 'Nama,Deskripsi,Tanggal Dibuat,Tanggal Diubah\n';
  //     data.categories.forEach(category => {
  //       const name = `"${(category.name || '').replace(/"/g, '""')}"`;
  //       const description = `"${(category.description || '').replace(/"/g, '""')}"`;
  //       const createdAt = `"${new Date(category.createdAt).toLocaleString('id-ID')}"`;
  //       const updatedAt = `"${new Date(category.updatedAt).toLocaleString('id-ID')}"`;
  //       csvContent += `${name},${description},${createdAt},${updatedAt}\n`;
  //     });

  //     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  //     const link = document.createElement('a');
  //     const url = URL.createObjectURL(blob);
  //     link.setAttribute('href', url);
  //     link.setAttribute('download', `kategori-${new Date().toISOString().slice(0, 10)}.csv`);
  //     link.style.visibility = 'hidden';
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //     setSuccess('Data kategori berhasil diekspor');
  //     setTimeout(() => setSuccess(''), 3000);
  //   } catch (err) {
  //     setTableError('Terjadi kesalahan saat mengekspor kategori: ' + err.message);
  //     setTimeout(() => setTableError(''), 5000);
  //   } finally {
  //     setExportLoading(false);
  //   }
  // };

  const error = tableError;

  return (
    <ProtectedRoute requiredRole="CASHIER">
      <Sidebar>
        <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900 text-gray-100' : ''}`}>
          <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Daftar Kategori
          </h1>

          <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-pastel-purple-700' : 'bg-white border-gray-200'} border`}>
            <div className="p-4 sm:p-6">
              <KasirCategoryToolbar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                itemsPerPage={pagination.limit}
                setItemsPerPage={(value) => setPagination(p => ({ ...p, limit: value, page: 1 }))}
                // onExport={handleExport} // Removed
                // exportLoading={exportLoading} // Removed
                darkMode={darkMode}
              />

              {error && (
                <div className={`my-4 p-4 ${darkMode ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'} rounded-md`}>
                  {error}
                </div>
              )}
              {success && (
                <div className={`my-4 p-4 ${darkMode ? 'bg-green-900/30 border-green-700 text-green-200' : 'bg-green-50 border-green-200 text-green-700'} rounded-md`}>
                  {success}
                </div>
              )}

              <CategoryTable
                categories={categories}
                loading={loading}
                darkMode={darkMode}
                selectedRows={[]}
                onViewDetails={handleCategoryClick}
                showActions={false}
              />
            </div>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              setCurrentPage={(page) => setPagination(p => ({ ...p, page }))}
              itemsPerPage={pagination.limit}
              totalItems={pagination.total}
              darkMode={darkMode}
            />
          </div>
        </main>
        {showProductsModal && (
          <CategoryProductsModal
            category={selectedCategory}
            onClose={() => setShowProductsModal(false)}
            darkMode={darkMode}
          />
        )}
      </Sidebar>
    </ProtectedRoute>
  );
}
