// lib/hooks/useProductTable.js
import { useState, useEffect, useCallback } from 'react';

export function useProductTable() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // State untuk filter tambahan
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [minStock, setMinStock] = useState('');
  const [maxStock, setMaxStock] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Membangun query parameter
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm
      });

      // Tambahkan filter tambahan ke query parameter
      if (categoryFilter) params.append('category', categoryFilter);
      if (supplierFilter) params.append('supplier', supplierFilter);
      if (minStock) params.append('minStock', minStock);
      if (maxStock) params.append('maxStock', maxStock);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const response = await fetch(`/api/produk?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Gagal mengambil data produk');
      }
      const data = await response.json();
      setProducts(data.products || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalProducts(data.pagination?.total || 0);
    } catch (err) {
      setError('Terjadi kesalahan saat mengambil data: ' + err.message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, categoryFilter, supplierFilter, minStock, maxStock, minPrice, maxPrice]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, supplierFilter, minStock, maxStock, minPrice, maxPrice]);

  // Fungsi untuk mengatur filter
  const handleCategoryFilter = useCallback((value) => {
    setCategoryFilter(value);
  }, []);

  const handleSupplierFilter = useCallback((value) => {
    setSupplierFilter(value);
  }, []);

  const handleMinStockFilter = useCallback((value) => {
    setMinStock(value);
  }, []);

  const handleMaxStockFilter = useCallback((value) => {
    setMaxStock(value);
  }, []);

  const handleMinPriceFilter = useCallback((value) => {
    setMinPrice(value);
  }, []);

  const handleMaxPriceFilter = useCallback((value) => {
    setMaxPrice(value);
  }, []);

  // Fungsi untuk menghapus semua filter
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setCategoryFilter('');
    setSupplierFilter('');
    setMinStock('');
    setMaxStock('');
    setMinPrice('');
    setMaxPrice('');
  }, []);

  // Cek apakah ada filter aktif
  const hasActiveFilters = searchTerm || categoryFilter || supplierFilter || minStock || maxStock || minPrice || maxPrice;

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
    fetchProducts,
    setError,
    // Filter states
    categoryFilter,
    supplierFilter,
    minStock,
    maxStock,
    minPrice,
    maxPrice,
    // Filter handlers
    handleCategoryFilter,
    handleSupplierFilter,
    handleMinStockFilter,
    handleMaxStockFilter,
    handleMinPriceFilter,
    handleMaxPriceFilter,
    clearFilters,
    hasActiveFilters
  };
}
