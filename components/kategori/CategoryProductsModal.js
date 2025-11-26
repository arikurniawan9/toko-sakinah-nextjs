// components/kategori/CategoryProductsModal.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Search, Package } from 'lucide-react';
import { useCategoryProductsTable } from '@/lib/hooks/useCategoryProductsTable';
import DataTable from '../DataTable';

const CategoryProductsModal = ({
  isOpen,
  onClose,
  category,
  darkMode
}) => {
  // Gunakan custom hook untuk pengelolaan produk dalam kategori
  const {
    products,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalProducts,
    fetchCategoryProducts
  } = useCategoryProductsTable(category?.id || null);

  // Definisikan kolom untuk DataTable - harus ada di setiap render
  const columns = useMemo(() => [
    {
      key: 'no',
      title: 'No.',
      render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: 'name',
      title: 'Nama Produk',
      sortable: true
    },
    {
      key: 'productCode',
      title: 'Kode Produk',
      sortable: true
    },
    {
      key: 'stock',
      title: 'Stok',
      sortable: true
    },
    {
      key: 'price',
      title: 'Harga',
      render: (value, row) => {
        // Jika row tidak memiliki priceTiers, gunakan purchasePrice
        const basePrice = row.priceTiers && row.priceTiers.length > 0
          ? row.priceTiers?.sort((a, b) => a.minQty - b.minQty)[0]?.price
          : row.purchasePrice || 0;
        return `Rp ${basePrice.toLocaleString('id-ID')}`;
      },
      sortable: true
    }
  ], [currentPage, itemsPerPage]);

  // Pagination data - harus ada di setiap render
  const paginationData = useMemo(() => ({
    currentPage: currentPage || 1,
    totalPages: totalPages || 1,
    totalItems: totalProducts || 0,
    startIndex: ((currentPage || 1) - 1) * (itemsPerPage || 10) + 1,
    endIndex: Math.min((currentPage || 1) * (itemsPerPage || 10), totalProducts || 0),
    onPageChange: setCurrentPage,
    itemsPerPage: itemsPerPage || 10
  }), [currentPage, totalPages, totalProducts, itemsPerPage]);

  // Fungsi handle overlay click - harus ada di setiap render
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Jika modal tidak terbuka atau kategori tidak valid, kembalikan null
  if (!isOpen || !category) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      <div className={`relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl shadow-lg transform transition-all ${darkMode ? 'bg-gray-800' : 'bg-white'}`} style={{minWidth: '800px'}}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
          <div>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Produk dalam Kategori: {category.name}
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {totalProducts} produk ditemukan
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'} transition-colors`}
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* DataTable untuk produk dalam kategori */}
        <div className="p-4">
          {error && (
            <div className={`my-4 p-4 ${darkMode ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'} rounded-md`}>
              {error}
            </div>
          )}

          <DataTable
            data={products}
            columns={columns}
            loading={loading}
            darkMode={darkMode}
            showToolbar={true}
            showSearch={true}
            showExport={false}
            showItemsPerPage={true}
            onSearch={setSearchTerm}
            onItemsPerPageChange={setItemsPerPage}
            searchTerm={searchTerm}
            itemsPerPage={itemsPerPage}
            pagination={paginationData}
            mobileColumns={['name', 'productCode']}
          />
        </div>
      </div>
    </div>
  );
};

export default CategoryProductsModal;