import { useState, useCallback, useMemo } from 'react';

export function useDistributionCart() {
  const [items, setItems] = useState([]);

  const addToCart = useCallback((warehouseProduct) => {
    if (!warehouseProduct || !warehouseProduct.Product) return;

    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.productId === warehouseProduct.productId);

      if (existingItem) {
        // Update quantity if product already exists
        const newQuantity = Math.min(existingItem.quantity + 1, warehouseProduct.quantity);
        return prevItems.map((item) =>
          item.productId === warehouseProduct.productId
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // Add new product to the cart
        const newItem = {
          id: warehouseProduct.id, // This is the warehouseProductId
          productId: warehouseProduct.productId,
          name: warehouseProduct.Product.name,
          productCode: warehouseProduct.Product.productCode,
          quantity: 1,
          stock: warehouseProduct.quantity,
          purchasePrice: warehouseProduct.Product.purchasePrice || 0,
        };
        return [...prevItems, newItem];
      }
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId, newQuantity) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.productId === productId) {
          if (newQuantity <= 0) {
            // This will be filtered out by the return statement's filter
            return null;
          }
          const updatedQuantity = Math.min(newQuantity, item.stock);
          return { ...item, quantity: updatedQuantity };
        }
        return item;
      }).filter(Boolean) // Remove items that were marked as null
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Gunakan useMemo untuk menghitung cartTotal secara efisien
  const cartTotal = useMemo(() => {
    return items.reduce((total, item) => total + (item.quantity * item.purchasePrice), 0);
  }, [items]);

  return {
    items,
    setItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
  };
}
