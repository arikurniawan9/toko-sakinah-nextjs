// lib/hooks/useReceivableTable.js
'use client';

import { useState, useEffect, useCallback } from 'react';

export function useReceivableTable() {
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalReceivables, setTotalReceivables] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchReceivables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/laporan/piutang?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal mengambil data piutang');
      }
      const data = await response.json();

      setReceivables(data.receivables);
      setTotalReceivables(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 0);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchReceivables();
  }, [fetchReceivables]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return {
    receivables,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalReceivables,
    fetchReceivables,
    setError,
  };
}
