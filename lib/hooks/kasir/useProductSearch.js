// lib/hooks/kasir/useProductSearch.js
import { useState, useEffect, useCallback } from 'react';

export function useProductSearch(addToCart) {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [isProductListLoading, setIsProductListLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchTerm.trim().length === 0) {
        setProducts([]);
        return;
      }
      setIsProductListLoading(true);
      try {
        const response = await fetch(
          `/api/produk?search=${encodeURIComponent(searchTerm)}&limit=20`
        );
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setIsProductListLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleScan = useCallback(async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedSearchTerm = searchTerm.trim();
      if (!trimmedSearchTerm) return;

      setIsProductListLoading(true);
      try {
        // First, try to find by exact product code
        let response = await fetch(`/api/produk?productCode=${encodeURIComponent(trimmedSearchTerm)}`);
        let data = await response.json();
        let scannedProduct = data.products && data.products.length > 0 ? data.products[0] : null;

        // If not found, try a broader search (name or code)
        if (!scannedProduct) {
          response = await fetch(`/api/produk?search=${encodeURIComponent(trimmedSearchTerm)}`);
          data = await response.json();
          // Find a more exact match from the search results
          scannedProduct = data.products?.find(
            (p) =>
              p.productCode.toLowerCase() === trimmedSearchTerm.toLowerCase() ||
              p.name.toLowerCase() === trimmedSearchTerm.toLowerCase()
          );
        }

        if (scannedProduct) {
          addToCart(scannedProduct);
          setSearchTerm(''); // Clear search term after adding to cart
        } else {
          alert(`Produk dengan kode/nama "${trimmedSearchTerm}" tidak ditemukan.`);
        }
      } catch (error) {
        console.error('Error scanning product:', error);
        alert('Terjadi kesalahan saat mencari produk.');
      } finally {
        setIsProductListLoading(false);
      }
    }
  }, [searchTerm, addToCart]);

  return {
    searchTerm,
    setSearchTerm,
    products,
    isProductListLoading,
    handleScan,
  };
}
