'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useReducer, useCallback, useMemo, useState, useRef } from 'react';
import { ROLES } from '@/lib/constants';
import { Search, Plus, Edit, Eye, Trash2, Filter, Download, Upload } from 'lucide-react';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataTable from '@/components/DataTable';
import CreateStoreModal from '@/components/CreateStoreModal';
import StoreDetailModal from '@/components/StoreDetailModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Initial state for the reducer
const initialState = {
  stores: [],
  loading: true,
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: 10,
  sortConfig: { key: 'createdAt', direction: 'desc' },
  totalItems: 0,
  filters: {
    status: '',
    dateRange: null
  }
};

// Reducer function to handle state updates
function storeManagementReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
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
      return { ...state, filters: { status: '', dateRange: null }, searchTerm: '', currentPage: 1 };
    default:
      return state;
  }
}

export default function StoreManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [state, dispatch] = useReducer(storeManagementReducer, initialState);
  const { userTheme } = useUserTheme();
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  // Ref untuk state untuk mencegah perubahan fungsi fetch saat state berubah
  const stateRef = useRef();
  stateRef.current = state;

  // CSS class constants untuk status
  const statusColors = {
    'ACTIVE': 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
    'INACTIVE': 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
    'SUSPENDED': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
  };

  const baseStatusClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';

  // Fetch function using useRef to prevent unnecessary re-creation
  const fetchStores = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const currentState = stateRef.current;
      const params = new URLSearchParams({
        page: currentState.currentPage,
        limit: currentState.itemsPerPage,
        search: currentState.searchTerm,
        sortKey: currentState.sortConfig.key,
        sortDirection: currentState.sortConfig.direction,
        status: currentState.filters.status
      });

      const response = await fetch(`/api/manager/stores?${params.toString()}`);

      if (!response.ok) {
        // Handle different status codes appropriately
        if (response.status === 401) {
          // Unauthorized - redirect to login
          router.push('/login');
          return;
        } else if (response.status === 403) {
          // Forbidden - redirect to unauthorized page
          router.push('/unauthorized');
          return;
        } else {
          // Other errors - display error message
          const errorData = await response.text();
          console.error('Error response from API:', errorData);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();

      dispatch({ type: 'SET_STORES', payload: data.stores || [] });
      dispatch({ type: 'SET_TOTAL_ITEMS', payload: data.pagination?.total || 0 });
    } catch (error) {
      console.error('Error fetching stores:', error);
      if (error.message.includes('401') || error.message.includes('403')) {
        router.push('/login');
      } else {
        toast.error(`Error mengambil data toko: ${error.message}`);
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch, router]);

  // Memoized handler functions
  const handleSearch = useCallback((term) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
  }, []);

  const handleItemsPerPageChange = useCallback((value) => {
    dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: value });
  }, []);

  const handlePageChange = useCallback((page) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
  }, []);

  const handleSort = useCallback((config) => {
    dispatch({ type: 'SET_SORT_CONFIG', payload: config });
  }, []);

  const handleFilterChange = useCallback((filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  // Effect to fetch data when search, pagination, or sort parameters change
  useEffect(() => {
    fetchStores();
  }, [state.searchTerm, state.currentPage, state.itemsPerPage, state.sortConfig.key, state.sortConfig.direction, state.filters.status]);

  // Initial data fetch
  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }

    fetchStores();
  }, [status, session, router]);

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

  // Memoized rendering functions
  const renderStatus = useCallback((status) => (
    <span className={`${baseStatusClasses} ${statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'}`}>
      {status}
    </span>
  ), [baseStatusClasses]);

  // Handler untuk menghapus toko (mengubah status menjadi INACTIVE)
  const handleDeleteStore = useCallback(async (storeId, password) => {
    try {
      // Ambil data toko yang sekarang
      const storeResponse = await fetch(`/api/manager/stores/${storeId}`);
      const storeData = await storeResponse.json();

      if (!storeResponse.ok) {
        toast.error('Gagal mengambil data toko');
        return;
      }

      const currentStore = storeData.store;

      // Kirim password dalam header untuk verifikasi
      const response = await fetch(`/api/manager/stores/${storeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Manager-Password': password, // Kirim password untuk verifikasi
        },
        body: JSON.stringify({
          name: currentStore.name,
          description: currentStore.description,
          address: currentStore.address,
          phone: currentStore.phone,
          email: currentStore.email,
          status: 'INACTIVE' // hanya mengubah status menjadi INACTIVE
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Jika berhasil diubah statusnya, refresh data
        fetchStores();
        toast.success('Toko berhasil dinonaktifkan');
      } else {
        toast.error(result.error || 'Gagal menonaktifkan toko');
      }
    } catch (error) {
      console.error('Error updating store status:', error);
      toast.error('Terjadi kesalahan saat menonaktifkan toko');
    }
  }, [fetchStores]); // Tambahkan fetchStores sebagai dependency

  // Handler untuk multiple selection
  const handleSelectAll = useCallback(() => {
    if (selectedRows.length === state.stores.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(state.stores.map(store => store.id));
    }
  }, [selectedRows.length, state.stores]);

  const handleSelectRow = useCallback((storeId) => {
    setSelectedRows(prev => {
      if (prev.includes(storeId)) {
        return prev.filter(id => id !== storeId);
      } else {
        return [...prev, storeId];
      }
    });
  }, []);

  const handleDeleteMultiple = useCallback(async () => {
    if (selectedRows.length === 0) return;

    if (confirm(`Apakah Anda yakin ingin menonaktifkan ${selectedRows.length} toko?`)) {
      try {
        // Kita tidak bisa menggunakan endpoint mass delete karena perlu verifikasi password
        // Jadi kita akan menonaktifkan satu per satu
        // Untuk sementara, kita buat versi sederhana tanpa verifikasi password
        for (const storeId of selectedRows) {
          const storeResponse = await fetch(`/api/manager/stores/${storeId}`);
          const storeData = await storeResponse.json();

          if (!storeResponse.ok) {
            toast.error(`Gagal mengambil data toko ${storeId}`);
            continue;
          }

          const currentStore = storeData.store;

          const response = await fetch(`/api/manager/stores/${storeId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: currentStore.name,
              description: currentStore.description,
              address: currentStore.address,
              phone: currentStore.phone,
              email: currentStore.email,
              status: 'INACTIVE'
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            toast.error(`Gagal menonaktifkan toko ${currentStore.name}: ${error.error}`);
          }
        }

        toast.success(`${selectedRows.length} toko berhasil dinonaktifkan!`);
        setSelectedRows([]); // Clear selection
        fetchStores(); // Refresh data
      } catch (error) {
        console.error('Error deleting stores:', error);
        toast.error('Terjadi kesalahan saat menonaktifkan toko');
      }
    }
  }, [selectedRows, fetchStores]);

  // Columns configuration for the DataTable
  const columns = useMemo(() => [
    {
      key: 'number',
      title: 'No',
      render: (_, __, index) => (state.currentPage - 1) * state.itemsPerPage + index + 1
    },
    {
      key: 'code',
      title: 'Kode Toko',
      sortable: true
    },
    {
      key: 'name',
      title: 'Nama Toko',
      sortable: true,
      className: 'font-medium'
    },
    {
      key: 'phone',
      title: 'Telepon'
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: renderStatus
    },
    {
      key: 'actions',
      title: 'Aksi',
      className: 'text-center', // Tambahkan class untuk center align pada header
      render: (_, store) => (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setSelectedStore(store)}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg dark:text-blue-400 dark:hover:bg-gray-700"
            title="Detail Toko"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => router.push(`/manager/edit-store/${store.id}`)}
            className="p-2 text-green-600 hover:bg-green-100 rounded-lg dark:text-green-400 dark:hover:bg-gray-700"
            title="Edit Toko"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setStoreToDelete(store);
              setShowDeleteModal(true);
            }}
            className="p-2 text-red-600 hover:bg-red-100 rounded-lg dark:text-red-400 dark:hover:bg-gray-700"
            title="Hapus Toko"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ], [state.currentPage, state.itemsPerPage, router, handleDeleteStore, renderStatus]);

  // Mobile columns configuration
  const mobileColumns = useMemo(() => [
    {
      key: 'name',
      title: 'Nama Toko',
      render: (name, store) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Kode: {store.code || '-'} | Telp: {store.phone || '-'}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            {store.address}
          </div>
          <div className="text-xs mt-1">
            {renderStatus(store.status)}
          </div>
          {/* Aksi untuk mobile */}
          <div className="flex justify-center space-x-2 mt-2">
            <button
              onClick={() => setSelectedStore(store)}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg dark:text-blue-400 dark:hover:bg-gray-700"
              title="Detail Toko"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => router.push(`/manager/edit-store/${store.id}`)}
              className="p-2 text-green-600 hover:bg-green-100 rounded-lg dark:text-green-400 dark:hover:bg-gray-700"
              title="Edit Toko"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setStoreToDelete(store);
                setShowDeleteModal(true);
              }}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg dark:text-red-400 dark:hover:bg-gray-700"
              title="Hapus Toko"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )
    }
  ], [setSelectedStore, router, renderStatus]);

  // Additional actions for the DataTable
  const additionalActions = useMemo(() => [
    {
      label: 'Tambah Toko Baru',
      icon: Plus,
      onClick: () => setShowCreateModal(true),
      className: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    {
      label: 'Ekspor',
      icon: Download,
      onClick: () => {
        // Implementasi ekspor data
        const exportData = {
          stores: state.stores,
          exportDate: new Date().toISOString(),
          exportedBy: session.user.name,
          totalStores: state.totalItems
        };

        // Buat file JSON untuk didownload
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `data-toko-${new Date().toISOString().slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        toast.success('Data toko berhasil diekspor!');
      },
      className: 'bg-green-600 hover:bg-green-700 text-white'
    },
    {
      label: 'Impor',
      icon: Upload,
      onClick: () => {
        // Implementasi impor data
        toast.info('Fitur impor melalui file akan segera tersedia. Silakan tambah toko secara manual melalui tombol "Tambah Toko Baru".');
      },
      className: 'bg-purple-600 hover:bg-purple-700 text-white'
    }
  ], [setShowCreateModal, state.stores, state.totalItems, session]);

  // Handler untuk menampilkan detail toko
  useEffect(() => {
    if (selectedStore) {
      setShowDetailModal(true);
    }
  }, [selectedStore]);

  // Filter options
  const filterOptions = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'Semua Status' },
        { value: 'ACTIVE', label: 'Aktif' },
        { value: 'INACTIVE', label: 'Tidak Aktif' },
        { value: 'SUSPENDED', label: 'Ditangguhkan' }
      ]
    }
  ], []);

  if (state.loading && state.stores.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const closeCreateModal = () => {
    setShowCreateModal(false);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedStore(null);
  };

  const handleStoreCreated = () => {
    // Refresh data setelah membuat toko baru
    fetchStores();
    toast.success('Toko berhasil dibuat');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manajemen Toko</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Kelola semua toko dalam sistem multi-toko Anda
        </p>
      </div>

      {/* DataTable */}
      <DataTable
        data={state.stores}
        columns={columns}
        mobileColumns={mobileColumns}
        loading={state.loading}
        searchTerm={state.searchTerm}
        onSearch={handleSearch}
        sortConfig={state.sortConfig}
        onSort={handleSort}
        additionalActions={additionalActions}
        showFilters={showFilters}
        filterOptions={filterOptions}
        filterValues={state.filters}
        onFilterChange={handleFilterChange}
        onToggleFilters={() => setShowFilters(!showFilters)}
        actions={false}  // Nonaktifkan actions bawaan DataTable agar tidak menambahkan kolom Aksi ganda
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

      {/* Create Store Modal */}
      <CreateStoreModal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        onStoreCreated={handleStoreCreated}
      />

      {/* Store Detail Modal */}
      {selectedStore && (
        <StoreDetailModal
          isOpen={showDetailModal}
          onClose={closeDetailModal}
          store={selectedStore}
        />
      )}

      {/* Delete Confirmation Modal */}
      {storeToDelete && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setStoreToDelete(null);
          }}
          onConfirm={async (password) => {
            await handleDeleteStore(storeToDelete.id, password);
            setShowDeleteModal(false);
            setStoreToDelete(null);
          }}
          storeName={storeToDelete.name}
        />
      )}

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