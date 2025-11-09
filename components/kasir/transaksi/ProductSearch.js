// components/kasir/transaksi/ProductSearch.js
'use client';

import { Search, Loader } from 'lucide-react';
import TotalDisplay from './TotalDisplay'; // Import TotalDisplay

const ProductSearch = ({
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
  return (
    <div className="lg:col-span-2">
      <div className={`rounded-lg shadow p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="relative">
          <input
            type="text"
            placeholder="Cari atau scan produk..."
            className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleScan}
            autoFocus
          />
          <Search className={`absolute left-3 top-2.5 h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        </div>
      </div>

      {/* Render TotalDisplay here */}
      <div className="mb-6">
        <TotalDisplay total={total} darkMode={darkMode} />
      </div>

      <div className={`rounded-lg shadow overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="divide-y max-h-96 overflow-y-auto styled-scrollbar">
          {isProductListLoading && (
            <div className="p-4 text-center flex justify-center items-center">
              <Loader className="animate-spin mr-2" size={20} />
              <span>Mencari produk...</span>
            </div>
          )}
          {!isProductListLoading && products.length === 0 && searchTerm && (
            <div className="p-4 text-center">Produk tidak ditemukan.</div>
          )}
          {!isProductListLoading && products.map(product => (
            <div
              key={product.id}
              className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              onClick={() => addToCart(product)}
            >
              <div>
                <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Kode: {product.productCode}</div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  Rp {getTierPrice(product, 1).toLocaleString('id-ID')}
                </div>
                <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Stok: {product.stock}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductSearch;
