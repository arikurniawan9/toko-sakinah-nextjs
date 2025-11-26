// app/kasir/kategori/page.js
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Sidebar from '../../../components/Sidebar';
import { useUserTheme } from '../../../components/UserThemeContext';
import { useSession } from 'next-auth/react';
import { Home, Download, Eye } from 'lucide-react';
import DataTable from '../../../components/DataTable';

import { useCashierCategoryTable } from '../../../lib/hooks/useCashierCategoryTable';

import CategoryProductsModal from '../../../components/kategori/CategoryProductsModal';
import { exportCategoryPDF } from '../../../utils/exportCategoryPDF';

export default function KasirCategoryView() {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
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
  } = useCashierCategoryTable();

  const [success, setSuccess] = useState('');

  // State untuk modal produk kategori
  const [showCategoryProductsModal, setShowCategoryProductsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);


  // Fungsi untuk export PDF
  const handleExportPDF = useCallback(async () => {
    try {
      await exportCategoryPDF(darkMode);
      setSuccess('Laporan PDF berhasil dibuat!');
    } catch (error) {
      setTableError(error.message || 'Gagal membuat laporan PDF');
    }
  }, [darkMode, setSuccess, setTableError]);

  useEffect(() => {
    // Fetch initial data if needed
    fetchCategories();
  }, []); // Hanya dijalankan sekali saat mount, bukan setiap fetchCategories berubah

  // Debug logging to see what data we're getting
  useEffect(() => {
    if (!loading && categories.length > 0) {
      console.log('Categories data in KasirCategoryView:', categories[0]);
      // Check for _count field specifically
      if (categories[0]?._count) {
        console.log('Category with _count:', categories[0].name, '_count:', categories[0]._count);
      }
    }
  }, [categories, loading]); // Ini perlu tetap ada agar log muncul ketika data berubah

  // Fungsi untuk melihat produk dalam kategori
  const handleViewCategoryProducts = useCallback(async (category) => {
    setSelectedCategory(category);
    setLoadingProducts(true);

    try {
      // Pastikan category.id valid
      if (!category.id) {
        throw new Error('Kategori tidak valid');
      }

      // Pastikan session user memiliki akses ke toko
      const url = new URL('/api/products', window.location.origin);
      url.searchParams.append('categoryId', category.id);

      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengambil produk dalam kategori');
      }

      // Validasi bahwa data memiliki struktur yang benar
      if (!Array.isArray(data.products)) {
        console.error('Data produk tidak dalam bentuk array:', data);
        throw new Error('Format data produk tidak valid');
      }

      // Log struktur produk untuk debugging
      console.log('Received products:', data.products.slice(0, 2)); // Log hanya 2 produk pertama untuk ringkas

      setCategoryProducts(data.products || []);
      setShowCategoryProductsModal(true);
    } catch (error) {
      console.error('Error fetching category products:', error);
      setTableError(error.message || 'Gagal mengambil produk dalam kategori');
    } finally {
      setLoadingProducts(false);
    }
  }, [setSelectedCategory, setLoadingProducts, setCategoryProducts, setShowCategoryProductsModal, setTableError]);

  const handleViewDetails = useCallback((category) => {
    if (!category || !category.id) {
      setTableError('Data kategori tidak valid');
      return;
    }
    // Menampilkan produk dalam kategori
    setSelectedCategory(category);
    setShowCategoryProductsModal(true);
  }, [setSelectedCategory, setShowCategoryProductsModal]);

  const error = tableError;

  // Definisikan kolom untuk DataTable
  const columns = useMemo(() => [
    {
      key: 'no',
      title: 'No.',
      render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: 'name',
      title: 'Nama',
      sortable: true
    },
    {
      key: 'description',
      title: 'Deskripsi',
      render: (value) => value || '-',
      sortable: true
    },
    {
      key: 'jumlahProduk',
      title: 'Jumlah Produk',
      sortable: true,
      render: (value, row) => row._count?.products || 0,
    },
  ], [currentPage, itemsPerPage]);

  // Enhanced categories with action handlers
  const enhancedCategories = useMemo(() =>
    categories.map(category => ({
      ...category,
      onViewDetails: handleViewDetails,
    }))
  , [categories, handleViewDetails]);

  // Row actions for DataTable - menampilkan aksi
  const rowActions = useCallback((row) => (
    <button
      onClick={() => handleViewDetails(row)}
      className={`p-1.5 rounded-md ${darkMode ? 'text-green-400 hover:bg-gray-700' : 'text-green-600 hover:bg-gray-200'}`}
      title="Lihat Produk dalam Kategori"
    >
      <Eye className="h-4 w-4" />
    </button>
  ), [handleViewDetails, darkMode]);

  // Pagination data
  const paginationData = {
    currentPage,
    totalPages,
    totalItems: totalCategories,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, totalCategories),
    onPageChange: setCurrentPage,
    itemsPerPage: itemsPerPage
  };

  return (
    <ProtectedRoute requiredRole="CASHIER">
      <Sidebar>
        <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900 text-gray-100' : ''}`}>
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Daftar Kategori
            </h1>
            <div className="group relative">
              <button
                onClick={() => window.location.href = '/kasir'}
                className={`p-2 rounded-md ${
                  darkMode
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                } transition-colors`}
                title="Dashboard"
              >
                <Home size={20} />
              </button>
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs py-1 px-2 rounded">
                Dashboard
              </span>
            </div>
          </div>

          <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
            {/* Custom toolbar */}
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="relative flex-grow sm:w-64">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari kategori..."
                    className={`w-full pl-10 pr-4 py-2 border rounded-md shadow-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-pastel-purple-500`}
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <label htmlFor="itemsPerPage" className="sr-only">Items per page</label>
                  <select
                    id="itemsPerPage"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-pastel-purple-500`}
                  >
                    <option value={10}>10/halaman</option>
                    <option value={20}>20/halaman</option>
                    <option value={50}>50/halaman</option>
                  </select>
                </div>
              </div>
            </div>

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

            <DataTable
              data={enhancedCategories}
              columns={columns}
              loading={loading}
              darkMode={darkMode}
              actions={true}
              rowActions={rowActions}
              showItemsPerPage={false} // We're handling pagination manually
              showSearch={false} // We're handling search manually
            />

            <div className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Menampilkan {paginationData.startIndex} - {paginationData.endIndex} dari {paginationData.totalItems} kategori
                </div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    } text-sm font-medium ${(currentPage === 1) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Previous
                  </button>

                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === index + 1
                          ? 'z-10 ' + (darkMode ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-indigo-50 border-indigo-500 text-indigo-600')
                          : darkMode
                            ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    } text-sm font-medium ${(currentPage === totalPages) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Modal untuk menampilkan produk dalam kategori */}
          <CategoryProductsModal
            isOpen={showCategoryProductsModal}
            onClose={() => setShowCategoryProductsModal(false)}
            category={selectedCategory}
            darkMode={darkMode}
          />
        </main>
      </Sidebar>
    </ProtectedRoute>
  );
}