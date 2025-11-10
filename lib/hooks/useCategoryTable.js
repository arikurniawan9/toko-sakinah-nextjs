import { useState, useEffect, useCallback } from 'react';

export const useCategoryTable = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);

  // For backward compatibility
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
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
      });
      const response = await fetch(`/api/kategori?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengambil data kategori');
      }

      const data = await response.json();
      setCategories(data.categories || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCategories(data.pagination?.total || 0);
      
      // For backward compatibility
      setPagination(prev => ({
        ...prev,
        page: currentPage,
        limit: itemsPerPage,
        totalPages: data.pagination?.totalPages || 1,
        total: data.pagination?.total || 0,
      }));
    } catch (err) {
      setError('Terjadi kesalahan saat mengambil data: ' + err.message);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Reset page to 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Sync pagination state for backward compatibility
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      page: currentPage,
      limit: itemsPerPage,
    }));
  }, [currentPage, itemsPerPage]);

  return {
    categories,
    loading,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCategories,
    fetchCategories,
    // For backward compatibility
    pagination,
    setPagination: (newPagination) => {
      setPagination(newPagination);
      setCurrentPage(newPagination.page);
      setItemsPerPage(newPagination.limit);
    },
  };
};