import { useState, useEffect } from 'react';

export const useCategoryTable = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/kategori?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data kategori');
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCategories(data.pagination?.total || 0);
    } catch (err) {
      setError('Terjadi kesalahan saat mengambil data: ' + err.message);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [currentPage, itemsPerPage, searchTerm]);

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
    setError,
  };
};