// components/kasir/transaksi/ProductSearch.js
'use client';

import { Search, Loader, Package, Scan } from 'lucide-react';
import TotalDisplay from './TotalDisplay'; // Import TotalDisplay
import { memo, useCallback } from 'react';

const ProductSearch = memo(({
  searchTerm,
  setSearchTerm,
  handleScan,
  products,
  addToCart,
  isProductListLoading,
  darkMode,
  getTierPrice,
  total, // Accept total as a prop
}) => {
  // Fungsi untuk memformat angka dengan pemisah ribuan
  const formatNumber = useCallback((num) => {
    return new Intl.NumberFormat('id-ID').format(num);
  }, []);

  return (
    <div className="lg:col-span-2">
      <div className={`rounded-lg shadow p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="relative">
          <input
            type="text"
            placeholder="Cari produk berdasarkan nama atau kode..."
            className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleScan}
            autoFocus
            aria-label="Cari produk"
          />
          <div className="absolute left-3 top-2.5 flex items-center">
            <Search className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <Scan className={`ml-2 h-4 w-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <p>Tip: Gunakan tombol Enter setelah mengetik kode produk untuk menambahkan secara langsung</p>
        </div>
      </div>

      {/* Render TotalDisplay here */}
      <div className="mb-6">
        <TotalDisplay total={total} darkMode={darkMode} />
      </div>

      <div className={`rounded-lg shadow overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="p-2 border-b flex items-center">
          <Package className={`h-4 w-4 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {isProductListLoading ? 'Memuat produk...' : products.length > 0 ? `Ditemukan ${products.length} produk` : 'Produk tidak ditemukan'}
          </h3>
        </div>
        <div className="divide-y max-h-96 overflow-y-auto styled-scrollbar">
          {isProductListLoading && (
            <div className="p-4 text-center flex justify-center items-center">
              <Loader className="animate-spin mr-2" size={20} />
              <span>Mencari produk...</span>
            </div>
          )}
          {!isProductListLoading && products.length === 0 && searchTerm && (
            <div className="p-4 text-center text-gray-500">Produk tidak ditemukan. Coba kode produk atau nama yang berbeda.</div>
          )}
          {!isProductListLoading && products.length === 0 && !searchTerm && (
            <div className="p-4 text-center text-gray-500">Ketik nama atau kode produk untuk mencari</div>
          )}
          {!isProductListLoading && products && Array.isArray(products) && products.map(product => {
            // Validasi bahwa produk memiliki properti yang diperlukan
            if (!product || !product.id || !product.name || !product.productCode) {
              console.warn('Invalid product data:', product);
              return null;
            }

            return (
              <div
                key={product.id}
                className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} border-l-4 ${product.stock < 5 ? 'border-red-500' : 'border-transparent'}`}
                onClick={() => addToCart(product)}
                role="button"
                tabIndex="0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    addToCart(product);
                  }
                }}
                title={`Tambahkan ${product.name} ke keranjang`}
              >
                <div className="flex-1 min-w-0">
                  <div className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Kode: {product.productCode}</div>
                </div>
                <div className="text-right ml-4">
                  <div className={`text-sm font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    Rp {formatNumber(getTierPrice(product, 1))}
                  </div>
                  <div className={`text-xs mt-1 ${product.stock < 5 ? (darkMode ? 'text-red-400' : 'text-red-600') : (darkMode ? 'text-gray-500' : 'text-gray-500')}`}>
                    Stok: {product.stock} {product.stock < 5 && product.stock > 0 ? '(Stok Menipis)' : ''}
                    {product.stock === 0 && '(Habis)'}
                  </div>
                </div>
              </div>
            );
          }).filter(Boolean)} {/* Filter out any null values */}
        </div>
      </div>
    </div>
  );
});

export default ProductSearch;