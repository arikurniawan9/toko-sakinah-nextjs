import { useState, useEffect, useCallback } from 'react';

export const useCategoryTable = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
      });
      const response = await fetch(`/api/kategori?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengambil data kategori');
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
      setPagination(prev => ({
        ...prev,
        totalPages: data.pagination?.totalPages || 1,
        total: data.pagination?.total || 0,
      }));
    } catch (err) {
      setError('Terjadi kesalahan saat mengambil data: ' + err.message);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Reset page to 1 when search term changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm]);

  return {
    categories,
    loading,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    pagination,
    setPagination,
    fetchCategories,
  };
};