'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useReducer, useCallback, useMemo, lazy, Suspense, useRef, useState } from 'react';
import { ROLES } from '@/lib/constants';
import { 
  Plus, 
  Settings, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Package, 
  Store, 
  TrendingUp, 
  AlertTriangle,
  CreditCard,
  FileText,
  Activity
} from 'lucide-react';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import SalesChart from '@/components/charts/SalesChart';
import { useDashboardCustomization } from '@/components/DashboardCustomizationContext';
import { useNotification } from '@/components/notifications/NotificationProvider';

// Lazy load modal components
const StoreDetailEditModal = lazy(() => import('@/components/admin/StoreDetailEditModal'));
const CreateStoreModal = lazy(() => import('@/components/admin/CreateStoreModal'));
const DashboardCustomizationModal = lazy(() => import('@/components/DashboardCustomizationModal'));

// Initial state for the reducer
const initialState = {
  stores: [],
  loading: true,
  isModalOpen: false,
  isCreateModalOpen: false,
  selectedStoreId: null,
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: 10,
  sortConfig: { key: 'createdAt', direction: 'desc' },
  totalItems: 0,
  dashboardStats: {
    totalStores: 0,
    activeStores: 0,
    totalSales: 0,
    totalRevenue: 0
  },
  recentActivity: [],
  lowStockProducts: []
};

// Reducer function to handle state updates
function managerReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_STORES':
      return { ...state, stores: action.payload };
    case 'SET_TOTAL_ITEMS':
      return { ...state, totalItems: action.payload };
    case 'SET_MODAL_OPEN':
      return { ...state, isModalOpen: action.payload.isOpen, selectedStoreId: action.payload.storeId || null };
    case 'SET_CREATE_MODAL_OPEN':
      return { ...state, isCreateModalOpen: action.payload };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload, currentPage: 1 };
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_ITEMS_PER_PAGE':
      return { ...state, itemsPerPage: action.payload, currentPage: 1 };
    case 'SET_SORT_CONFIG':
      return { ...state, sortConfig: action.payload };
    case 'SET_DASHBOARD_STATS':
      return { ...state, dashboardStats: action.payload };
    case 'SET_RECENT_ACTIVITY':
      return { ...state, recentActivity: action.payload };
    case 'SET_LOW_STOCK_PRODUCTS':
      return { ...state, lowStockProducts: action.payload };
    default:
      return state;
  }
}

export default function ManagerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [state, dispatch] = useReducer(managerReducer, initialState);
  const { userTheme } = useUserTheme();
  const [isMounted, setIsMounted] = useState(false);

  // Create refs to keep track of the latest state values
  const stateRef = useRef(state);

  // Initialize isMounted and update stateRef
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Hooks yang sebelumnya ada setelah kondisi early return
  const { dashboardLayout, updateWidgetVisibility } = useDashboardCustomization();
  const { showNotification } = useNotification();
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);

  // Memoized fetch functions that use ref to get current state values
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/manager-summary');

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
      if (response.ok) {
        dispatch({ type: 'SET_DASHBOARD_STATS', payload: data.stats || {} });
        dispatch({ type: 'SET_RECENT_ACTIVITY', payload: data.recentActivity || [] });
        dispatch({ type: 'SET_LOW_STOCK_PRODUCTS', payload: data.lowStockProducts || [] });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.message.includes('401') || error.message.includes('403')) {
        router.push('/login');
      }
    }
  }, [router]);

  const fetchStores = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const currentState = stateRef.current;
      const query = new URLSearchParams({
        page: currentState.currentPage,
        limit: currentState.itemsPerPage,
        search: currentState.searchTerm,
        sortKey: currentState.sortConfig.key,
        sortDirection: currentState.sortConfig.direction,
      }).toString();
      const response = await fetch(`/api/stores?${query}`);

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
      dispatch({ type: 'SET_STORES', payload: data.stores || [] });
      dispatch({ type: 'SET_TOTAL_ITEMS', payload: data.totalItems || 0 });
    } catch (error) {
      console.error('Error fetching stores:', error);
      if (error.message.includes('401') || error.message.includes('403')) {
        router.push('/login');
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [router]);

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

  // Effect to fetch data when search, pagination, or sort parameters change
  useEffect(() => {
    fetchStores();
  }, [state.searchTerm, state.currentPage, state.itemsPerPage, state.sortConfig, fetchStores]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Memoized statistics calculations
  const stats = useMemo(() => state.dashboardStats, [state.dashboardStats]);

  // Memoized status renderer component
  const StatusRenderer = useCallback((status) => (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
      ${status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
      {status}
    </span>
  ), []);

  // Memoized columns
  const columns = useMemo(() => [
    {
      key: 'number',
      title: 'No',
      render: (_, __, index) => (state.currentPage - 1) * state.itemsPerPage + index + 1
    },
    { key: 'name', title: 'Nama Toko', sortable: true },
    { key: 'address', title: 'Alamat' },
    { key: 'status', title: 'Status', sortable: true, render: StatusRenderer },
    {
      key: 'actions',
      title: 'Aksi',
      render: (store) => (
        <div className="flex space-x-2">
          <button
            onClick={() => dispatch({ type: 'SET_MODAL_OPEN', payload: { isOpen: true, storeId: store.id } })}
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Edit
          </button>
        </div>
      )
    },
  ], [state.currentPage, state.itemsPerPage, StatusRenderer, router]);

  // Memoized pagination data
  const pagination = useMemo(() => {
    const totalPages = Math.ceil(state.totalItems / state.itemsPerPage);

    return {
      currentPage: state.currentPage,
      totalPages,
      itemsPerPage: state.itemsPerPage,
      totalItems: state.totalItems,
      onPageChange: handlePageChange,
      startIndex: (state.currentPage - 1) * state.itemsPerPage + 1,
      endIndex: Math.min(state.currentPage * state.itemsPerPage, state.totalItems),
    };
  }, [state.currentPage, state.itemsPerPage, state.totalItems, handlePageChange]);

  // Initial data fetch when component mounts and user is authenticated
  useEffect(() => {
    if (status === 'loading' || !isMounted) return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }

    fetchStores();
    fetchDashboardData();
  }, [status, session, router, fetchStores, fetchDashboardData, isMounted]);

  // Hydration-safe loading and authentication checks
  if (status === 'loading' || !isMounted) {
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

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Contoh data untuk grafik penjualan
  const salesData = [
    { name: 'Sen', sales: 4000 },
    { name: 'Sel', sales: 3000 },
    { name: 'Rab', sales: 2000 },
    { name: 'Kam', sales: 2780 },
    { name: 'Jum', sales: 1890 },
    { name: 'Sab', sales: 2390 },
    { name: 'Min', sales: 3490 },
  ];

  // Fungsi untuk membuka modal customisasi
  const openCustomizationModal = () => {
    setShowCustomizationModal(true);
  };

  // Fungsi untuk menutup modal customisasi
  const closeCustomizationModal = () => {
    setShowCustomizationModal(false);
  };

  // Menu items untuk akses cepat manager
  const quickMenuItems = [
    {
      title: "Monitor Semua Toko",
      description: "Lihat ringkasan aktivitas dari semua toko",
      href: "/manager/monitor-all",
      icon: Activity,
      color: "bg-green-100 text-green-600",
      darkModeColor: "bg-green-900/30 text-green-400",
    },
    {
      title: "Gudang Pusat",
      description: "Kelola dan pantau gudang pusat",
      href: "/warehouse",
      icon: Package,
      color: "bg-purple-100 text-purple-600",
      darkModeColor: "bg-purple-900/30 text-purple-400",
    },
    {
      title: "Laporan Gabungan",
      description: "Lihat laporan gabungan dari semua toko",
      href: "/manager/reports",
      icon: FileText,
      color: "bg-yellow-100 text-yellow-600",
      darkModeColor: "bg-yellow-900/30 text-yellow-400",
    },
    {
      title: "Manajemen Pengguna",
      description: "Kelola pengguna dari semua toko",
      href: "/manager/users",
      icon: Users,
      color: "bg-indigo-100 text-indigo-600",
      darkModeColor: "bg-indigo-900/30 text-indigo-400",
    },
    {
      title: "Distribusi ke Toko",
      description: "Distribusikan produk dari gudang ke toko",
      href: "/warehouse/distribution",
      icon: TrendingUp,
      color: "bg-red-100 text-red-600",
      darkModeColor: "bg-red-900/30 text-red-400",
    }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <main className={`max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 ${userTheme.darkMode ? 'dark' : ''}`}>
      {/* Page Title */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Manager</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Selamat datang, {session.user.name}</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          {/* Tombol customisasi dashboard */}
          <button
            onClick={openCustomizationModal}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition duration-200 flex items-center dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
            title="Customisasi Dashboard"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Dashboard Widgets berdasarkan konfigurasi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Stats Overview Widget */}
        {dashboardLayout.find(w => w.id === 'stats' && w.visible) && (
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Store className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Toko</h3>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalStores || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Toko Aktif</h3>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.activeStores || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <ShoppingCart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Transaksi</h3>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalSales || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                    <CreditCard className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Pendapatan</h3>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(stats.totalRevenue || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales Chart Widget */}
        {dashboardLayout.find(w => w.id === 'sales-chart' && w.visible) && (
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ringkasan Penjualan (7 Hari Terakhir)</h3>
              <button
                onClick={() => updateWidgetVisibility('sales-chart', false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            <SalesChart data={salesData} />
          </div>
        )}
      </div>

      {/* Quick Access Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {quickMenuItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div
              key={index}
              className={`rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border ${
                userTheme.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } overflow-hidden group cursor-pointer`}
              onClick={() => router.push(item.href)}
            >
              <div className="p-6 text-center">
                <div className={`${userTheme.darkMode ? item.darkModeColor : item.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <IconComponent size={32} />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${userTheme.darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                <p className={`${userTheme.darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>{item.description}</p>
                <div className={`flex items-center justify-center font-medium ${userTheme.darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  <span>Lanjutkan</span>
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity and Low Stock Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Activity Widget */}
        {dashboardLayout.find(w => w.id === 'recent-activity' && w.visible) && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aktivitas Terbaru</h3>
              <button
                onClick={() => updateWidgetVisibility('recent-activity', false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            {state.recentActivity.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {state.recentActivity.slice(0, 5).map((activity, index) => (
                  <li key={index} className="py-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          activity.type === 'SALE' ? 'bg-green-100 dark:bg-green-800' : 
                          activity.type === 'STOCK' ? 'bg-yellow-100 dark:bg-yellow-800' : 
                          'bg-blue-100 dark:bg-blue-800'
                        }`}>
                          {activity.type === 'SALE' ? (
                            <ShoppingCart className={`h-4 w-4 ${
                              activity.type === 'SALE' ? 'text-green-800 dark:text-green-100' : 
                              activity.type === 'STOCK' ? 'text-yellow-800 dark:text-yellow-100' : 
                              'text-blue-800 dark:text-blue-100'
                            }`} />
                          ) : activity.type === 'STOCK' ? (
                            <Package className={`h-4 w-4 ${
                              activity.type === 'SALE' ? 'text-green-800 dark:text-green-100' : 
                              activity.type === 'STOCK' ? 'text-yellow-800 dark:text-yellow-100' : 
                              'text-blue-800 dark:text-blue-100'
                            }`} />
                          ) : (
                            <Activity className={`h-4 w-4 ${
                              activity.type === 'SALE' ? 'text-green-800 dark:text-green-100' : 
                              activity.type === 'STOCK' ? 'text-yellow-800 dark:text-yellow-100' : 
                              'text-blue-800 dark:text-blue-100'
                            }`} />
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.storeName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
                      </div>
                      <div className="ml-auto">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Tidak ada aktivitas terbaru</p>
            )}
          </div>
        )}

        {/* Low Stock Products Widget */}
        {dashboardLayout.find(w => w.id === 'low-stock' && w.visible) && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Produk Stok Rendah</h3>
              <button
                onClick={() => updateWidgetVisibility('low-stock', false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            {state.lowStockProducts.length > 0 ? (
              <ul className="space-y-3">
                {state.lowStockProducts.map(product => (
                  <li key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                      <span className={`${userTheme.darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{product.name}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-semibold ${userTheme.darkMode ? 'text-red-400' : 'text-red-600'}`}>Stok: {product.stock}</span>
                      <p className="text-xs text-gray-500">Toko: {product.storeName}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Tidak ada produk dengan stok menipis.</p>
            )}
          </div>
        )}
      </div>

      {/* Recent Stores Widget */}
      {dashboardLayout.find(w => w.id === 'recent-stores' && w.visible) && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Toko Terbaru</h3>
            <button
              onClick={() => updateWidgetVisibility('recent-stores', false)}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
          {state.stores.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {state.stores.slice(0, 5).map((store) => (
                <li key={store.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{store.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{store.address}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${store.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
                        {store.status}
                      </span>
                      <button 
                        onClick={() => dispatch({ type: 'SET_MODAL_OPEN', payload: { isOpen: true, storeId: store.id } })}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">Tidak ada toko</p>
          )}
        </div>
      )}

      {/* Store Detail/Edit Modal */}
      {state.isModalOpen && (
        <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <LoadingSpinner />
        </div>}>
          <StoreDetailEditModal
            isOpen={state.isModalOpen}
            onClose={() => dispatch({ type: 'SET_MODAL_OPEN', payload: { isOpen: false } })}
            storeId={state.selectedStoreId}
            onStoreUpdated={fetchStores} // Pass fetchStores to refresh data after update
          />
        </Suspense>
      )}
      
      {/* Create Store Modal */}
      {state.isCreateModalOpen && (
        <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <LoadingSpinner />
        </div>}>
          <CreateStoreModal
            isOpen={state.isCreateModalOpen}
            onClose={() => dispatch({ type: 'SET_CREATE_MODAL_OPEN', payload: false })}
            onStoreCreated={fetchStores} // Refresh store list after creation
          />
        </Suspense>
      )}

      {/* Dashboard Customization Modal */}
      <Suspense fallback={<div></div>}>
        <DashboardCustomizationModal
          isOpen={showCustomizationModal}
          onClose={closeCustomizationModal}
        />
      </Suspense>
    </main>
  );
}