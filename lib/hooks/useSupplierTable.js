// lib/hooks/useSupplierTable.js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export const useSupplierTable = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const { data: session } = useSession(); // Added session

  const fetchSuppliers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/supplier?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengambil data supplier');
      }

      const data = await response.json();
      setSuppliers(data.suppliers || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalSuppliers(data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Terjadi kesalahan saat mengambil data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [currentPage, itemsPerPage, searchTerm, session]); // Added session to dependency

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return {
    suppliers,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalSuppliers,
    fetchSuppliers,
    setError,
  };
};
