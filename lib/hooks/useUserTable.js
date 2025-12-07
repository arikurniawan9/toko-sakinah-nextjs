import { useState, useEffect, useCallback } from 'react';

export const useUserTable = (role = '', apiEndpoint = '/api/store-users') => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // State untuk filter tambahan
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [usernameFilter, setUsernameFilter] = useState('');
  const [employeeNumberFilter, setEmployeeNumberFilter] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      // Tambahkan filter tambahan
      if (roleFilter) {
        params.append('role', roleFilter);
      }

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      if (usernameFilter) {
        params.append('username', usernameFilter);
      }

      if (employeeNumberFilter) {
        params.append('employeeNumber', employeeNumberFilter);
      }

      if (role) {
        params.append('role', role);
      }

      const response = await fetch(`${apiEndpoint}?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Gagal mengambil data: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
      setTotalUsers(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message);
      setUsers([]);
      setTotalUsers(0);
      setTotalPages(1);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, role, apiEndpoint, roleFilter, statusFilter, usernameFilter, employeeNumberFilter]);

  // Fetch users when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, usernameFilter, employeeNumberFilter]);

  // Fungsi untuk mengatur filter
  const handleRoleFilter = useCallback((value) => {
    setRoleFilter(value);
  }, []);

  const handleStatusFilter = useCallback((value) => {
    setStatusFilter(value);
  }, []);

  const handleUsernameFilter = useCallback((value) => {
    setUsernameFilter(value);
  }, []);

  const handleEmployeeNumberFilter = useCallback((value) => {
    setEmployeeNumberFilter(value);
  }, []);

  // Fungsi untuk menghapus semua filter
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
    setUsernameFilter('');
    setEmployeeNumberFilter('');
  }, []);

  // Cek apakah ada filter aktif
  const hasActiveFilters = searchTerm || roleFilter || statusFilter || usernameFilter || employeeNumberFilter;

  return {
    users,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalUsers,
    fetchUsers,
    setError,
    // Filter states
    roleFilter,
    statusFilter,
    usernameFilter,
    employeeNumberFilter,
    // Filter handlers
    handleRoleFilter,
    handleStatusFilter,
    handleUsernameFilter,
    handleEmployeeNumberFilter,
    clearFilters,
    hasActiveFilters
  };
};