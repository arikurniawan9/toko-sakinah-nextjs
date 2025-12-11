// lib/hooks/useMemberTable.js
import { useState, useEffect } from 'react';

export const useMemberTable = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);

  const fetchMembers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/member?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengambil data member');
      }

      const data = await response.json();
      setMembers(data.members || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalMembers(data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Terjadi kesalahan saat mengambil data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentPage, itemsPerPage, searchTerm]);

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return {
    members,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalMembers,
    fetchMembers,
    setError,
  };
};
