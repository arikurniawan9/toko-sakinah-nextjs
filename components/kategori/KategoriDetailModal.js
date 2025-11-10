// components/kategori/KategoriDetailModal.js
'use client';

import { useState, useEffect } from 'react';
import { X, Search, Package } from 'lucide-react';

const ProductListSkeleton = ({ darkMode }) => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className={`flex items-center justify-between p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div>
          <div className={`h-4 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded w-32 mb-1.5`}></div>
          <div className={`h-3 ${darkMode ? 'bg-gray-500' : 'bg-gray-200'} rounded w-24`}></div>
        </div>
        <div className={`h-4 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded w-12`}></div>
      </div>
    ))}
  </div>
);

export default function KategoriDetailModal({
  isOpen,
  onClose,
  category,
  darkMode,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && category?.id) {
      setLoading(true);
      setProducts([]); // Reset products on open
      setSearchTerm(''); // Reset search term
      const fetchProducts = async () => {
        try {
          const response = await fetch(`/api/produk?categoryId=${category.id}&limit=0`); // Fetch all products for the category
          if (!response.ok) throw new Error('Gagal mengambil data produk');
          const data = await response.json();
          setProducts(data.products || []);
        } catch (error) {
          console.error("Error fetching products for category:", error);
          setProducts([]);
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    }
  }, [isOpen, category]);

  if (!isOpen) return null;

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen p-0 sm:items-center sm:p-4">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`relative inline-block align-bottom w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-0 sm:align-middle sm:max-w-lg sm:w-full ${darkMode ? 'border-gray-700' : 'border-gray-200'} border`}>
          <div className="flex items-center justify-between p-3 sm:p-4">
            <h3 className={`text-sm leading-5 font-medium ${darkMode ? 'text-purple-400' : 'text-purple-800'}`} id="modal-title">
              Produk dalam Kategori: {category?.name}
            </h3>
            <button onClick={onClose} className={`p-1 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'} transition-colors`}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className={`px-3 pb-3 sm:px-4 sm:pb-4 ${darkMode ? 'bg-gray-800' : ''}`}>
            <div className="w-full">
              <div className="mt-1 w-full space-y-2.5 sm:space-y-3">
                {/* Product Search Section */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <Search className={`h-4 w-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cari produk dalam kategori ini..."
                      className={`w-full pl-8 pr-3 py-1.5 text-xs border rounded ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-1 focus:ring-purple-500`}
                    />
                  </div>
                </div>

                {/* Product List Section */}
                <div>
                  <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>Daftar Produk</h4>
                  
                  {loading ? (
                    <ProductListSkeleton darkMode={darkMode} />
                  ) : filteredProducts.length > 0 ? (
                    <div className="mt-1.5 space-y-1 max-h-80 overflow-y-auto">
                      {filteredProducts.map(product => (
                        <div key={product.id} className={`flex items-center justify-between py-1.5 px-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</p>
                            <p className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Kode: {product.productCode}</p>
                          </div>
                          <div className="ml-4 text-right">
                            <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{product.stock}</p>
                            <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Stok</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`text-center py-4 rounded ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <Package className={`mx-auto h-8 w-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {searchTerm 
                          ? `Tidak ditemukan produk yang cocok dengan "${searchTerm}"` 
                          : 'Tidak ada produk dalam kategori ini'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={`px-3 py-2 sm:px-4 sm:flex sm:flex-row-reverse ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`mt-2 w-full inline-flex justify-center rounded-md border ${
                darkMode ? 'border-gray-600 bg-transparent hover:bg-gray-600 text-gray-300' : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
              } shadow-sm px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto`}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}