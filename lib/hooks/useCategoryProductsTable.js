// lib/hooks/useCategoryProductsTable.js
import { useState, useEffect, useCallback } from 'react';

export const useCategoryProductsTable = (categoryId) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const fetchCategoryProducts = useCallback(async () => {
    if (!categoryId) {
      setProducts([]);
      setTotalProducts(0);
      setTotalPages(1);
      setLoading(false);
      setError('');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const urlParams = new URLSearchParams({
        categoryId,
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm
      });
      // Tambahkan storeId ke request jika tersedia (tidak diperlukan karena sistem otomatis mengambil dari session)
      const url = `/api/products?${urlParams.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal mengambil data produk');

      setProducts(data.products || []);
      setTotalProducts(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message);
      setProducts([]);
      setTotalProducts(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [categoryId, currentPage, itemsPerPage, searchTerm]);

  // Separate effect for search with debounce
  useEffect(() => {
    if (searchTerm === '') {
      // If search term is empty, fetch immediately without debounce and reset to first page
      setCurrentPage(1);
      fetchCategoryProducts();
    } else {
      // Otherwise, use debounce for search term changes
      const handler = setTimeout(() => {
        setCurrentPage(1); // Reset to page 1 when search term changes
        fetchCategoryProducts();
      }, 500);

      // Cleanup function
      return () => clearTimeout(handler);
    }
  }, [searchTerm, fetchCategoryProducts]);

  // Effect untuk inisialisasi dan ketika categoryId berubah
  useEffect(() => {
    if (categoryId) {
      fetchCategoryProducts();
    }
  }, [categoryId, fetchCategoryProducts]);

  // Separate effect for pagination and itemsPerPage changes (not for search)
  useEffect(() => {
    fetchCategoryProducts();
  }, [currentPage, itemsPerPage, fetchCategoryProducts]);

  return {
    products,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalProducts,
    fetchCategoryProducts,
    setError
  };
};