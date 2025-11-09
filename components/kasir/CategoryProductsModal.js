// components/kasir/CategoryProductsModal.js
'use client';

import { useState, useEffect } from 'react';
import { X, PackageSearch, ShoppingBag, Search } from 'lucide-react';

const CategoryProductsModal = ({ category, onClose, darkMode }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (category?.id) {
      const fetchProducts = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/produk?categoryId=${category.id}&limit=100`); // Fetch up to 100 products for a category
          if (!response.ok) {
            throw new Error('Gagal mengambil data produk');
          }
          const data = await response.json();
          setProducts(data.products || []);
        } catch (error) {
          console.error('Error fetching products for category:', error);
          setProducts([]);
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    }
  }, [category]);

  if (!category) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
      <div 
        className={`relative w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col transform transition-all duration-300 ease-in-out
                    ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b rounded-t-2xl ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div>
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
              Produk dalam Kategori
            </h3>
            <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{category.name}</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Input */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`h-20 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id} 
                  className={`flex items-center justify-between rounded-xl p-4 transition-all duration-300 border ${darkMode ? 'bg-gray-900/50 border-gray-700 hover:border-purple-500' : 'bg-gray-50 border-gray-200 hover:border-purple-400 hover:shadow-md'}`}
                >
                  <div className="flex items-center">
                    <ShoppingBag className={`h-6 w-6 mr-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    <div>
                      <h4 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>{product.name}</h4>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Kode: {product.productCode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                      {formatCurrency(product.priceTiers?.sort((a, b) => a.minQty - b.minQty)[0]?.price || 0)}
                    </p>
                    <p className={`text-sm ${product.stock > 0 ? (darkMode ? 'text-green-400' : 'text-green-600') : (darkMode ? 'text-red-400' : 'text-red-600')}`}>
                      Stok: {product.stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4">
              <PackageSearch className={`h-20 w-20 mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} strokeWidth={1.5} />
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {products.length === 0 && searchTerm === '' ? 'Produk Belum Tersedia' : 'Produk Tidak Ditemukan'}
              </h3>
              <p className={`mt-2 max-w-md ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {products.length === 0 && searchTerm === ''
                  ? `Saat ini belum ada produk yang terdaftar dalam kategori ${category.name}.`
                  : `Tidak ada produk yang cocok dengan "${searchTerm}" di kategori ${category.name}.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryProductsModal;
