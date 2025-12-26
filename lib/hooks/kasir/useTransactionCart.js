import { useState, useCallback } from 'react';

export function useTransactionCart() {
  const [cart, setCart] = useState([]);
  const [calculation, setCalculation] = useState(null);
  const [overallDiscount, setOverallDiscount] = useState(0);

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

        return [...prevCart, newItem];
      }
    });
  }, []);

  // Fungsi untuk mengatur diskon keseluruhan transaksi
  const setOverallDiscountValue = useCallback((discount) => {
    setOverallDiscount(discount);
  }, []);

  // Getter untuk diskon keseluruhan
  const getOverallDiscount = useCallback(() => {
    return overallDiscount;
  }, [overallDiscount]);

  // Fungsi untuk menghitung perhitungan transaksi
  const calculateTransaction = useCallback((cartItems, selectedMember, getTierPrice, additionalDiscount = 0) => {
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

    // Total diskon adalah jumlah dari diskon item dan diskon keseluruhan
    const totalDiscount = itemDiscount + additionalDiscount;

    // Hitung grand total (no member discount applied separately anymore since it's already factored in)
    const totalAfterItemDiscount = subtotal;

    // finalGrandTotal sekarang adalah total setelah diskon keseluruhan diterapkan
    const finalGrandTotal = Math.max(0, totalAfterItemDiscount - additionalDiscount);

    // Total diskon akhir adalah jumlah semua diskon
    const finalTotalDiscount = totalDiscount;

    const newCalculation = {
      items: calculatedItems,
      subTotal: subtotal,
      itemDiscount: itemDiscount,
      memberDiscount: memberDiscount,
      additionalDiscount: additionalDiscount, // Tambahkan diskon tambahan ke perhitungan
      totalDiscount: finalTotalDiscount,
      tax: 0, // Pajak akan dihitung di API
      grandTotal: Math.max(0, Math.round(finalGrandTotal)) // Pastikan tidak negatif
    };

    setCalculation(newCalculation);
  }, []);

  // Reset cart dan perhitungan
  const resetCart = useCallback(() => {
    setCart([]);
    setCalculation(null);
    setOverallDiscount(0);
  }, []);

  return {
    cart,
    setCart,
    calculation,
    removeFromCart,
    updateQuantity,
    addToCart,
    calculateTransaction,
    overallDiscount,
    setOverallDiscountValue,
    getOverallDiscount,
    resetCart
  };
}