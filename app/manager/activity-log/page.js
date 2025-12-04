'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useReducer, useCallback, useMemo, useState } from 'react';
import { ROLES } from '@/lib/constants';
import { Search, Filter, Clock, User, Store, Users, Eye, Download } from 'lucide-react';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import DataTable from '@/components/DataTable';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

// Initial state for the reducer
const initialState = {
  logs: [],
  loading: true,
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: 10,
  sortConfig: { key: 'createdAt', direction: 'desc' },
  totalItems: 0,
  filters: {
    action: '',
    entity: '',
    dateFrom: '',
    dateTo: '',
    userId: ''
  }
};

// Reducer function to handle state updates
function activityLogReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_LOGS':
      return { ...state, logs: action.payload };
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
      return { ...state, filters: { action: '', entity: '', dateFrom: '', dateTo: '', userId: '' }, searchTerm: '', currentPage: 1 };
    default:
      return state;
  }
}

export default function ActivityLogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [state, dispatch] = useReducer(activityLogReducer, initialState);
  const { userTheme } = useUserTheme();
  const [showFilters, setShowFilters] = useState(false);

  // Fetch function
  const fetchActivityLogs = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const params = new URLSearchParams({
        page: state.currentPage,
        limit: state.itemsPerPage,
        search: state.searchTerm,
        sortKey: state.sortConfig.key,
        sortDirection: state.sortConfig.direction,
        action: state.filters.action,
        entity: state.filters.entity,
        dateFrom: state.filters.dateFrom,
        dateTo: state.filters.dateTo,
        userId: state.filters.userId
      });

      const response = await fetch(`/api/manager/activity-logs?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        } else if (response.status === 403) {
          router.push('/unauthorized');
          return;
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();

      dispatch({ type: 'SET_LOGS', payload: data.logs || [] });
      dispatch({ type: 'SET_TOTAL_ITEMS', payload: data.pagination?.total || 0 });
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      if (error.message.includes('401') || error.message.includes('403')) {
        router.push('/login');
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentPage, state.itemsPerPage, state.searchTerm, state.sortConfig, state.filters, router]);

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

  // Effect to fetch data
  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }

    fetchActivityLogs();
  }, [status, session, router, state.searchTerm, state.currentPage, state.itemsPerPage, state.sortConfig, state.filters, fetchActivityLogs]);

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

  // CSS class constants for reuse
  const actionColors = {
    'CREATE': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    'UPDATE': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    'DELETE': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    'DEACTIVATE': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    'TRANSFER': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    'LOGIN': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
    'LOGOUT': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
  };

  const entityColors = {
    'STORE': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
    'USER': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    'PRODUCT': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
    'SALE': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100',
    'EXPENSE': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100'
  };

  const baseBadgeClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';

  // Memoized rendering functions
  const renderAction = useCallback((action) => (
    <span className={`${baseBadgeClasses} ${actionColors[action] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'}`}>
      {action}
    </span>
  ), [baseBadgeClasses, actionColors]);

  const renderEntity = useCallback((entity) => (
    <span className={`${baseBadgeClasses} ${entityColors[entity] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'}`}>
      {entity}
    </span>
  ), [baseBadgeClasses, entityColors]);

  const renderTimestamp = useCallback((timestamp) => (
    <span className="text-sm">
      {format(parseISO(timestamp), 'dd MMM yyyy, HH:mm', { locale: id })}
    </span>
  ), []);

  const renderUser = useCallback((_, log) => (
    <div>
      <div className="font-medium">{log.user?.name || log.userId || 'System'}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{log.user?.username || log.userId}</div>
    </div>
  ), []);

  const renderDetails = useCallback((_, log) => {
    // Fungsi untuk mendapatkan nama item dari newValue atau oldValue
    const getItemName = () => {
      if (log.newValue) {
        try {
          const parsedValue = JSON.parse(log.newValue);
          if (log.entity === 'STORE' && parsedValue.name) return parsedValue.name;
          if (log.entity === 'USER' && parsedValue.name) return parsedValue.name;
          if (log.entity === 'PRODUCT' && parsedValue.name) return parsedValue.name;
          if (log.entity === 'SALE' && parsedValue.invoiceNumber) return `Faktur ${parsedValue.invoiceNumber}`;
        } catch (e) {
          // Jika parsing gagal, abaikan
        }
      }
      if (log.oldValue) {
        try {
          const parsedValue = JSON.parse(log.oldValue);
          if (log.entity === 'STORE' && parsedValue.name) return parsedValue.name;
          if (log.entity === 'USER' && parsedValue.name) return parsedValue.name;
          if (log.entity === 'PRODUCT' && parsedValue.name) return parsedValue.name;
          if (log.entity === 'SALE' && parsedValue.invoiceNumber) return `Faktur ${parsedValue.invoiceNumber}`;
        } catch (e) {
          // Jika parsing gagal, abaikan
        }
      }
      return log.entityId || 'Tidak dikenal';
    };

    // Fungsi untuk mendapatkan ringkasan informasi dari nilai
    const getValueSummary = (value) => {
      if (!value) return '';
      try {
        const parsed = JSON.parse(value);

        if (log.entity === 'SALE') {
          // Untuk penjualan, tampilkan ringkasan
          const total = parsed.total ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parsed.total) : '0';
          const items = parsed.saleDetails ? parsed.saleDetails.length : 0;
          return `${items} item, Total: ${total}`;
        } else if (log.entity === 'PRODUCT') {
          // Untuk produk, tampilkan harga dan stok
          const price = parsed.purchasePrice ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parsed.purchasePrice) : '0';
          return `Harga: ${price}, Stok: ${parsed.stock || 0}`;
        } else if (log.entity === 'STORE') {
          // Untuk toko, tampilkan alamat
          return parsed.address || 'Alamat tidak tersedia';
        } else if (log.entity === 'USER') {
          // Untuk user, tampilkan role
          return parsed.role || 'Role tidak tersedia';
        }

        return '';
      } catch (e) {
        return '';
      }
    };

    const itemName = getItemName();
    const summary = getValueSummary(log.newValue) || getValueSummary(log.oldValue);

    return (
      <div className="text-sm">
        <div className="font-medium text-sm mb-1 truncate max-w-xs" title={itemName}>
          {itemName}
        </div>
        {summary && (
          <div className="text-xs text-gray-600 dark:text-gray-300 mb-1 truncate max-w-xs" title={summary}>
            {summary}
          </div>
        )}
        {log.entityId && (
          <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mb-1">
            ID: {log.entityId}
          </div>
        )}
        {log.oldValue && (
          <details className="mt-1">
            <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:underline">
              Nilai Lama
            </summary>
            <pre className="text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded mt-1 overflow-x-auto max-w-xs">
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(log.oldValue), null, 2);
                } catch (e) {
                  return log.oldValue;
                }
              })()}
            </pre>
          </details>
        )}
        {log.newValue && (
          <details className="mt-1">
            <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:underline">
              Nilai Baru
            </summary>
            <pre className="text-xs bg-green-50 dark:bg-green-900/20 p-2 rounded mt-1 overflow-x-auto max-w-xs">
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(log.newValue), null, 2);
                } catch (e) {
                  return log.newValue;
                }
              })()}
            </pre>
          </details>
        )}
      </div>
    );
  }, []);

  // Columns configuration for the DataTable
  const columns = useMemo(() => [
    {
      key: 'number',
      title: 'No',
      render: (_, __, index) => (state.currentPage - 1) * state.itemsPerPage + index + 1
    },
    {
      key: 'user',
      title: 'Pengguna',
      render: renderUser
    },
    {
      key: 'action',
      title: 'Aksi',
      sortable: true,
      render: renderAction
    },
    {
      key: 'entity',
      title: 'Entitas',
      sortable: true,
      render: renderEntity
    },
    {
      key: 'entityId',
      title: 'Nama/ID'
    },
    {
      key: 'details',
      title: 'Rincian',
      render: renderDetails
    },
    {
      key: 'createdAt',
      title: 'Tanggal',
      sortable: true,
      render: renderTimestamp
    },
    {
      key: 'actions',
      title: 'Aksi',
      className: 'text-center',
      render: (_, log) => (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => router.push(`/manager/activity-log/${log.id}`)}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg dark:text-blue-400 dark:hover:bg-gray-700"
            title="Lihat Detail"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ], [state.currentPage, state.itemsPerPage, renderUser, renderAction, renderEntity, renderDetails, renderTimestamp, router]);

  // Mobile columns configuration
  const mobileColumns = useMemo(() => [
    {
      key: 'user',
      title: 'Pengguna',
      render: (_, log) => (
        <div>
          <div className="font-medium">{log.user?.name || log.userId || 'System'}</div>
          <div className="text-sm">
            <span className="inline-block mr-2">{renderAction(log.action)}</span>
            <span className="inline-block">{renderEntity(log.entity)}</span>
          </div>
          <div className="text-xs mt-1">{format(parseISO(log.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}</div>
          {/* Fungsi untuk mendapatkan nama item dari newValue atau oldValue */}
          {(() => {
            let itemName = null;
            let itemSummary = '';

            if (log.newValue) {
              try {
                const parsedValue = JSON.parse(log.newValue);
                if (log.entity === 'STORE' && parsedValue.name) itemName = parsedValue.name;
                if (log.entity === 'USER' && parsedValue.name) itemName = parsedValue.name;
                if (log.entity === 'PRODUCT' && parsedValue.name) itemName = parsedValue.name;
                if (log.entity === 'SALE' && parsedValue.invoiceNumber) itemName = `Faktur ${parsedValue.invoiceNumber}`;

                // Dapatkan ringkasan item
                if (log.entity === 'SALE') {
                  const total = parsedValue.total ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parsedValue.total) : '0';
                  const items = parsedValue.saleDetails ? parsedValue.saleDetails.length : 0;
                  itemSummary = `${items} item, Total: ${total}`;
                } else if (log.entity === 'PRODUCT') {
                  const price = parsedValue.purchasePrice ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parsedValue.purchasePrice) : '0';
                  itemSummary = `Harga: ${price}, Stok: ${parsedValue.stock || 0}`;
                } else if (log.entity === 'STORE') {
                  itemSummary = parsedValue.address || 'Alamat tidak tersedia';
                } else if (log.entity === 'USER') {
                  itemSummary = parsedValue.role || 'Role tidak tersedia';
                }
              } catch (e) {
                // Jika parsing gagal, abaikan
              }
            }

            if (!itemName && log.oldValue) {
              try {
                const parsedValue = JSON.parse(log.oldValue);
                if (log.entity === 'STORE' && parsedValue.name) itemName = parsedValue.name;
                if (log.entity === 'USER' && parsedValue.name) itemName = parsedValue.name;
                if (log.entity === 'PRODUCT' && parsedValue.name) itemName = parsedValue.name;
                if (log.entity === 'SALE' && parsedValue.invoiceNumber) itemName = `Faktur ${parsedValue.invoiceNumber}`;

                // Dapatkan ringkasan item dari old value jika baru tidak ditemukan
                if (!itemSummary && log.entity === 'SALE') {
                  const total = parsedValue.total ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parsedValue.total) : '0';
                  const items = parsedValue.saleDetails ? parsedValue.saleDetails.length : 0;
                  itemSummary = `${items} item, Total: ${total}`;
                } else if (!itemSummary && log.entity === 'PRODUCT') {
                  const price = parsedValue.purchasePrice ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parsedValue.purchasePrice) : '0';
                  itemSummary = `Harga: ${price}, Stok: ${parsedValue.stock || 0}`;
                } else if (!itemSummary && log.entity === 'STORE') {
                  itemSummary = parsedValue.address || 'Alamat tidak tersedia';
                } else if (!itemSummary && log.entity === 'USER') {
                  itemSummary = parsedValue.role || 'Role tidak tersedia';
                }
              } catch (e) {
                // Jika parsing gagal, abaikan
              }
            }

            const displayName = itemName || log.entityId || 'Tidak dikenal';
            return (
              <div>
                <div className="text-sm font-medium truncate max-w-xs" title={displayName}>
                  {displayName}
                </div>
                {itemSummary && (
                  <div className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-xs" title={itemSummary}>
                    {itemSummary}
                  </div>
                )}
              </div>
            );
          })()}
          {log.entityId && (
            <div className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-1 inline-block">
              ID: {log.entityId}
            </div>
          )}
          {/* Aksi untuk mobile */}
          <div className="flex justify-center space-x-2 mt-2">
            <button
              onClick={() => router.push(`/manager/activity-log/${log.id}`)}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg dark:text-blue-400 dark:hover:bg-gray-700"
              title="Lihat Detail"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>
      )
    }
  ], [renderAction, renderEntity, router]);

  // Additional actions for the DataTable
  const additionalActions = useMemo(() => [
    {
      label: 'Ekspor Log',
      icon: Download,
      onClick: async () => {
        try {
          const response = await fetch(`/api/manager/activity-logs?limit=${state.totalItems}&export=true`);
          const data = await response.json();
          
          if (response.ok) {
            // Buat file CSV dari data log
            const headers = ['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'IP Address', 'User Agent'];
            const csvContent = [
              headers.join(','),
              ...data.logs.map(log => [
                `"${log.createdAt}"`,
                `"${log.user?.name || log.userId || 'System'}"`,
                `"${log.action}"`,
                `"${log.entity}"`,
                `"${log.entityId || ''}"`,
                `"${log.ipAddress || ''}"`,
                `"${log.userAgent || ''}"`
              ].join(','))
            ].join('\n');

            // Simpan file CSV
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `activity-log-${new Date().toISOString().slice(0, 10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        } catch (error) {
          console.error('Error exporting logs:', error);
        }
      },
      className: 'bg-green-600 hover:bg-green-700 text-white'
    }
  ], [state.totalItems]);

  // Filter options
  const filterOptions = useMemo(() => [
    {
      key: 'action',
      label: 'Aksi',
      type: 'select',
      options: [
        { value: '', label: 'Semua Aksi' },
        { value: 'CREATE', label: 'Buat' },
        { value: 'UPDATE', label: 'Ubah' },
        { value: 'DELETE', label: 'Hapus' },
        { value: 'DEACTIVATE', label: 'Nonaktifkan' },
        { value: 'TRANSFER', label: 'Transfer' }
      ]
    },
    {
      key: 'entity',
      label: 'Entitas',
      type: 'select',
      options: [
        { value: '', label: 'Semua Entitas' },
        { value: 'STORE', label: 'Toko' },
        { value: 'USER', label: 'Pengguna' },
        { value: 'PRODUCT', label: 'Produk' },
        { value: 'SALE', label: 'Penjualan' },
        { value: 'EXPENSE', label: 'Pengeluaran' }
      ]
    },
    {
      key: 'dateFrom',
      label: 'Tanggal Awal',
      type: 'date'
    },
    {
      key: 'dateTo',
      label: 'Tanggal Akhir',
      type: 'date'
    }
  ], []);

  if (state.loading && state.logs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Log Aktivitas</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Pantau semua aktivitas penting dalam sistem
            </p>
          </div>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Clock className="h-4 w-4 mr-1" />
          <span>Menampilkan {state.logs.length} dari {state.totalItems} log aktivitas</span>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        data={state.logs}
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
        actions={false}
        darkMode={userTheme.darkMode}
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
      />
    </div>
  );
}