// app/pelayan/produk-cepat/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { Star, StarOff, Search, Package, AlertCircle, Plus, Minus, Trash2 } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useNotification } from '../../../components/notifications/NotificationProvider';

export default function QuickAddPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const { showNotification } = useNotification();
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode
  useEffect(() => {
    const storedPreference = localStorage.getItem('darkMode');
    if (storedPreference !== null) {
      setDarkMode(JSON.parse(storedPreference));
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }
  }, [darkMode]);

  // Load quick add products
  useEffect(() => {
    const loadQuickProducts = async () => {
      try {
        if (session?.user?.id) {
          const savedProducts = localStorage.getItem(`quickProducts_${session.user.id}`);
          if (savedProducts) {
            setProducts(JSON.parse(savedProducts));
          }
        }
      } catch (err) {
        showNotification('Gagal memuat produk cepat', 'error');
        console.error('Error loading quick products:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchAllProducts = async () => {
      try {
        const response = await fetch('/api/produk');
        if (!response.ok) throw new Error('Gagal mengambil produk');
        const data = await response.json();
        setAllProducts(data.products || []);
      } catch (err) {
        showNotification('Gagal mengambil semua produk', 'error');
        console.error('Error fetching all products:', err);
      }
    };

    loadQuickProducts();
    fetchAllProducts();
  }, [session, showNotification]);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [searchTerm, allProducts]);

  const toggleQuickProduct = async (product) => {
    try {
      const exists = products.some(p => p.id === product.id);
      let newProducts;

      if (exists) {
        // Remove from quick products
        newProducts = products.filter(p => p.id !== product.id);
        showNotification(`Produk "${product.name}" dihapus dari produk cepat`, 'info');
      } else {
        // Add to quick products (max 10)
        if (products.length >= 10) {
          showNotification('Maksimal 10 produk cepat', 'warning');
          return;
        }
        newProducts = [...products, product];
        showNotification(`Produk "${product.name}" ditambahkan ke produk cepat`, 'success');
      }

      setProducts(newProducts);

      // Save to localStorage
      if (session?.user?.id) {
        localStorage.setItem(`quickProducts_${session.user.id}`, JSON.stringify(newProducts));
      }
    } catch (err) {
      showNotification('Gagal mengatur produk cepat', 'error');
      console.error('Error toggling quick product:', err);
    }
  };

  const isQuickProduct = (productId) => {
    return products.some(p => p.id === productId);
  };

  return (
    <ProtectedRoute requiredRole="ATTENDANT">
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${darkMode ? 'dark' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Produk Cepat</h1>
            <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Kelola produk-produk yang sering Anda gunakan
            </p>
          </div>

          {/* Quick Products Section */}
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Produk Cepat Saya</h2>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {products.length}/10 produk
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : products.length === 0 ? (
              <div className={`text-center py-8 rounded-lg border-2 border-dashed ${
                darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400'
              }`}>
                <Package className="h-12 w-12 mx-auto mb-4" />
                <p>Belum ada produk cepat</p>
                <p className="text-sm mt-1">Tambahkan produk dari halaman utama atau dari pencarian di bawah</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
                      darkMode 
                        ? 'border-gray-700 hover:bg-gray-700 bg-gray-750' 
                        : 'border-gray-300 hover:bg-gray-50 bg-white'
                    }`}
                    onClick={() => toggleQuickProduct(product)}
                  >
                    <div className="flex justify-between w-full mb-2">
                      <div
                        className={`p-1 rounded-full ${
                          isQuickProduct(product.id) 
                            ? (darkMode ? 'bg-yellow-500/20' : 'bg-yellow-100') 
                            : (darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200')
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleQuickProduct(product);
                        }}
                      >
                        {isQuickProduct(product.id) ? (
                          <Star className={`h-4 w-4 ${
                            darkMode ? 'text-yellow-400' : 'text-yellow-500'
                          }`} fill="currentColor" />
                        ) : (
                          <StarOff className={`h-4 w-4 ${
                            darkMode ? 'text-gray-500' : 'text-gray-400'
                          }`} />
                        )}
                      </div>
                    </div>
                    
                    <div className={`h-16 w-16 rounded flex items-center justify-center mb-2 ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="h-12 w-12 object-contain rounded" 
                        />
                      ) : (
                        <span className={`text-xs font-medium ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {product.name?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <p className={`text-xs font-medium truncate w-full ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {product.name?.substring(0, 12)}{product.name?.length > 12 ? '...' : ''}
                      </p>
                      <p className={`text-xs ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Rp {(product.sellingPrice || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search for more products */}
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6`}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cari Produk untuk Ditambahkan</h2>
            
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Cari produk berdasarkan nama atau kode..."
                className="w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-pastel-purple-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            {searchTerm && filteredProducts.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`flex items-center justify-between p-3 border-b ${
                      darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded flex items-center justify-center ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="h-8 w-8 object-contain rounded" 
                          />
                        ) : (
                          <span className={`text-xs font-medium ${
                            darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {product.name?.charAt(0)?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className={`font-medium ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {product.name}
                        </div>
                        <div className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Rp {(product.sellingPrice || 0).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleQuickProduct(product)}
                      className={`p-2 rounded-full ${
                        isQuickProduct(product.id) 
                          ? (darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-500') 
                          : (darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200')
                      }`}
                      title={isQuickProduct(product.id) ? "Hapus dari produk cepat" : "Tambah ke produk cepat"}
                    >
                      {isQuickProduct(product.id) ? (
                        <Star className="h-5 w-5" fill="currentColor" />
                      ) : (
                        <Star className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : searchTerm ? (
              <div className={`text-center py-8 rounded-lg ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p>Tidak ada produk ditemukan</p>
              </div>
            ) : (
              <div className={`text-center py-8 rounded-lg ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                <p>Ketik untuk mencari produk</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}