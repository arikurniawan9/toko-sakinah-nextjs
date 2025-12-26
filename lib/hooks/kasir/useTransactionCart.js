import { useState, useCallback, useRef } from 'react';

export function useTransactionCart() {
  const [cart, setCart] = useState([]);
  const [calculation, setCalculation] = useState(null);

  // Gunakan useRef untuk menyimpan referensi showNotification
  const showNotificationRef = useRef(null);

  // Fungsi untuk menginisialisasi notifikasi
  const initializeNotification = useCallback((showNotification) => {
    showNotificationRef.current = showNotification;
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId, newQuantity, productStock, productName) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.productId === productId) {
          if (newQuantity <= 0) {
            removeFromCart(productId);
            return item; // return tidak digunakan karena removeFromCart akan menghapus item
          }
          if (newQuantity > productStock) {
            if (showNotificationRef.current) {
              showNotificationRef.current(`Jumlah maksimum ${productName} adalah ${productStock} (stok tersedia).`, 'warning');
            }
            return { ...item, quantity: Math.min(newQuantity, productStock) };
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  }, [removeFromCart]);

  const addToCart = useCallback((product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productId === product.id);
      if (existingItem) {
        // Update quantity jika produk sudah ada
        return prevCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) }
            : item
        );
      } else {
        // Tambah produk baru ke cart
        const newItem = {
          productId: product.id,
          name: product.name,
          productCode: product.productCode,
          quantity: 1,
          stock: product.stock,
          retailPrice: product.retailPrice,
        silverPrice: product.silverPrice,
        goldPrice: product.goldPrice,
        platinumPrice: product.platinumPrice,
        };

        // Tampilkan notifikasi jika stok rendah
        if (product.stock < 5 && showNotificationRef.current) {
          showNotificationRef.current(`Stok produk ${product.name} kurang dari 5!`, 'warning');
        }

        return [...prevCart, newItem];
      }
    });
  }, []);

  // Fungsi untuk menghitung perhitungan transaksi
  const calculateTransaction = useCallback((cartItems, selectedMember, getTierPrice) => {
    if (cartItems.length === 0) {
      setCalculation(null);
      return;
    }

    let subtotal = 0;
    let itemDiscount = 0;
    const membershipType = selectedMember?.membershipType || 'RETAIL';
    const calculatedItems = cartItems.map((item) => {
      const basePrice = getTierPrice(item, 1, membershipType);
      const actualPrice = getTierPrice(item, item.quantity, membershipType);
      const retailPrice = item.retailPrice || 0; // Use retail price for comparison
      const discountPerItem = retailPrice - actualPrice; // Calculate discount from retail price
      const itemSubtotal = actualPrice * item.quantity;
      const totalItemDiscount = discountPerItem * item.quantity;
      subtotal += itemSubtotal;
      itemDiscount += totalItemDiscount;
      return {
        ...item,
        originalPrice: retailPrice, // Use retail price for comparison
        priceAfterItemDiscount: actualPrice,
        itemDiscount: totalItemDiscount,
        subtotal: itemSubtotal,
      };
    });

    // In the new system, member discount is already included in the fixed pricing
    const memberDiscount = itemDiscount; // The total discount is the difference from retail price

    // Total diskon adalah jumlah dari semua jenis diskon (additionalDiscount dihapus)
    const totalDiscount = itemDiscount;

    // Hitung grand total (no member discount applied separately anymore since it's already factored in, additionalDiscount dihapus)
    const totalAfterItemDiscount = subtotal;

    // finalGrandTotal sekarang hanya berdasarkan totalAfterItemDiscount
    const finalGrandTotal = Math.max(0, totalAfterItemDiscount);

    // Total diskon akhir adalah jumlah semua diskon
    const finalTotalDiscount = totalDiscount;

    const newCalculation = {
      items: calculatedItems,
      subTotal: subtotal,
      itemDiscount: itemDiscount,
      memberDiscount: memberDiscount,
      totalDiscount: finalTotalDiscount,
      tax: 0, // Pajak akan dihitung di API
      grandTotal: Math.max(0, Math.round(finalGrandTotal)), // Pastikan tidak negatif
    };

    setCalculation(newCalculation);

    // Periksa apakah ada produk dengan stok rendah dan tampilkan notifikasi
    const hasLowStockItems = calculatedItems.some(item => item.stock < 5);
    if (hasLowStockItems && showNotificationRef.current) {
      showNotificationRef.current('Beberapa produk memiliki stok rendah!', 'warning');
    }
  }, []);

  return {
    cart,
    setCart,
    calculation,
    initializeNotification,
    removeFromCart,
    updateQuantity,
    addToCart,
    calculateTransaction,
  };
}