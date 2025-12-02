'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useReducer, useCallback, useMemo, useState, useRef } from 'react';
import { ROLES } from '@/lib/constants';
import { Search, Plus, Edit, Trash2, Users, Store } from 'lucide-react';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataTable from '@/components/DataTable';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmationModal from '@/components/ConfirmationModal';
import UserEditModal from '@/components/UserEditModal';

// Initial state for the reducer
const initialState = {
  users: [],
  loading: true,
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: 10,
  sortConfig: { key: 'createdAt', direction: 'desc' },
  totalItems: 0,
  filters: {
    role: '',
    storeId: '',
    status: ''
  },
  stores: []
};

// Reducer function to handle state updates
function userManagementReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'SET_STORES':
      return { ...state, stores: action.payload };
    case 'SET_TOTAL_ITEMS':
      return { ...state, totalItems: action.payload };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload, currentPage: 1 };
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_ITEMS_PER_PAGE':
      return { ...state, itemsPerPage: action.payload, currentPage: 1 };
    case 'SET_SORT_CONFIG':
      return { ...state, sortConfig: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload }, currentPage: 1 };
    case 'RESET_FILTERS':
      return { ...state, filters: { role: '', storeId: '', status: '' }, searchTerm: '', currentPage: 1 };
    default:
      return state;
  }
}

export default function UserManagerPage() {
  const { data: session, status } = useSession();
  const [state, dispatch] = useReducer(userManagementReducer, initialState);
  const { userTheme } = useUserTheme();
  const [showTransferModal, setShowTransferModal] = useState(false);
  const storesFetchedRef = useRef(false);
  const storesFetchTimeRef = useRef(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [transferData, setTransferData] = useState({
    targetStoreId: '',
    targetRole: 'CASHIER',
    removeFromCurrent: true
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [usersToDelete, setUsersToDelete] = useState([]); // Array of user IDs to delete
  const [isDeleting, setIsDeleting] = useState(false); // New state for delete loading
  const [selectedRows, setSelectedRows] = useState([]);
  const router = useRouter();

  // Fetch functions
  const fetchUsers = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const params = new URLSearchParams({
        page: state.currentPage,
        limit: state.itemsPerPage,
        search: state.searchTerm,
        sortKey: state.sortConfig.key,
        sortDirection: state.sortConfig.direction,
        role: state.filters.role,
        storeId: state.filters.storeId,
        status: state.filters.status
      });

      const response = await fetch(`/api/manager/users?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        dispatch({ type: 'SET_USERS', payload: data.users || [] });
        dispatch({ type: 'SET_TOTAL_ITEMS', payload: data.pagination?.total || 0 });
      } else {
        console.error('Error fetching users:', data.error);
        toast.error(`Gagal mengambil data user: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Terjadi kesalahan saat mengambil data user. Silakan coba lagi.');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentPage, state.itemsPerPage, state.searchTerm, state.sortConfig, state.filters]);

  const fetchStores = useCallback(async () => {
    // Cek apakah stores sudah pernah diambil dalam 5 menit terakhir (300000 ms)
    const currentTime = Date.now();
    const cacheDuration = 5 * 60 * 1000; // 5 menit dalam milidetik

    if (storesFetchedRef.current && (currentTime - storesFetchTimeRef.current) < cacheDuration) {
      // Data masih fresh, tidak perlu fetch lagi
      return;
    }

    try {
      const response = await fetch('/api/stores');
      const data = await response.json();

      if (response.ok) {
        dispatch({ type: 'SET_STORES', payload: data.stores || [] });
        // Tandai bahwa stores telah diambil dan simpan waktu pengambilan
        storesFetchedRef.current = true;
        storesFetchTimeRef.current = currentTime;
      } else {
        console.error('Error fetching stores:', data.error);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  }, []);

  // Custom hook for debouncing
  function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  }

  // Memoized handler functions
  const handleSearch = useCallback((term) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
  }, []);

  // Debounced search term
  const debouncedSearchTerm = useDebounce(state.searchTerm, 500);

  const handleItemsPerPageChange = useCallback((value) => {
    dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: value });
  }, []);

  const handleTransferUser = async (userId, targetStoreId, targetRole, removeFromCurrent) => {
    try {
      const response = await fetch(`/api/manager/users/${userId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetStoreId,
          targetRole,
          removeFromCurrentStore: removeFromCurrent
        })
      });

      if (response.ok) {
        const targetStore = state.stores.find(store => store.id === targetStoreId);
        const storeName = targetStore ? targetStore.name : 'Toko Tujuan';

        toast.success(`User ${selectedUser.name} berhasil dipindahkan ke toko ${storeName} sebagai ${targetRole}`);
        fetchUsers(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(`Gagal memindahkan user: ${error.error || 'Terjadi kesalahan'}`);
      }
    } catch (error) {
      console.error('Error transferring user:', error);
      toast.error('Terjadi kesalahan saat memindahkan user');
    }
  };

  const confirmTransferUser = () => {
    if (selectedUser && transferData.targetStoreId) {
      handleTransferUser(
        selectedUser.id,
        transferData.targetStoreId,
        transferData.targetRole,
        transferData.removeFromCurrent
      );
      setShowTransferModal(false);
      setTransferData({
        targetStoreId: '',
        targetRole: 'CASHIER',
        removeFromCurrent: true
      });
      setSelectedUser(null);
    }
  };

  // Handler untuk multiple selection
  const handleSelectAll = useCallback(() => {
    if (selectedRows.length === state.users.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(state.users.map(user => user.id));
    }
  }, [selectedRows.length, state.users]);

  const handleSelectRow = useCallback((userId) => {
    setSelectedRows(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  }, []);

  const handleDeleteMultiple = useCallback(() => {
    if (selectedRows.length === 0) return;
    setUsersToDelete(selectedRows);
    setShowDeleteModal(true);
  }, [selectedRows]);


  const handlePageChange = useCallback((page) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
  }, []);

  const handleSort = useCallback((config) => {
    dispatch({ type: 'SET_SORT_CONFIG', payload: config });
  }, []);

  const handleFilterChange = useCallback((filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);


  // Custom function to handle transfer data changes
  const handleTransferDataChange = useCallback((e) => {
    const { name, value } = e.target;
    setTransferData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const [isEditing, setIsEditing] = useState(false);

  const handleEditUser = async (updatedData) => {
    if (!selectedUser) return;

    setIsEditing(true);
    try {
      const response = await fetch(`/api/manager/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`User ${updatedData.name} berhasil diperbarui!`);
        fetchUsers(); // Refresh data
        setShowEditModal(false);
        setSelectedUser(null);
      } else {
        toast.error(result.error || 'Gagal memperbarui user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Terjadi kesalahan saat memperbarui user');
    } finally {
      setIsEditing(false);
    }
  };

  // Custom function to handle transfer checkbox changes
  const handleTransferCheckboxChange = useCallback((e) => {
    const { name, checked } = e.target;
    setTransferData(prev => ({
      ...prev,
      [name]: checked
    }));
  }, []);

  // Effect to fetch stores data when authenticated
  useEffect(() => {
    if (status === 'loading') return;

    // Jika user tidak authenticated atau bukan MANAGER, reset cache dan redirect
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      storesFetchedRef.current = false; // Reset cache
      storesFetchTimeRef.current = 0;
      router.push('/unauthorized');
      return;
    }

    fetchStores();
  }, [status, session, router, fetchStores]);

  // Effect to fetch users data and respond to parameter changes
  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }

    fetchUsers();
  }, [status, session, router, debouncedSearchTerm, state.currentPage, state.itemsPerPage, state.sortConfig, state.filters, fetchUsers]);

  // Hydration-safe loading and authentication checks
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
    router.push('/unauthorized');
    return null;
  }

  // Get store name by ID
  const getStoreName = useCallback((storeId) => {
    const store = state.stores.find(s => s.id === storeId);
    return store ? store.name : 'Toko Tidak Ditemukan';
  }, [state.stores]);

  // CSS class constants for reuse
  const roleColors = {
    'MANAGER': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    'WAREHOUSE': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    'ADMIN': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    'CASHIER': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    'ATTENDANT': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100'
  };

  const statusColors = {
    'AKTIF': 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
    'TIDAK_AKTIF': 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
  };

  const baseBadgeClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
  const baseStatusClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';

  // Memoized rendering functions
  const renderRole = useCallback((role) => {
    return (
      <span className={`${baseBadgeClasses} ${roleColors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'}`}>
        {role}
      </span>
    );
  }, [baseBadgeClasses, roleColors]);

  const renderStatusSimple = useCallback((status) => (
    <span className={`${baseStatusClasses} ${statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'}`}>
      {status}
    </span>
  ), [baseStatusClasses, statusColors]);

  const renderStores = useCallback((_, user) => (
    <div className="text-sm">
      {user.stores && user.stores.length > 0 ? (
        user.stores.map(store => (
          <div key={store.id} className="mb-1 last:mb-0">
            <div className="font-medium">{store.name}</div>
            <div className="text-gray-600 dark:text-gray-400">{store.role}</div>
            <div className="text-xs text-gray-500">{new Date(store.assignedAt).toLocaleDateString()}</div>
          </div>
        ))
      ) : (
        <span className="text-gray-500">Tidak ada toko</span>
      )}
    </div>
  ), []);

  // Columns configuration for the DataTable
  const columns = useMemo(() => [
    {
      key: 'number',
      title: 'No',
      render: (_, __, index) => (state.currentPage - 1) * state.itemsPerPage + index + 1
    },
    {
      key: 'name',
      title: 'Nama',
      sortable: true,
      className: 'font-medium'
    },
    {
      key: 'username',
      title: 'Username',
      sortable: true
    },
    {
      key: 'role',
      title: 'Peran',
      sortable: true,
      render: renderRole
    },
    {
      key: 'stores',
      title: 'Toko & Peran',
      render: renderStores
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: renderStatusSimple
    }
  ], [state.currentPage, state.itemsPerPage, renderRole, renderStatusSimple, renderStores]);

  // Row actions for the DataTable
  const renderRowActions = useCallback((user) => {
    // Jika user statusnya TIDAK_AKTIF, tampilkan tombol aktifkan
    if (user.status === 'TIDAK_AKTIF') {
      return (
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              try {
                const response = await fetch(`/api/manager/users/${user.id}/activate`, {
                  method: 'PATCH'
                });

                if (response.ok) {
                  const activatedUser = await response.json();
                  toast.success(`User ${activatedUser.name} berhasil diaktifkan kembali!`);
                  fetchUsers(); // Refresh data
                } else {
                  const error = await response.json();
                  toast.error(`Gagal mengaktifkan user: ${error.error || 'Terjadi kesalahan'}`);
                }
              } catch (error) {
                console.error('Error activating user:', error);
                toast.error('Terjadi kesalahan saat mengaktifkan user');
              }
            }}
            className="p-2 text-green-600 hover:bg-green-100 rounded-lg dark:text-green-400 dark:hover:bg-gray-700"
            title="Aktifkan Pengguna"
          >
            <Users className="h-4 w-4" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex space-x-2">
        <button
          onClick={() => {
            // Check if the current user is trying to modify their own account
            const isCurrentUser = session?.user?.id === user.id;
            if (isCurrentUser) {
              toast.error('Anda tidak dapat mentransfer akun Anda sendiri');
              return;
            }
            setSelectedUser(user);
            setTransferData(prev => ({ ...prev, targetStoreId: '' }));
            setShowTransferModal(true);
          }}
          disabled={session?.user?.id === user.id}
          className={`${session?.user?.id !== user.id ? 'p-2 text-purple-600 hover:bg-purple-100' : 'p-2 text-gray-400 cursor-not-allowed'} rounded-lg dark:text-purple-400 dark:hover:bg-gray-700`}
          title={session?.user?.id !== user.id ? "Transfer User" : "Tidak dapat transfer akun sendiri"}
        >
          <Store className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            // Check if the current user is trying to edit their own account
            const isCurrentUser = session?.user?.id === user.id;
            if (isCurrentUser) {
              toast.error('Anda tidak dapat mengedit akun Anda sendiri');
              return;
            }
            setSelectedUser(user);
            setShowEditModal(true);
          }}
          disabled={session?.user?.id === user.id}
          className={`${session?.user?.id !== user.id ? 'p-2 text-blue-600 hover:bg-blue-100' : 'p-2 text-gray-400 cursor-not-allowed'} rounded-lg dark:text-blue-400 dark:hover:bg-gray-700`}
          title={session?.user?.id !== user.id ? "Edit Pengguna" : "Tidak dapat edit akun sendiri"}
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={async () => {
            // Check if the current user is trying to delete their own account
            const isCurrentUser = session?.user?.id === user.id;
            if (isCurrentUser) {
              toast.error('Anda tidak dapat menghapus akun Anda sendiri');
              return;
            }
            setUsersToDelete([user.id]);
            setShowDeleteModal(true);
          }}
          disabled={session?.user?.id === user.id}
          className={`${session?.user?.id !== user.id ? 'p-2 text-red-600 hover:bg-red-100' : 'p-2 text-gray-400 cursor-not-allowed'} rounded-lg dark:text-red-400 dark:hover:bg-gray-700`}
          title={session?.user?.id !== user.id ? "Hapus Pengguna" : "Tidak dapat hapus akun sendiri"}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  }, [router, fetchUsers, session]);

  // Mobile columns configuration
  const mobileColumns = useMemo(() => [
    {
      key: 'name',
      title: 'Nama',
      render: (name, user) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</div>
          <div className="text-xs mt-1">
            <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              {user.role}
            </span>
            <span className={`ml-2 px-2 py-1 rounded-full ${
              user.status === 'AKTIF' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
            }`}>
              {user.status}
            </span>
          </div>
        </div>
      )
    }
  ], []);

  // Additional actions for the DataTable
  const additionalActions = useMemo(() => [
    {
      label: 'Tambah Pengguna',
      icon: Plus,
      onClick: () => router.push('/manager/users/add'),
      className: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  ], [router]);

  // Memoized filter options
  const filterOptions = useMemo(() => [
    {
      key: 'role',
      label: 'Peran',
      type: 'select',
      options: [
        { value: '', label: 'Semua Peran' },
        { value: 'MANAGER', label: 'Manager' },
        { value: 'WAREHOUSE', label: 'Gudang' },
        { value: 'ADMIN', label: 'Admin Toko' },
        { value: 'CASHIER', label: 'Kasir' },
        { value: 'ATTENDANT', label: 'Pelayan' }
      ]
    },
    {
      key: 'storeId',
      label: 'Toko',
      type: 'select',
      options: [
        { value: '', label: 'Semua Toko' },
        ...state.stores.map(store => ({ value: store.id, label: store.name }))
      ]
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'Semua Status' },
        { value: 'AKTIF', label: 'Aktif' },
        { value: 'TIDAK_AKTIF', label: 'Tidak Aktif' }
      ]
    }
  ], [state.stores]);

  if (state.loading && state.users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Transfer User Modal Component
  const TransferUserModal = () => {
    const targetStore = state.stores.find(store => store.id === transferData.targetStoreId);
    
    if (!showTransferModal || !selectedUser) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-medium mb-4">Transfer User: {selectedUser.name}</h3>

          {/* Informasi user */}
          <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className="text-sm font-medium">{selectedUser.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">@{selectedUser.username}</div>
            <div className="text-xs mt-1">
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                {selectedUser.role}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Toko Tujuan</label>
            <select
              name="targetStoreId"
              value={transferData.targetStoreId}
              onChange={handleTransferDataChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Pilih Toko</option>
              {state.stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Role di Toko Baru</label>
            <select
              name="targetRole"
              value={transferData.targetRole}
              onChange={handleTransferDataChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="ADMIN">Admin</option>
              <option value="CASHIER">Kasir</option>
              <option value="ATTENDANT">Pelayan</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="removeFromCurrent"
                checked={transferData.removeFromCurrent}
                onChange={handleTransferCheckboxChange}
                className="rounded"
              />
              <span className="ml-2">Hapus dari toko lama (jika dicentang)</span>
            </label>
          </div>

          {/* Preview hasil transfer */}
          {transferData.targetStoreId && targetStore && (
            <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-200">Pratinjau Transfer:</div>
              <div className="text-xs mt-1">
                <div>User <span className="font-semibold">{selectedUser.name}</span> akan</div>
                <div className="mt-1">
                  {transferData.removeFromCurrent
                    ? `dipindahkan ke toko ${targetStore.name} sebagai ${transferData.targetRole}`
                    : `ditambahkan ke toko ${targetStore.name} sebagai ${transferData.targetRole}`}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setShowTransferModal(false);
                setTransferData({
                  targetStoreId: '',
                  targetRole: 'CASHIER',
                  removeFromCurrent: true
                });
                setSelectedUser(null);
              }}
              className="px-4 py-2 border rounded"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={confirmTransferUser}
              className="px-4 py-2 bg-blue-600 text-white rounded"
              disabled={!transferData.targetStoreId}
            >
              Transfer
            </button>
          </div>
        </div>
      </div>
    );
  };


  const confirmDeleteUsers = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/manager/users`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: usersToDelete })
      });

      if (response.ok) {
        const message = usersToDelete.length > 1
          ? `${usersToDelete.length} user berhasil dinonaktifkan dari semua toko!`
          : `User berhasil dinonaktifkan dari semua toko!`;
        toast.success(message);
        setSelectedRows([]); // Clear selection
        fetchUsers(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(`Gagal menghapus user: ${error.error || 'Terjadi kesalahan'}`);
      }
    } catch (error) {
      console.error('Error deleting users:', error);
      toast.error('Terjadi kesalahan saat menghapus user');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setUsersToDelete([]);
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manajemen Pengguna</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Kelola semua pengguna di seluruh toko dalam sistem Anda
        </p>
      </div>

      {/* DataTable */}
      <DataTable
        data={state.users}
        columns={columns}
        mobileColumns={mobileColumns}
        loading={state.loading}
        searchTerm={state.searchTerm}
        onSearch={handleSearch}
        sortConfig={state.sortConfig}
        onSort={handleSort}
        additionalActions={additionalActions}
        showFilters={false} // Temporarily disable filters to reduce complexity
        filterOptions={filterOptions}
        filterValues={state.filters}
        onFilterChange={handleFilterChange}
        onToggleFilters={() => {}}
        rowActions={renderRowActions}
        darkMode={userTheme.darkMode}
        // Multiple selection
        selectedRows={selectedRows}
        onSelectAll={handleSelectAll}
        onSelectRow={handleSelectRow}
        // Pagination configuration
        pagination={{
          currentPage: state.currentPage,
          totalPages: Math.ceil(state.totalItems / state.itemsPerPage),
          totalItems: state.totalItems,
          startIndex: state.totalItems > 0 ? (state.currentPage - 1) * state.itemsPerPage + 1 : 0,
          endIndex: Math.min(state.currentPage * state.itemsPerPage, state.totalItems),
          onPageChange: handlePageChange
        }}
        itemsPerPage={state.itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        // Delete multiple
        onDeleteMultiple={handleDeleteMultiple}
        selectedRowsCount={selectedRows.length}
      />

      {/* Modals */}
      <TransferUserModal />
      <UserEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        stores={state.stores}
        onSave={handleEditUser}
        loading={isEditing}
      />
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setUsersToDelete([]);
        }}
        onConfirm={confirmDeleteUsers}
        isLoading={isDeleting}
        title={usersToDelete.length > 1 ? 'Hapus Akses Beberapa Pengguna' : 'Hapus Akses Pengguna'}
        message={
          usersToDelete.length > 1
            ? `Apakah Anda yakin ingin menghapus akses ${usersToDelete.length} pengguna ini dari semua toko? Akun dan relasi pengguna akan dihapus dari sistem, tetapi pengguna tetap bisa dibuat kembali nanti. Tindakan ini tidak dapat dibatalkan.`
            : `Apakah Anda yakin ingin menghapus akses pengguna ini dari semua toko? Akun dan relasi pengguna akan dihapus dari sistem, tetapi pengguna tetap bisa dibuat kembali nanti. Tindakan ini tidak dapat dibatalkan.`
        }
        confirmText="Ya, Hapus Akses"
        variant="danger"
      />

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={userTheme.darkMode ? "dark" : "light"}
      />
    </div>
  );
}