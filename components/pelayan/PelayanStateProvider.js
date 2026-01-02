// components/pelayan/PelayanStateProvider.js
'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';
import { useNotification } from '../notifications/NotificationProvider';
import { transformProductsForDisplay } from '../../utils/productUtils';

// Membuat context
const PelayanStateContext = createContext();

// Fungsi untuk mendapatkan nilai context (akan error jika digunakan di luar provider)
export const usePelayanState = () => {
  const context = useContext(PelayanStateContext);
  if (!context) {
    throw new Error('usePelayanState must be used within a PelayanStateProvider');
  }
  return context;
};

// Provider komponen
export const PelayanStateProvider = ({ children }) => {
  const { data: session } = useSession();
  const { showNotification } = useNotification();

  // State variables
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tempCart, setTempCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [defaultCustomer, setDefaultCustomer] = useState(null);
  const [quickProducts, setQuickProducts] = useState([]);

  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fungsi untuk menyimpan dan memuat state dari localStorage
  const saveStateToStorage = useCallback((key, data) => {
    if (typeof window !== 'undefined' && session?.user?.id) {
      try {
        const storageKey = `${key}_${session.user.id}`;
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }, [session]);

  const loadStateFromStorage = useCallback((key) => {
    if (typeof window !== 'undefined' && session?.user?.id) {
      try {
        const storageKey = `${key}_${session.user.id}`;
        const storedData = localStorage.getItem(storageKey);
        return storedData ? JSON.parse(storedData) : null;
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        return null;
      }
    }
    return null;
  }, [session]);

  // Muat state dari localStorage saat komponen dimount
  useEffect(() => {
    if (session?.user?.id) {
      // Muat cart dari localStorage
      const savedCart = loadStateFromStorage('tempCart');
      if (savedCart) {
        setTempCart(savedCart);
      }

      // Muat selected customer dari localStorage
      const savedCustomer = loadStateFromStorage('selectedCustomer');
      if (savedCustomer) {
        setSelectedCustomer(savedCustomer);
      }

      // Muat quick products dari localStorage
      const savedProducts = loadStateFromStorage('quickProducts');
      if (savedProducts) {
        setQuickProducts(savedProducts);
      }
    }
  }, [session, loadStateFromStorage]);

  // Simpan state ke localStorage saat ada perubahan
  useEffect(() => {
    if (session?.user?.id && typeof window !== 'undefined') {
      saveStateToStorage('tempCart', tempCart);
    }
  }, [tempCart, session, saveStateToStorage]);

  useEffect(() => {
    if (session?.user?.id && typeof window !== 'undefined') {
      saveStateToStorage('selectedCustomer', selectedCustomer);
    }
  }, [selectedCustomer, session, saveStateToStorage]);

  useEffect(() => {
    if (session?.user?.id && typeof window !== 'undefined') {
      saveStateToStorage('quickProducts', quickProducts);
    }
  }, [quickProducts, session, saveStateToStorage]);

  // Quick Products Management
  const addQuickProduct = useCallback((product) => {
    setQuickProducts(prev => {
      // Jangan tambahkan produk yang sudah ada
      if (prev.some(p => p.id === product.id)) {
        return prev;
      }
      // Batasi jumlah produk quick add (misalnya 10 produk)
      const newProducts = [...prev, product];
      return newProducts.length > 10 ? newProducts.slice(0, 10) : newProducts;
    });
  }, []);

  const removeQuickProduct = useCallback((productId) => {
    setQuickProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  // Data Fetching for Products
  const fetchProducts = useCallback(async (searchQuery = '') => {
    setIsSearchingProducts(true);
    try {
      setError(null);
      if (!searchQuery.trim()) {
        setProducts([]);
        return;
      }

      // Cek apakah produk sudah ada di cache untuk pencarian ini
      const cacheKey = `products_${searchQuery}`;
      const cachedProducts = loadStateFromStorage(cacheKey);

      if (cachedProducts && Date.now() - cachedProducts.timestamp < 5 * 60 * 1000) { // 5 menit cache
        setProducts(cachedProducts.data);
        setIsSearchingProducts(false);
        return;
      }

      const url = `/api/produk?search=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal memuat produk.');
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      const transformedProducts = transformProductsForDisplay(data.products);

      // Simpan ke cache
      saveStateToStorage(cacheKey, {
        data: transformedProducts,
        timestamp: Date.now()
      });

      setProducts(transformedProducts);
    } catch (err) {
      setError(`Tidak dapat mengambil data produk: ${err.message}`);
      showNotification(err.message, 'error');
      setProducts([]);
    } finally {
      setIsSearchingProducts(false);
    }
  }, [showNotification, loadStateFromStorage, saveStateToStorage]);

  // Fetch products by category
  const fetchProductsByCategory = useCallback(async (categoryId) => {
    setIsSearchingProducts(true);
    try {
      setError(null);
      const url = `/api/produk?categoryId=${encodeURIComponent(categoryId)}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal memuat produk berdasarkan kategori.');
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      const transformedProducts = transformProductsForDisplay(data.products);
      setProducts(transformedProducts);
    } catch (err) {
      setError(`Tidak dapat mengambil data produk berdasarkan kategori: ${err.message}`);
      showNotification(err.message, 'error');
      setProducts([]);
    } finally {
      setIsSearchingProducts(false);
    }
  }, [showNotification]);

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/kategori');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal memuat kategori.');
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data.categories || [];
    } catch (err) {
      showNotification(`Tidak dapat mengambil data kategori: ${err.message}`, 'error');
      return [];
    }
  }, [showNotification]);

  // Data Fetching for Customer Search
  const searchCustomers = useCallback(async (searchQuery = '') => {
    setIsSearchingCustomers(true);
    let foundMembers = [];
    try {
      setError(null);
      if (!searchQuery.trim()) {
        setCustomers([]);
        return [];
      }

      // Cek apakah pencarian untuk pelanggan umum
      if (searchQuery.toLowerCase() === 'umum' || searchQuery.toLowerCase() === 'pelanggan umum') {
        // Jika pencarian untuk pelanggan umum, kembalikan pelanggan default (umum)
        if (defaultCustomer) {
          foundMembers = [defaultCustomer];
          setCustomers(foundMembers);
          return foundMembers;
        }
      }

      const url = `/api/member?global=true&search=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal memuat pelanggan.');
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      foundMembers = data.members || [];
      setCustomers(foundMembers);
    } catch (err) {
      setError(`Tidak dapat memuat daftar pelanggan: ${err.message}`);
      showNotification(err.message, 'warning');
      setCustomers([]);
    } finally {
      setIsSearchingCustomers(false);
    }
    return foundMembers;
  }, [showNotification, defaultCustomer]);

  // Fetch default customer (UMUM) on initial load
  const fetchDefaultCustomer = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      let response = await fetch('/api/member?global=true&search=UMUM');
      let data;

      if (response.ok) {
        data = await response.json();
        if (data.error) throw new Error(data.error);
      } else {
        // Jika permintaan gagal, coba buat pelanggan UMUM secara otomatis
        const errorData = await response.json();
        console.log('Error fetching UMUM member:', errorData);
      }

      if (data && data.members && data.members.length > 0) {
        const umumCustomer = data.members[0];
        setDefaultCustomer(umumCustomer);
        // Jika belum ada pelanggan terpilih, gunakan pelanggan umum
        if (!selectedCustomer) {
          setSelectedCustomer(umumCustomer);
        }
      } else {
        // Jika pelanggan UMUM tidak ditemukan, coba buat secara otomatis
        try {
          const createResponse = await fetch('/api/member', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Pelanggan Umum',
              code: 'UMUM',
              phone: '',
              address: '',
              membershipType: 'RETAIL',
              discount: 0,
              global: true
            })
          });

          if (createResponse.ok) {
            const createdData = await createResponse.json();
            setDefaultCustomer(createdData.member);
            if (!selectedCustomer) {
              setSelectedCustomer(createdData.member);
            }
            showNotification('Pelanggan Umum berhasil dibuat.', 'success');
          } else {
            const errorData = await createResponse.json();
            console.error('Error creating UMUM member:', errorData);
            // Jika tidak bisa dibuat, gunakan data default sementara
            const defaultCustomerData = {
              id: 'default-umum',
              name: 'Pelanggan Umum',
              code: 'UMUM',
              phone: '',
              address: '',
              membershipType: 'RETAIL',
              discount: 0,
              global: true
            };
            setDefaultCustomer(defaultCustomerData);
            if (!selectedCustomer) {
              setSelectedCustomer(defaultCustomerData);
            }
          }
        } catch (createErr) {
          console.error('Error in creating UMUM member:', createErr);
          // Jika semua gagal, gunakan data default sementara
          const defaultCustomerData = {
            id: 'default-umum',
            name: 'Pelanggan Umum',
            code: 'UMUM',
            phone: '',
            address: '',
            membershipType: 'RETAIL',
            discount: 0,
            global: true
          };
          setDefaultCustomer(defaultCustomerData);
          if (!selectedCustomer) {
            setSelectedCustomer(defaultCustomerData);
          }
        }
      }
    } catch (err) {
      console.error('Error in fetchDefaultCustomer:', err);
      // Jika terjadi error, gunakan data default sementara
      const defaultCustomerData = {
        id: 'default-umum',
        name: 'Pelanggan Umum',
        code: 'UMUM',
        phone: '',
        address: '',
        membershipType: 'RETAIL',
        discount: 0,
        global: true
      };
      setDefaultCustomer(defaultCustomerData);
      if (!selectedCustomer) {
        setSelectedCustomer(defaultCustomerData);
      }
    } finally {
      setIsInitialLoading(false);
    }
  }, [showNotification, selectedCustomer]);

  // Cart Management
  const addToTempCart = useCallback((product, note = '') => {
    if (!product || !product.id) {
      showNotification('Produk tidak valid.', 'error');
      return;
    }
    if (product.stock <= 0) {
      showNotification(`Stok produk ${product.name} sudah habis.`, 'warning');
      return;
    }
    setTempCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          showNotification(`Stok produk ${product.name} tidak mencukupi.`, 'warning');
          return prevCart;
        }
        return prevCart.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prevCart,
        {
          productId: product.id,
          name: product.name,
          price: product.sellingPrice || 0,
          quantity: 1,
          image: product.image,
          stock: product.stock,
          category: product.categoryName || product.category || '', // Tambahkan informasi kategori
          note: note // Tambahkan catatan
        }
      ];
    });
    showNotification(`${product.name} ditambahkan ke keranjang.`, 'info');
  }, [showNotification]);

  // Fungsi untuk menambahkan catatan ke item di keranjang
  const addNoteToCartItem = useCallback((productId, note) => {
    setTempCart(prevCart => {
      return prevCart.map(item =>
        item.productId === productId ? { ...item, note } : item
      );
    });
  }, []);

  const removeFromTempCart = (productId) => {
    setTempCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const updateQuantity = useCallback((productId, newQuantity) => {
    setTempCart(prevCart => {
      const item = prevCart.find(i => i.productId === productId);
      if (!item) return prevCart;

      if (newQuantity > item.stock) {
        showNotification(`Stok tidak mencukupi. Sisa stok: ${item.stock}`, 'warning');
        return prevCart;
      }
      if (newQuantity <= 0) {
        return prevCart.filter(i => i.productId !== productId);
      }
      return prevCart.map(i => i.productId === productId ? { ...i, quantity: newQuantity } : i);
    });
  }, [showNotification]);

  const handleClearCart = () => {
    setTempCart([]);
    showNotification('Daftar belanja telah dikosongkan.', 'info');
  };

  const sendToCashier = useCallback(async (note = '', customerIdToUse = null) => {
    if (tempCart.length === 0) {
      showNotification('Keranjang masih kosong.', 'warning');
      return false;
    }
    setIsSubmitting(true);
    showNotification('Mengirim daftar belanja ke daftar tangguhkan...', 'info');
    try {
      // Kirim ke suspended sales API alih-alih temp-cart
      const response = await fetch('/api/suspended-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendantId: session.user.id,
          customerId: customerIdToUse || selectedCustomer?.id || null, // Gunakan pelanggan dari parameter jika ada
          items: tempCart.map(({ stock, ...item }) => item),
          note: note || 'Daftar belanja dari pelayan', // Gunakan catatan yang diberikan atau default
          storeId: session.user.storeId, // Tambahkan storeId untuk memastikan data tersimpan di toko yang benar
          selectedAttendantId: session.user.id, // Simpan ID pelayan yang membuat daftar belanja
        })
      });
      if (response.ok) {
        showNotification('Daftar belanja berhasil disimpan ke daftar tangguhkan!', 'success');
        // Kosongkan cart setelah berhasil dikirim
        setTempCart([]);
        // Jangan reset selectedCustomer disini karena mungkin masih digunakan di UI
        return true;
      } else {
        const error = await response.json();
        showNotification(`Gagal mengirim: ${error.error}`, 'error');
        return false;
      }
    } catch (err) {
      showNotification('Terjadi kesalahan saat mengirim daftar belanja.', 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [tempCart, session, selectedCustomer, showNotification]);

  const value = {
    products,
    customers,
    tempCart,
    selectedCustomer,
    setSelectedCustomer,
    defaultCustomer,
    quickProducts,
    isInitialLoading,
    isSearchingProducts,
    isSearchingCustomers,
    isSubmitting,
    error,
    setError,
    fetchProducts,
    fetchProductsByCategory,
    fetchCategories,
    searchCustomers,
    fetchDefaultCustomer,
    addToTempCart,
    removeFromTempCart,
    updateQuantity,
    handleClearCart,
    sendToCashier,
    addQuickProduct,
    removeQuickProduct,
    addNoteToCartItem,
  };

  return (
    <PelayanStateContext.Provider value={value}>
      {children}
    </PelayanStateContext.Provider>
  );
};

export default PelayanStateProvider;