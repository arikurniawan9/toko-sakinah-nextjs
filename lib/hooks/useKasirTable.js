// lib/hooks/useKasirTable.js
import { useState, useEffect } from 'react';

export const useKasirTable = () => {
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCashiers, setTotalCashiers] = useState(0);

  const fetchCashiers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/kasir?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengambil data kasir');
      }
      
      const data = await response.json();
      setCashiers(data.users || []); // API returns 'users' for cashiers
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCashiers(data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching cashiers:', err);
      setError('Terjadi kesalahan saat mengambil data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashiers();
  }, [currentPage, itemsPerPage, searchTerm]);

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return {
    cashiers,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCashiers,
    fetchCashiers,
    setError,
  };
};
