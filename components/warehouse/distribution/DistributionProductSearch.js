// components/warehouse/distribution/DistributionProductSearch.js
'use client';

import { Search, Loader, Package } from 'lucide-react';
import { memo, forwardRef } from 'react';

const formatNumber = (num) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num || 0);
};

const DistributionProductSearchInner = forwardRef(({
  products,
  loading,
  searchTerm,
  setSearchTerm,
  addToCart,
  loadMore,
  hasMore,
  darkMode,
}, ref) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (products && products.length === 1) {
        addToCart(products[0]);
        setSearchTerm('');
      } else if (searchTerm) {
        const exactMatch = products.find(p => p.Product && p.Product.productCode.toLowerCase() === searchTerm.toLowerCase());
        if (exactMatch) {
          addToCart(exactMatch);
          setSearchTerm('');
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className={`rounded-lg shadow p-4 mb-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="relative">
          <input
            ref={ref}
            type="text"
            placeholder="Cari produk di gudang..."
            className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            aria-label="Cari produk gudang"
          />
          <div className="absolute left-3 top-2.5">
            <Search className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
        </div>
      </div>

      {/* Results Container - Positioned below search bar */}
      {searchTerm && (
        <div className={`rounded-lg shadow overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-2 border-b flex items-center">
            <Package className={`h-4 w-4 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {loading && products.length === 0 ? 'Memuat produk...' : `Ditemukan ${products.length} produk`}
            </h3>
          </div>
          <div className="divide-y max-h-[60vh] overflow-y-auto styled-scrollbar">
            {products && products.length > 0 && products.map(warehouseProduct => {
              if (!warehouseProduct || !warehouseProduct.Product) return null;
              const product = warehouseProduct.Product;
              return (
                <div
                  key={warehouseProduct.id}
                  className={`flex items-center p-4 cursor-pointer transition-all duration-200 ease-in-out ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} hover:shadow-md transform hover:-translate-y-1`}
                  onClick={() => addToCart(warehouseProduct)}
                  role="button"
                  tabIndex="0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') addToCart(warehouseProduct);
                  }}
                  title={`Tambahkan ${product.name} ke keranjang`}
                >
                  <div className={`p-3 rounded-full mr-4 ${darkMode ? 'bg-gray-900/50' : 'bg-gray-100'}`}>
                    <Package className={`h-6 w-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-base font-bold truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>{product.name}</div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Kode: {product.productCode}</div>
                  </div>
                  <div className="text-right ml-4">
                    <div className={`text-base font-bold ${darkMode ? 'text-purple-400' : 'text-purple-500'}`}>
                      {formatNumber(product.purchasePrice)}
                    </div>
                    <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Stok: <span className="font-semibold">{warehouseProduct.quantity}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="p-4 text-center flex justify-center items-center">
                <Loader className="animate-spin mr-2" size={20} />
                <span>Memuat...</span>
              </div>
            )}

            {!loading && hasMore && (
              <button
                onClick={loadMore}
                className={`w-full p-3 text-center text-sm font-medium ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
              >
                Tampilkan Lebih Banyak
              </button>
            )}

            {!loading && products.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                Produk tidak ditemukan.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Placeholder when no search term */}
      {!searchTerm && (
        <div className={`rounded-lg shadow overflow-hidden flex items-center justify-center p-8 text-center ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
          <p>Ketik nama atau kode produk untuk memulai pencarian.</p>
        </div>
      )}
    </div>
  );
});

const DistributionProductSearch = memo(DistributionProductSearchInner);

DistributionProductSearch.displayName = 'DistributionProductSearch';

export default DistributionProductSearch;
