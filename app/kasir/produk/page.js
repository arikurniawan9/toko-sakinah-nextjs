// app/kasir/produk/page.js
'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Sidebar from '../../../components/Sidebar';
import { useDarkMode } from '../../../components/DarkModeContext';
import { useSession } from 'next-auth/react';

import { useProductTable } from '../../../lib/hooks/useProductTable';

import ProductTable from '../../../components/produk/ProductTable';
import KasirProductToolbar from '../../../components/kasir/KasirProductToolbar';
import Pagination from '../../../components/produk/Pagination';
import ProductDetailModal from '../../../components/produk/ProductDetailModal';

export default function KasirProductView() {
  const { darkMode } = useDarkMode();
  const { data: session } = useSession();
  const isCashier = session?.user?.role === 'CASHIER';

  const {
    products,
    loading,
    error: tableError,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalProducts,
    fetchProducts,
    setError: setTableError,
  } = useProductTable();

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [success, setSuccess] = useState('');

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catResponse, supResponse] = await Promise.all([
          fetch('/api/kategori'),
          fetch('/api/supplier'),
        ]);
        const catData = await catResponse.json();
        const supData = await supResponse.json();
        setCategories(catData.categories || []);
        setSuppliers(supData.suppliers || []);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setTableError('Gagal memuat data pendukung (kategori/supplier).');
      }
    };
    fetchInitialData();
  }, [setTableError]);

  const handleViewDetails = (product) => {
    setSelectedProductForDetail(product);
    setShowDetailModal(true);
  };



  const error = tableError;

  return (
    <ProtectedRoute requiredRole="CASHIER">
      <Sidebar>
        <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900 text-gray-100' : ''}`}>
          <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Daftar Produk
          </h1>

          <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-pastel-purple-700' : 'bg-white border-gray-200'} border`}>
            <div className="p-4 sm:p-6">
              <KasirProductToolbar
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

              <ProductTable
                products={products}
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
              totalProducts={totalProducts}
              darkMode={darkMode}
            />
          </div>

          <ProductDetailModal
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            product={selectedProductForDetail}
            darkMode={darkMode}
          />
        </main>
      </Sidebar>
    </ProtectedRoute>
  );
}
