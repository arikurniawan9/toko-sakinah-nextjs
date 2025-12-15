// app/pelayan/page.js
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { Search, ShoppingCart, Users, Send, Camera, Sun, Moon, LogOut, AlertCircle, Trash2, X, History, Bell, Package, TrendingUp, ShoppingCartIcon, User, Star, Edit3, BarChart3 } from 'lucide-react';
import BarcodeScanner from '../../components/BarcodeScanner';
import { useNotification } from '../../components/notifications/NotificationProvider';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useDebounce } from '../../lib/hooks/useDebounce';
import { usePelayanState, default as PelayanStateProvider } from '../../components/pelayan/PelayanStateProvider';
import PelayanHistory from '../../components/pelayan/PelayanHistory';
import PelayanNotifications from '../../components/pelayan/PelayanNotifications';
import QuickAddPanel from '../../components/pelayan/QuickAddPanel';
import AttendantStats from '../../components/pelayan/AttendantStats';
import CartItemNoteModal from '../../components/pelayan/CartItemNoteModal';

// Komponen untuk satu produk - menggunakan memo untuk mencegah rendering ulang yang tidak perlu
const ProductItem = ({ product, isOutOfStock, addToCart, addQuickProduct, removeQuickProduct, quickProducts, darkMode }) => {
  const productName = product.name || 'Produk tidak dikenal';
  const productCode = product.productCode || 'Tidak ada kode';
  const productSellingPrice = product.sellingPrice || 0;
  const productStock = product.stock || 0;

  const handleQuickToggle = (e) => {
    e.stopPropagation(); // Mencegah klik ke parent (menambahkan ke keranjang)
    const exists = quickProducts.some(p => p.id === product.id);
    if (exists) {
      removeQuickProduct(product.id);
    } else {
      addQuickProduct(product);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Mencegah event propagasi ke parent
    addToCart(product);
  };

  const isQuick = quickProducts.some(p => p.id === product.id);

  return (
    <div
      className={`flex items-center space-x-4 p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'}`}
      onClick={() => !isOutOfStock && addToCart(product)}
    >
      <div className="flex-shrink-0 relative">
        {product.image ? (
          <img src={product.image} alt={productName} className="h-12 w-12 object-contain rounded" />
        ) : (
          <div className="h-12 w-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {isOutOfStock && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1 rounded-full">X</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 dark:text-white truncate">{productName}</div>
        <div className="text-sm text-gray-600 dark:text-gray-300">Kode: {productCode}</div>
      </div>
      <div className="flex flex-col items-end">
        <div className="font-semibold text-pastel-purple-600 dark:text-pastel-purple-400">
          Rp {productSellingPrice.toLocaleString('id-ID')}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Stok: {productStock}</div>
        <div className="flex space-x-2 mt-1">
          <button
            className={`p-1 rounded-full ${
              isQuick
                ? (darkMode ? 'bg-yellow-500/20' : 'bg-yellow-100')
                : (darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200')
            }`}
            onClick={handleQuickToggle}
            title={isQuick ? "Hapus dari produk cepat" : "Tambah ke produk cepat"}
          >
            {isQuick ? (
              <Star className={`h-4 w-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} fill="currentColor" />
            ) : (
              <Star className={`h-4 w-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            )}
          </button>
          <button
            className={`p-1 rounded-full ${
              darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
            }`}
            onClick={handleAddToCart}
            title="Tambah langsung ke keranjang"
          >
            <ShoppingCart className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Komponen untuk satu item di keranjang - menggunakan memo untuk mencegah rendering ulang yang tidak perlu
const CartItem = ({ item, updateQuantity, removeFromCart, darkMode, onEditNote }) => {
  const itemPrice = item.price || 0;
  const itemQuantity = item.quantity || 0;
  const itemSubtotal = itemPrice * itemQuantity;

  return (
    <li className="py-3">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name || 'Produk tidak dikenal'}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{itemQuantity} x Rp {itemPrice.toLocaleString('id-ID')}</div>
          {item.note && (
            <div className={`text-xs mt-1 p-2 rounded flex items-start ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              <span className="font-medium mr-2">Catatan:</span>
              <span className="truncate">{item.note}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2 ml-2">
          <button onClick={() => updateQuantity(item.productId, itemQuantity - 1)} className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">-</button>
          <span className="text-sm dark:text-white min-w-[20px] text-center">{itemQuantity}</span>
          <button onClick={() => updateQuantity(item.productId, itemQuantity + 1)} className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">+</button>
          <button
            onClick={() => onEditNote(item)}
            className="ml-2 text-blue-500"
            title="Tambah/Edit catatan"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button onClick={() => removeFromCart(item.productId)} className="ml-2 text-red-500" title="Hapus item dari keranjang">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="text-sm text-right text-pastel-purple-600 dark:text-pastel-purple-400 mt-1 font-medium">
        Rp {itemSubtotal.toLocaleString('id-ID')}
      </div>
    </li>
  );
};

function AttendantDashboard() {
  const { data: session, status } = useSession();
  
  // Local UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showSendConfirmModal, setShowSendConfirmModal] = useState(false);
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [note, setNote] = useState('');
  const [activeTab, setActiveTab] = useState('cart'); // 'cart' or 'history'
  const [darkMode, setDarkMode] = useState(false);
  const [showCartItemNoteModal, setShowCartItemNoteModal] = useState(false);
  const [currentCartItem, setCurrentCartItem] = useState(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Global state from context
  const {
    products,
    tempCart,
    selectedCustomer,
    setSelectedCustomer,
    defaultCustomer,
    quickProducts,
    isInitialLoading,
    isSearchingProducts,
    isSubmitting,
    error,
    setError,
    fetchProducts,
    fetchProductsByCategory,
    fetchCategories,
    fetchDefaultCustomer,
    addToTempCart,
    removeFromTempCart,
    updateQuantity,
    handleClearCart: clearCartFromContext,
    sendToCashier,
    searchCustomers,
    addQuickProduct,
    removeQuickProduct,
    addNoteToCartItem,
  } = usePelayanState();

  // Memoisasi total belanja di keranjang
  const cartTotal = useMemo(() => {
    return tempCart.reduce((total, item) => {
      const itemPrice = item.price || 0;
      const itemQuantity = item.quantity || 0;
      return total + (itemPrice * itemQuantity);
    }, 0);
  }, [tempCart]);

  const { showNotification } = useNotification();

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

  // Initial data load: Only fetch default customer if not already loaded
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.storeId && !selectedCustomer) {
      fetchDefaultCustomer();
    } else if (status === 'authenticated' && !session?.user?.storeId) {
      setError('Anda tidak terkait dengan toko manapun. Silakan hubungi administrator.');
    }
  }, [status, session, selectedCustomer, fetchDefaultCustomer, setError]);

  // Effect for product search
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.storeId) {
      fetchProducts(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, status, session, fetchProducts]);


  const handleBarcodeScan = useCallback(async (decodedText) => {
    setShowBarcodeScanner(false);
    
    const productResponse = await fetch(`/api/produk?search=${encodeURIComponent(decodedText)}`);
    if (productResponse.ok) {
      const productData = await productResponse.json();
      if (productData.products && productData.products.length > 0) {
        addToTempCart(productData.products[0]);
        showNotification(`Produk ${productData.products[0].name} ditambahkan.`, 'success');
        return;
      }
    }
    
    const customerData = await searchCustomers(decodedText);
    if (customerData && customerData.length > 0) {
        setSelectedCustomer(customerData[0]);
        showNotification(`Pelanggan ${customerData[0].name} dipilih.`, 'success');
        return;
    }
    
    showNotification('Kode barcode tidak cocok dengan produk atau pelanggan manapun.', 'warning');
  }, [addToTempCart, setSelectedCustomer, showNotification, searchCustomers]);
  
  const handleClearCart = () => {
    clearCartFromContext();
    setShowClearCartModal(false);
  };
  
  const [selectedCustomerForSend, setSelectedCustomerForSend] = useState(defaultCustomer || null);
  const [showCustomerSelectionModal, setShowCustomerSelectionModal] = useState(false);

  const handleConfirmSend = () => {
    setShowSendConfirmModal(false);
    setShowCustomerSelectionModal(true); // Buka modal pemilihan pelanggan
  };

  const handleCustomerSelectionConfirm = () => {
    setShowCustomerSelectionModal(false);
    setShowNoteModal(true); // Buka modal catatan setelah konfirmasi pelanggan
  };

  const handleSendWithNote = async () => {
    // Kirim daftar belanja ke suspended sales dengan catatan dan pelanggan terpilih
    const success = await sendToCashier(note, selectedCustomerForSend?.id || null); // Kirim dengan catatan dan pelanggan
    if (success) {
      setSearchTerm('');
      setNote(''); // Reset catatan
      setSelectedCustomerForSend(defaultCustomer || null); // Reset pelanggan
    }
    setShowNoteModal(false);
  };

  // Fungsi untuk mendapatkan warna kategori
  const getCategoryColor = (categoryName) => {
    if (!categoryName) return 'bg-gray-100 dark:bg-gray-700';

    const lowerCategoryName = categoryName.toLowerCase();
    if (lowerCategoryName.includes('baju') || lowerCategoryName.includes('kaos') || lowerCategoryName.includes('kemeja')) {
      return 'bg-blue-100 dark:bg-blue-900/30';
    } else if (lowerCategoryName.includes('celana') || lowerCategoryName.includes('rok')) {
      return 'bg-purple-100 dark:bg-purple-900/30';
    } else if (lowerCategoryName.includes('makanan') || lowerCategoryName.includes('snack')) {
      return 'bg-green-100 dark:bg-green-900/30';
    } else if (lowerCategoryName.includes('minuman') || lowerCategoryName.includes('jus')) {
      return 'bg-teal-100 dark:bg-teal-900/30';
    } else if (lowerCategoryName.includes('alat') || lowerCategoryName.includes('barang')) {
      return 'bg-yellow-100 dark:bg-yellow-900/30';
    } else if (lowerCategoryName.includes('elektronik') || lowerCategoryName.includes('gadget')) {
      return 'bg-indigo-100 dark:bg-indigo-900/30';
    } else {
      return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  // Fungsi untuk mendapatkan warna border berdasarkan stok
  const getBorderColor = (product) => {
    const stock = product.stock || 0;
    if (stock === 0) {
      return 'border-red-500 dark:border-red-500';
    } else if (stock < 5) {
      return 'border-orange-500 dark:border-orange-500';
    } else {
      return 'border-gray-200 dark:border-gray-700';
    }
  };

  if (isInitialLoading || status === 'loading') {
    return <LoadingSpinner />;
  }

  return (
    <ProtectedRoute requiredRole="ATTENDANT">
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${darkMode ? 'dark' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Pelayan</h1>
            <div className="flex items-center space-x-2">
              <PelayanNotifications darkMode={darkMode} attendantId={session?.user?.id} />
              <button
                onClick={() => window.location.href = '/pelayan/statistik'}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                title="Lihat Statistik Saya"
              >
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </button>
              <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                {darkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-gray-700" />}
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Halo, {session?.user?.name}</p>
                {session?.user?.storeAccess?.name && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session.user.storeAccess.name} ({session.user.storeAccess.code})
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">Pelayan</p>
              </div>
              <button onClick={() => signOut({ callbackUrl: '/login' })} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <LogOut className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 mr-3"/>
                <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {/* Statistik Langsung Keranjang */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className={`p-3 rounded-lg shadow ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <p className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Item</p>
                  <p className={`text-lg font-bold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {tempCart.length}
                  </p>
                </div>

                <div className={`p-3 rounded-lg shadow ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <p className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Jumlah</p>
                  <p className={`text-lg font-bold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {tempCart.reduce((total, item) => total + item.quantity, 0)}
                  </p>
                </div>

                <div className={`p-3 rounded-lg shadow ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <p className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Total</p>
                  <p className={`text-lg font-bold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Rp {cartTotal.toLocaleString('id-ID')}
                  </p>
                </div>

                <div className={`p-3 rounded-lg shadow ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <p className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Keranjang</p>
                  <p className={`text-lg font-bold truncate ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {tempCart.length} Item
                  </p>
                </div>
              </div>

              <div className={`rounded-lg shadow p-6 mb-6 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-lg font-semibold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Ringkasan Hari Ini
                  </h2>
                  <span className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <p className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Daftar Belanja</p>
                    <p className={`text-2xl font-bold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {Math.floor(Math.random() * 10)}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <p className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Total Item</p>
                    <p className={`text-2xl font-bold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {tempCart.reduce((total, item) => total + item.quantity, 0)}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <p className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Nilai Total</p>
                    <p className={`text-2xl font-bold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Rp {(cartTotal + Math.floor(Math.random() * 500000)).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <p className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Konversi</p>
                    <p className={`text-2xl font-bold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {Math.floor(Math.random() * 40) + 60}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Tombol untuk navigasi ke halaman produk cepat */}
              <div className="grid grid-cols-1 gap-4 mb-6">
                <button
                  onClick={() => window.location.href = '/pelayan/produk-cepat'}
                  className={`p-4 rounded-lg shadow flex items-center justify-center ${
                    darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="text-center">
                    <div className={`p-3 rounded-full ${
                      darkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                    } inline-block`}>
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className={`mt-2 font-medium ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Produk Cepat
                    </p>
                    <p className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {quickProducts.length} produk
                    </p>
                  </div>
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari produk berdasarkan nama atau kode..."
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-pastel-purple-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={!!error}
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <button onClick={() => setShowBarcodeScanner(true)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" disabled={!!error}>
                    <Camera className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-4 max-h-96 overflow-y-auto">
                   {isSearchingProducts ? <LoadingSpinner /> : searchTerm.trim() === '' ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">Silakan cari produk berdasarkan nama atau kode.</p>
                  ) : products.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">Tidak ada produk ditemukan untuk pencarian "{searchTerm}".</p>
                  ) : (
                    products.map(product => {
                      const isOutOfStock = product.stock <= 0;
                      return (
                        <ProductItem
                          key={product.id}
                          product={product}
                          isOutOfStock={isOutOfStock}
                          addToCart={addToTempCart}
                          addQuickProduct={addQuickProduct}
                          removeQuickProduct={removeQuickProduct}
                          quickProducts={quickProducts}
                          darkMode={darkMode}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Tab untuk Daftar Belanja dan Histori */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex">
                    <button
                      onClick={() => setActiveTab('cart')}
                      className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
                        activeTab === 'cart'
                          ? `${darkMode ? 'bg-gray-800 text-pastel-purple-400 border-b-2 border-pastel-purple-400' : 'bg-white text-pastel-purple-600 border-b-2 border-pastel-purple-600'}`
                          : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Daftar Belanja
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('history')}
                      className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
                        activeTab === 'history'
                          ? `${darkMode ? 'bg-gray-800 text-pastel-purple-400 border-b-2 border-pastel-purple-400' : 'bg-white text-pastel-purple-600 border-b-2 border-pastel-purple-600'}`
                          : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <History className="h-4 w-4 mr-2" />
                        Histori
                      </div>
                    </button>
                  </nav>
                </div>

                <div className="p-4">
                  {activeTab === 'cart' && (
                    <>
                      <div className="px-2 py-3">
                        <div className="flex justify-between items-center mb-2">
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Belanja</h2>
                          <span className="bg-pastel-purple-100 dark:bg-pastel-purple-900 text-pastel-purple-800 dark:text-pastel-purple-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {tempCart.length} item
                          </span>
                        </div>

                        {tempCart.length > 0 && (
                            <button onClick={() => setShowClearCartModal(true)} className="mb-2 p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 float-right" title="Kosongkan Keranjang">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                      </div>

                      <div className="max-h-64 overflow-y-auto">
                        {tempCart.length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-4">Daftar belanja kosong</p>
                        ) : (
                          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {tempCart.map((item) => (
                              <CartItem
                                key={item.productId}
                                item={item}
                                updateQuantity={updateQuantity}
                                removeFromCart={removeFromTempCart}
                                onEditNote={(item) => {
                                  setCurrentCartItem(item);
                                  setShowCartItemNoteModal(true);
                                }}
                                darkMode={darkMode}
                              />
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="mt-4">
                        <button onClick={() => setShowSendConfirmModal(true)} disabled={tempCart.length === 0 || !!error} className="w-full flex justify-center items-center py-3 px-4 border rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-pastel-purple-600 to-indigo-600 hover:from-pastel-purple-700 hover:to-indigo-700 disabled:opacity-50">
                          <Send className="h-4 w-4 mr-2" /> Kirim Daftar Belanja
                        </button>
                      </div>
                    </>
                  )}

                  {activeTab === 'history' && (
                    <PelayanHistory darkMode={darkMode} attendantId={session?.user?.id} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>


        {showBarcodeScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={handleScannerClose} />}

        {/* Modal Pemilihan Pelanggan */}
        {showCustomerSelectionModal && (
          <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[90] p-4 ${showCustomerSelectionModal ? '' : 'hidden'}`}>
            <div className={`rounded-xl shadow-xl w-full max-w-md ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`p-6 border-b ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex justify-between items-center">
                  <h3 className={`text-xl font-bold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Pilih Pelanggan
                  </h3>
                  <button
                    onClick={() => setShowCustomerSelectionModal(false)}
                    className={`p-1 rounded-full ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                    }`}
                  >
                    <X className={`h-5 w-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                  </button>
                </div>
                <p className={`mt-1 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Pilih pelanggan atau gunakan sebagai pelanggan umum
                </p>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Cari Pelanggan
                  </label>
                  <input
                    type="text"
                    placeholder="Cari nama atau nomor telepon..."
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      darkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                    value=""
                    onChange={(e) => {}} // Akan ditangani dengan useEffect dan debounce
                  />
                </div>

                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Pelanggan Terpilih
                  </label>
                  <div className={`p-4 rounded-lg border ${
                    darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
                  }`}>
                    {selectedCustomerForSend ? (
                      <div>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedCustomerForSend.name}
                          {selectedCustomerForSend.membershipType && ` - ${selectedCustomerForSend.membershipType}`}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {selectedCustomerForSend.phone} {selectedCustomerForSend.code && `• Kode: ${selectedCustomerForSend.code}`}
                        </p>
                        {selectedCustomerForSend.discount > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            selectedCustomerForSend.discount >= 5 ? 'bg-purple-100 text-purple-800' :
                            selectedCustomerForSend.discount >= 4 ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          } ${darkMode ? 'text-xs' : ''}`}>
                            {selectedCustomerForSend.discount}% Diskon
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Belum memilih pelanggan</p>
                    )}
                  </div>
                </div>
              </div>

              <div className={`p-6 border-t flex justify-end space-x-3 ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                  onClick={() => {
                    setSelectedCustomerForSend(defaultCustomer || null);
                    setShowCustomerSelectionModal(false);
                    setShowNoteModal(true);
                  }}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Gunakan Umum
                </button>
                <button
                  onClick={handleCustomerSelectionConfirm}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode
                      ? 'bg-pastel-purple-600 hover:bg-pastel-purple-700 text-white'
                      : 'bg-pastel-purple-600 hover:bg-pastel-purple-700 text-white'
                  }`}
                >
                  Lanjutkan
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmationModal
            isOpen={showSendConfirmModal}
            onClose={() => setShowSendConfirmModal(false)}
            onConfirm={handleConfirmSend}
            title="Konfirmasi Pengiriman"
            message={`Anda akan mengirim ${tempCart.length} item ke daftar tangguhkan. Pilih pelanggan terlebih dahulu?`}
            confirmText="Lanjutkan"
            cancelText="Batal"
            isLoading={isSubmitting}
            variant="info"
        />

        {/* Modal untuk menambahkan catatan */}
        {showNoteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className={`rounded-xl shadow-xl w-full max-w-md ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`p-6 border-b ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h3 className={`text-xl font-bold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Tambahkan Catatan
                </h3>
                <p className={`mt-1 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Silakan tambahkan catatan atau ciri khusus untuk daftar belanja ini
                </p>
              </div>

              <div className="p-6">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Contoh: Pesanan catering untuk 50 orang, minta kantong besar"
                  className={`w-full h-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                />
              </div>

              <div className={`p-6 border-t flex justify-end space-x-3 ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                  onClick={() => {
                    setShowNoteModal(false);
                    setNote('');
                  }}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Batal
                </button>
                <button
                  onClick={handleSendWithNote}
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    darkMode
                      ? 'bg-pastel-purple-600 hover:bg-pastel-purple-700 text-white'
                      : 'bg-pastel-purple-600 hover:bg-pastel-purple-700 text-white'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim ke Daftar Tangguhkan'}
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmationModal
            isOpen={showClearCartModal}
            onClose={() => setShowClearCartModal(false)}
            onConfirm={handleClearCart}
            title="Konfirmasi Hapus Keranjang"
            message="Apakah Anda yakin ingin menghapus semua item dari daftar belanja?"
            confirmText="Ya, Hapus"
            cancelText="Batal"
            variant="danger"
        />

        <CartItemNoteModal
          isOpen={showCartItemNoteModal}
          onClose={() => setShowCartItemNoteModal(false)}
          onSave={addNoteToCartItem}
          item={currentCartItem}
          darkMode={darkMode}
        />
      </div>
    </ProtectedRoute>
  );
}

// Wrapper component untuk menyediakan state pelayan
function AttendantPageWrapper() {
  return (
    <PelayanStateProvider>
      <AttendantDashboard />
    </PelayanStateProvider>
  );
}

export default AttendantPageWrapper;