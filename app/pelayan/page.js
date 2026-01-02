// app/pelayan/page.js
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Search, ShoppingCart, Users, Send, Camera, Sun, Moon, LogOut, AlertCircle, Trash2, X, History, Bell, Package, TrendingUp, ShoppingCartIcon, User, Star, Edit3, BarChart3, Scan, CameraOff, Camera as CameraIcon } from 'lucide-react';
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
import { useUserTheme } from '../../components/UserThemeContext';

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
      className={`flex items-center space-x-4 p-4 rounded-xl border transition-all duration-200 ${
        isOutOfStock 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:shadow-md cursor-pointer hover:scale-[1.02]'
      } ${
        darkMode 
          ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
      onClick={() => !isOutOfStock && addToCart(product)}
    >
      <div className="flex-shrink-0 relative">
        {product.image ? (
          <img src={product.image} alt={productName} className="h-14 w-14 object-contain rounded-lg" />
        ) : (
          <div className="h-14 w-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center">
            <svg className="h-7 w-7 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {isOutOfStock && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
            X
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 dark:text-white truncate">{productName}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Kode: {productCode}</div>
        <div className="flex items-center mt-1 space-x-2">
          <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
            Stok: {productStock}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <div className="font-bold text-lg text-purple-600 dark:text-purple-400">
          Rp {productSellingPrice.toLocaleString('id-ID')}
        </div>
        <div className="flex space-x-2 mt-2">
          <button
            className={`p-2 rounded-full ${
              isQuick
                ? (darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-500')
                : (darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500')
            } transition-colors`}
            onClick={handleQuickToggle}
            title={isQuick ? "Hapus dari produk cepat" : "Tambah ke produk cepat"}
          >
            {isQuick ? (
              <Star className="h-5 w-5" fill="currentColor" />
            ) : (
              <Star className="h-5 w-5" />
            )}
          </button>
          <button
            className={`p-2 rounded-full ${
              darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
            } transition-colors`}
            onClick={handleAddToCart}
            title="Tambah langsung ke keranjang"
          >
            <ShoppingCart className="h-5 w-5" />
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
    <li className="py-4 px-3 rounded-lg border transition-colors duration-200 hover:shadow-sm hover:scale-[1.01] mb-2 last:mb-0"
      style={{
        borderLeft: '4px solid #8b5cf6',
        background: darkMode ? 'linear-gradient(90deg, #1f2937 0%, #111827 100%)' : 'linear-gradient(90deg, #f9fafb 0%, #ffffff 100%)'
      }}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 dark:text-white truncate">{item.name || 'Produk tidak dikenal'}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{itemQuantity} x Rp {itemPrice.toLocaleString('id-ID')}</div>
          {item.note && (
            <div className={`text-sm mt-2 p-2 rounded-lg flex items-start ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              <span className="font-medium mr-2">Catatan:</span>
              <span className="truncate">{item.note}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3 ml-3">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => updateQuantity(item.productId, itemQuantity - 1)} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              disabled={itemQuantity <= 1}
            >
              <span className="text-lg font-bold">-</span>
            </button>
            <span className="text-base font-semibold dark:text-white min-w-[24px] text-center">{itemQuantity}</span>
            <button 
              onClick={() => updateQuantity(item.productId, itemQuantity + 1)} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <span className="text-lg font-bold">+</span>
            </button>
          </div>
          <button
            onClick={() => onEditNote(item)}
            className="ml-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            title="Tambah/Edit catatan"
          >
            <Edit3 className="h-5 w-5" />
          </button>
          <button 
            onClick={() => removeFromCart(item.productId)} 
            className="ml-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors" 
            title="Hapus item dari keranjang"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="text-base text-right text-purple-600 dark:text-purple-400 mt-2 font-semibold">
        Rp {itemSubtotal.toLocaleString('id-ID')}
      </div>
    </li>
  );
};

function AttendantDashboard() {
  const { data: session, status } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  // Local UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showSendConfirmModal, setShowSendConfirmModal] = useState(false);
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [note, setNote] = useState('');
  const [activeTab, setActiveTab] = useState('cart'); // 'cart' or 'history'
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

    // Cek apakah kode yang di-scan adalah untuk pelanggan umum
    if (decodedText.toLowerCase() === 'umum' || decodedText.toLowerCase() === 'pelanggan umum') {
      if (defaultCustomer) {
        setSelectedCustomer(defaultCustomer);
        showNotification(`Pelanggan Umum dipilih.`, 'success');
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
  }, [addToTempCart, setSelectedCustomer, showNotification, searchCustomers, defaultCustomer]);

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


  const handleScannerClose = () => {
    setShowBarcodeScanner(false);
  };

  if (isInitialLoading || status === 'loading') {
    return <LoadingSpinner />;
  }

  return (
    <main className={`flex-1 p-4 min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">


          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-xl flex items-center shadow-md">
                <AlertCircle className="h-5 w-5 mr-3"/>
                <span>{error}</span>
            </div>
          )}

          <div className="space-y-8">
            {/* Search and Scanner Section */}
            <div className={`rounded-2xl shadow-xl ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border overflow-hidden`}>
              <div className="p-6">
                <div className="relative mb-6">
                  <input
                    type="text"
                    placeholder="Cari produk berdasarkan nama atau kode..."
                    className={`w-full pl-12 pr-24 py-4 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={!!error}
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
                    <button
                      onClick={() => setShowBarcodeScanner(true)}
                      className="p-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-md"
                      title="Scan Barcode"
                      disabled={!!error}
                    >
                      <Scan className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className={`rounded-xl shadow-sm overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="p-4 max-h-96 overflow-y-auto">
                     {isSearchingProducts ? <LoadingSpinner /> : searchTerm.trim() === '' ? (
                      <div className="text-center py-12">
                        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                          <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">Silakan cari produk berdasarkan nama atau kode.</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Atau gunakan tombol scan untuk membaca barcode</p>
                      </div>
                    ) : products.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                          <X className="h-8 w-8 text-red-500" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">Tidak ada produk ditemukan untuk pencarian "{searchTerm}".</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {products.map(product => {
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
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Daftar Belanja */}
            <div className={`rounded-2xl shadow-xl ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border overflow-hidden`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Daftar Belanja</h2>
                  <div className="flex items-center space-x-3">
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-sm font-medium px-3 py-1 rounded-full">
                      {tempCart.length} item
                    </span>
                    {tempCart.length > 0 && (
                      <button
                        onClick={() => setShowClearCartModal(true)}
                        className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Kosongkan Keranjang"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto pr-2 -mr-2">
                  {tempCart.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                        <ShoppingCart className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-lg">Daftar belanja kosong</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Tambahkan produk dari daftar di atas</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
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

                <div className="mt-6">
                  <button
                    onClick={() => setShowSendConfirmModal(true)}
                    disabled={tempCart.length === 0 || !!error}
                    className="w-full flex justify-center items-center py-4 px-6 border rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all transform hover:scale-[1.02]"
                  >
                    <Send className="h-5 w-5 mr-2" /> Kirim Daftar Belanja
                  </button>
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
    </main>
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