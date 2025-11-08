// lib/hooks/usePelayanTable.js
import { useState, useEffect } from 'react';

export const usePelayanTable = () => {
  const [attendants, setAttendants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAttendants, setTotalAttendants] = useState(0);

  const fetchAttendants = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/pelayan?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengambil data pelayan');
      }
      
      const data = await response.json();
      setAttendants(data.users || []); // API returns 'users' for attendants
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalAttendants(data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching attendants:', err);
      setError('Terjadi kesalahan saat mengambil data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendants();
  }, [currentPage, itemsPerPage, searchTerm]);

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return {
    attendants,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalAttendants,
    fetchAttendants,
    setError,
  };
};
