// components/pelayan/PelayanStateContext.js
'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useNotification } from '../notifications/NotificationProvider';
import { transformProductsForDisplay } from '../../utils/productUtils';

const PelayanStateContext = createContext();

export const usePelayanState = () => {
  const context = useContext(PelayanStateContext);
  if (!context) {
    throw new Error('usePelayanState must be used within a PelayanStateProvider');
  }
  return context;
};

export const PelayanStateProvider = ({ children }) => {
  const { data: session } = useSession();
  const { showNotification } = useNotification();
  
  // State variables
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tempCart, setTempCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [defaultCustomer, setDefaultCustomer] = useState(null);
  
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Data Fetching for Products
  const fetchProducts = useCallback(async (searchQuery = '') => {
    setIsSearchingProducts(true);
    try {
      setError(null);
      if (!searchQuery.trim()) {
        setProducts([]);
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
      setProducts(transformedProducts);
    } catch (err) {
      setError(`Tidak dapat mengambil data produk: ${err.message}`);
      showNotification(err.message, 'error');
      setProducts([]);
    } finally {
      setIsSearchingProducts(false);
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
  }, [showNotification]);

  // Fetch default customer (UMUM) on initial load
  const fetchDefaultCustomer = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      const response = await fetch('/api/member?global=true&search=UMUM');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal memuat pelanggan default.');
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (data.members && data.members.length > 0) {
        const umumCustomer = data.members[0];
        setDefaultCustomer(umumCustomer);
        setSelectedCustomer(umumCustomer);
      } else {
        showNotification('Member "UMUM" tidak ditemukan. Pastikan sudah terdaftar.', 'warning');
      }
    } catch (err) {
      showNotification(`Tidak dapat memuat member default: ${err.message}`, 'error');
    } finally {
      setIsInitialLoading(false);
    }
  }, [showNotification]);

  // Cart Management
  const addToTempCart = useCallback((product) => {
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
      return [ ...prevCart, { productId: product.id, name: product.name, price: product.sellingPrice || 0, quantity: 1, image: product.image, stock: product.stock } ];
    });
    showNotification(`${product.name} ditambahkan ke keranjang.`, 'info');
  }, [showNotification]);

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

  const sendToCashier = useCallback(async (note = '') => {
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
          customerId: selectedCustomer?.id || null,
          items: tempCart.map(({ stock, ...item }) => item),
          note: note || 'Daftar belanja dari pelayan', // Gunakan catatan yang diberikan atau default
          storeId: session.user.storeId, // Tambahkan storeId untuk memastikan data tersimpan di toko yang benar
          selectedAttendantId: session.user.id, // Simpan ID pelayan yang membuat daftar belanja
        })
      });
      if (response.ok) {
        showNotification('Daftar belanja berhasil disimpan ke daftar tangguhkan!', 'success');
        setTempCart([]);
        setSelectedCustomer(defaultCustomer); // Reset to default customer
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
  }, [tempCart, session, selectedCustomer, defaultCustomer, showNotification]);

  const value = {
    products,
    customers,
    tempCart,
    selectedCustomer,
    setSelectedCustomer,
    defaultCustomer,
    isInitialLoading,
    isSearchingProducts,
    isSearchingCustomers,
    isSubmitting,
    error,
    setError,
    fetchProducts,
    searchCustomers,
    fetchDefaultCustomer,
    addToTempCart,
    removeFromTempCart,
    updateQuantity,
    handleClearCart,
    sendToCashier,
  };

  return (
    <PelayanStateContext.Provider value={value}>
      {children}
    </PelayanStateContext.Provider>
  );
};