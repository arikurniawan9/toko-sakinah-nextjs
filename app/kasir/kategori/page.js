// app/kasir/kategori/page.js
'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Sidebar from '../../../components/Sidebar';
import { useDarkMode } from '../../../components/DarkModeContext';
import { useSession } from 'next-auth/react';

import { useCategoryTable } from '../../../lib/hooks/useCategoryTable';

import CategoryTable from '../../../components/kategori/CategoryTable';
import KasirCategoryToolbar from '../../../components/kasir/KasirCategoryToolbar';
import Pagination from '../../../components/produk/Pagination';
import KategoriDetailModal from '../../../components/kategori/KategoriDetailModal';

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

  const [success, setSuccess] = useState('');

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCategoryForDetail, setSelectedCategoryForDetail] = useState(null);

  useEffect(() => {
    // Fetch initial data if needed
    fetchCategories();
  }, [fetchCategories]);

  const handleViewDetails = (category) => {
    setSelectedCategoryForDetail(category);
    setShowDetailModal(true);
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
                selectedRows={[]} // Cashier doesn't need selection
                handleSelectAll={() => {}} // Cashier doesn't need selection
                handleSelectRow={() => {}} // Cashier doesn't need selection
                onEdit={() => {}} // Cashier doesn't need edit
                onDelete={() => {}} // Cashier doesn't need delete
                onViewDetails={handleViewDetails}
                showActions={false} // Hide action column for cashier
              />
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalCategories}
              darkMode={darkMode}
            />
          </div>

          <KategoriDetailModal
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            category={selectedCategoryForDetail}
            darkMode={darkMode}
          />
        </main>
      </Sidebar>
    </ProtectedRoute>
  );
}