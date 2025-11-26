// lib/hooks/useCashierCategoryTable.js
import { useState, useEffect } from 'react';

export const useCashierCategoryTable = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      // Untuk kasir, gunakan API endpoint yang sama tapi dengan validasi role sesuai
      const url = `/api/kategori?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal mengambil data');
      setCategories(data.categories || []);
      setTotalCategories(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Separate effect for search with debounce
  useEffect(() => {
    if (searchTerm === '') {
      // If search term is empty, fetch immediately without debounce and reset to first page
      setCurrentPage(1);
      fetchCategories();
    } else {
      // Otherwise, use debounce for search term changes
      const handler = setTimeout(() => {
        setCurrentPage(1); // Reset to page 1 when search term changes
        fetchCategories();
      }, 500);

      // Cleanup function
      return () => clearTimeout(handler);
    }
  }, [searchTerm]); // Only run when searchTerm changes

  // Separate effect for pagination and itemsPerPage changes (not for search)
  useEffect(() => {
    fetchCategories();
  }, [currentPage, itemsPerPage]);

  return {
    categories,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCategories,
    fetchCategories,
    setError
  };
};