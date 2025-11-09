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
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCategories,
    fetchCategories,
    setError: setTableError,
  } = useCategoryTable();

  const [exportLoading, setExportLoading] = useState(false);
  const [success, setSuccess] = useState('');
  
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setShowProductsModal(true);
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/kategori');
      if (!response.ok) throw new Error('Gagal mengambil data untuk export');
      const data = await response.json();

      let csvContent = 'Nama,Deskripsi,Tanggal Dibuat,Tanggal Diubah\n';
      data.categories.forEach(category => {
        const name = `"${category.name.split('"').join('""')}"`;
        const description = `"${category.description ? category.description.split('"').join('""') : ''}"`;
        const createdAt = `"${new Date(category.createdAt).toLocaleString()}"`;
        const updatedAt = `"${new Date(category.updatedAt).toLocaleString()}"`;
        csvContent += `${name},${description},${createdAt},${updatedAt}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'kategori.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setSuccess('Data kategori berhasil diekspor');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setTableError('Terjadi kesalahan saat mengekspor kategori: ' + err.message);
      setTimeout(() => setTableError(''), 5000);
    } finally {
      setExportLoading(false);
    }
  };

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
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(value) => {
                  setItemsPerPage(value);
                  setCurrentPage(1);
                }}
                onExport={handleExport}
                exportLoading={exportLoading}
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
                onRowClick={handleCategoryClick}
                showActions={false}
              />
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalProducts={totalCategories} // totalProducts is a misnomer here, but it's the prop name
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
