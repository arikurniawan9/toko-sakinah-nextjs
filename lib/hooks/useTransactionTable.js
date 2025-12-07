// lib/hooks/useTransactionTable.js
import { useState, useEffect, useCallback } from 'react';

export function useTransactionTable() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  
  // State untuk filter tambahan
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const fetchTransactions = useCallback(async () => {
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
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      if (statusFilter) params.append('status', statusFilter);
      if (paymentMethodFilter) params.append('paymentMethod', paymentMethodFilter);
      if (minAmount) params.append('minAmount', minAmount);
      if (maxAmount) params.append('maxAmount', maxAmount);

      const response = await fetch(`/api/transactions/sales?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Gagal mengambil data transaksi');
      }
      const data = await response.json();
      setTransactions(data.transactions || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalTransactions(data.pagination?.total || 0);
    } catch (err) {
      setError('Terjadi kesalahan saat mengambil data: ' + err.message);
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, dateRange, statusFilter, paymentMethodFilter, minAmount, maxAmount]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateRange, statusFilter, paymentMethodFilter, minAmount, maxAmount]);

  // Fungsi untuk mengatur filter
  const handleDateRangeFilter = useCallback((value) => {
    setDateRange(value);
  }, []);

  const handleStatusFilter = useCallback((value) => {
    setStatusFilter(value);
  }, []);

  const handlePaymentMethodFilter = useCallback((value) => {
    setPaymentMethodFilter(value);
  }, []);

  const handleMinAmountFilter = useCallback((value) => {
    setMinAmount(value);
  }, []);

  const handleMaxAmountFilter = useCallback((value) => {
    setMaxAmount(value);
  }, []);

  // Fungsi untuk menghapus semua filter
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setDateRange({ start: '', end: '' });
    setStatusFilter('');
    setPaymentMethodFilter('');
    setMinAmount('');
    setMaxAmount('');
  }, []);

  // Cek apakah ada filter aktif
  const hasActiveFilters = searchTerm || dateRange.start || dateRange.end || statusFilter || paymentMethodFilter || minAmount || maxAmount;

  return {
    transactions,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalTransactions,
    fetchTransactions,
    setError,
    // Filter states
    dateRange,
    statusFilter,
    paymentMethodFilter,
    minAmount,
    maxAmount,
    // Filter handlers
    handleDateRangeFilter,
    handleStatusFilter,
    handlePaymentMethodFilter,
    handleMinAmountFilter,
    handleMaxAmountFilter,
    clearFilters,
    hasActiveFilters
  };
}