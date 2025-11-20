'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ROLES } from '@/lib/constants';
import DataTable from '@/components/DataTable'; // Import DataTable
import Tooltip from '@/components/Tooltip'; // Import Tooltip
import { Edit, Eye } from 'lucide-react'; // Import icons for row actions
import { useDarkMode } from '@/components/DarkModeContext'; // Import useDarkMode
import LoadingSpinner from '@/components/LoadingSpinner'; // Import LoadingSpinner

export default function MonitorAllPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [warehouseData, setWarehouseData] = useState({
    totalStock: 0,
    lowStockItems: 0,
    pendingDistributions: 0,
    totalDistributed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentDistributions, setRecentDistributions] = useState([]);
  const { darkMode } = useDarkMode(); // Get dark mode state

  // States for Stores Overview DataTable
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  const [storeCurrentPage, setStoreCurrentPage] = useState(1);
  const [storeItemsPerPage, setStoreItemsPerPage] = useState(10);
  const [storeSortConfig, setStoreSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [totalStores, setTotalStores] = useState(0);

  // States for Recent Distributions DataTable (if needed)
  const [distSearchTerm, setDistSearchTerm] = useState('');
  const [distCurrentPage, setDistCurrentPage] = useState(1);
  const [distItemsPerPage, setDistItemsPerPage] = useState(10);
  const [distSortConfig, setDistSortConfig] = useState({ key: 'distributedAt', direction: 'desc' });
  const [totalDistributions, setTotalDistributions] = useState(0);

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }
    
    fetchMonitoringData();
  }, [status, session, router, storeSearchTerm, storeCurrentPage, storeItemsPerPage, storeSortConfig, distSearchTerm, distCurrentPage, distItemsPerPage, distSortConfig]);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);

      // Construct query for store summaries
      const storeQuery = new URLSearchParams({
        page: storeCurrentPage,
        limit: storeItemsPerPage,
        search: storeSearchTerm,
        sortKey: storeSortConfig.key,
        sortDirection: storeSortConfig.direction,
      }).toString();

      // Construct query for recent distributions
      const distQuery = new URLSearchParams({
        page: distCurrentPage,
        limit: distItemsPerPage,
        search: distSearchTerm,
        sortKey: distSortConfig.key,
        sortDirection: distSortConfig.direction,
      }).toString();

      const [storeSummaryRes, warehouseStatsRes, recentDistributionsRes] = await Promise.all([
        fetch(`/api/manager/stores/summary?${storeQuery}`),
        fetch('/api/warehouse/stats'), // Assuming this API doesn't need pagination/search for now
        fetch(`/api/manager/distributions/recent?${distQuery}`),
      ]);

      const storeSummaryData = await storeSummaryRes.json();
      const warehouseStatsData = await warehouseStatsRes.json();
      const recentDistributionsData = await recentDistributionsRes.json();


      if (storeSummaryRes.ok) {
        setStores(storeSummaryData.storeSummaries);
        setTotalStores(storeSummaryData.totalItems);
      } else {
        console.error('Failed to fetch store summaries:', storeSummaryData.error);
        setStores([]);
        setTotalStores(0);
      }

      if (warehouseStatsRes.ok) {
        setWarehouseData({
          totalStock: warehouseStatsData.totalQuantityInWarehouse,
          lowStockItems: warehouseStatsData.lowStockItems,
          pendingDistributions: warehouseStatsData.pendingDistributions,
          totalDistributed: warehouseStatsData.totalDistributed,
        });
      } else {
        console.error('Failed to fetch warehouse stats:', warehouseStatsData.error);
        setWarehouseData({
          totalStock: 0,
          lowStockItems: 0,
          pendingDistributions: 0,
          totalDistributed: 0,
        });
      }

      if (recentDistributionsRes.ok) {
        setRecentDistributions(recentDistributionsData.recentDistributions);
        setTotalDistributions(recentDistributionsData.totalItems);
      } else {
        console.error('Failed to fetch recent distributions:', recentDistributionsData.error);
        setRecentDistributions([]);
        setTotalDistributions(0);
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      setStores([]);
      setTotalStores(0);
      setWarehouseData({
        totalStock: 0,
        lowStockItems: 0,
        pendingDistributions: 0,
        totalDistributed: 0,
      });
      setRecentDistributions([]);
      setTotalDistributions(0);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Stores Overview DataTable
  const handleStoreSearch = (term) => {
    setStoreSearchTerm(term);
    setStoreCurrentPage(1);
  };

  const handleStoreItemsPerPageChange = (value) => {
    setStoreItemsPerPage(value);
    setStoreCurrentPage(1);
  };

  const handleStorePageChange = (page) => {
    setStoreCurrentPage(page);
  };

  const handleStoreSort = (config) => {
    setStoreSortConfig(config);
  };

  const storeColumns = [
    { key: 'name', title: 'Nama Toko', sortable: true },
    { key: 'status', title: 'Status', sortable: true, render: (status) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {status}
        </span>
      )
    },
    { key: 'totalSales', title: 'Penjualan', sortable: true, render: (sales) => `Rp ${sales.toLocaleString()}` },
    { key: 'totalTransactions', title: 'Transaksi', sortable: true },
    { key: 'activeEmployees', title: 'Karyawan', sortable: true },
    { key: 'lowStockProducts', title: 'Stok Rendah', sortable: true, render: (stock) => <span className="text-yellow-600 font-medium">{stock}</span> },
  ];

  const totalStorePages = Math.ceil(totalStores / storeItemsPerPage);
  const storePagination = {
    currentPage: storeCurrentPage,
    totalPages: totalStorePages,
    itemsPerPage: storeItemsPerPage,
    totalItems: totalStores,
    onPageChange: handleStorePageChange,
    startIndex: (storeCurrentPage - 1) * storeItemsPerPage + 1,
    endIndex: Math.min(storeCurrentPage * storeItemsPerPage, totalStores),
  };

  // Handlers for Recent Distributions DataTable
  const handleDistSearch = (term) => {
    setDistSearchTerm(term);
    setDistCurrentPage(1);
  };

  const handleDistItemsPerPageChange = (value) => {
    setDistItemsPerPage(value);
    setDistCurrentPage(1);
  };

  const handleDistPageChange = (page) => {
    setDistCurrentPage(page);
  };

  const handleDistSort = (config) => {
    setDistSortConfig(config);
  };

  const distColumns = [
    { key: 'distributedAt', title: 'Tanggal', sortable: true, render: (date) => new Date(date).toLocaleDateString() },
    { key: 'productName', title: 'Produk', sortable: true, render: (_, row) => `${row.product.name} (${row.product.productCode})` },
    { key: 'storeName', title: 'Toko Tujuan', sortable: true, render: (_, row) => row.store.name },
    { key: 'quantity', title: 'Jumlah', sortable: true },
    { key: 'distributedByUserName', title: 'Didistribusikan Oleh', sortable: true, render: (_, row) => row.distributedByUser.name },
    { key: 'status', title: 'Status', sortable: true, render: (status) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {status}
        </span>
      )
    },
  ];

  const totalDistPages = Math.ceil(totalDistributions / distItemsPerPage);
  const distPagination = {
    currentPage: distCurrentPage,
    totalPages: totalDistPages,
    itemsPerPage: distItemsPerPage,
    totalItems: totalDistributions,
    onPageChange: handleDistPageChange,
    startIndex: (distCurrentPage - 1) * distItemsPerPage + 1,
    endIndex: Math.min(distCurrentPage * distItemsPerPage, totalDistributions),
  };


  if (status === 'loading' || loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
    router.push('/unauthorized');
    return null;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Monitor Semua Toko</h1>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-300">Selamat datang,</p>
          <p className="font-medium text-gray-900 dark:text-white">{session.user.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Manager</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Jumlah Toko</h3>
          <p className="text-3xl font-bold text-blue-600">{stores.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Penjualan</h3>
          <p className="text-3xl font-bold text-green-600">
            Rp {(stores.reduce((sum, store) => sum + store.totalSales, 0)).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Produk Stok Rendah</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {stores.reduce((sum, store) => sum + store.lowStockProducts, 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Karyawan Aktif</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {stores.reduce((sum, store) => sum + store.activeEmployees, 0)}
          </p>
        </div>
      </div>

      {/* Warehouse Overview */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Gudang Pusat</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Status stok dan distribusi</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{warehouseData.totalStock}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Total Stok</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{warehouseData.lowStockItems}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Stok Rendah</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{warehouseData.pendingDistributions}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Distribusi Tertunda</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{warehouseData.totalDistributed}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Total Didistribusikan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Distributions */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Distribusi Gudang Terbaru</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Aliran produk dari gudang ke toko</p>
        </div>
        <div className="p-6">
          <DataTable
            data={recentDistributions}
            columns={distColumns}
            loading={loading} // Use general loading for now
            pagination={distPagination}
            onSearch={handleDistSearch}
            onItemsPerPageChange={handleDistItemsPerPageChange}
            onSort={handleDistSort}
            currentSort={distSortConfig}
            showAdd={false}
            showExport={false}
            actions={false} // No row actions for distributions table
            darkMode={darkMode}
            mobileColumns={['productName', 'storeName', 'quantity']}
          />
        </div>
      </div>

      {/* Stores Overview */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Ringkasan Toko</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Status dan kinerja masing-masing toko</p>
        </div>
        
        <div className="p-6">
          <DataTable
            data={stores}
            columns={storeColumns}
            loading={loading}
            pagination={storePagination}
            onSearch={handleStoreSearch}
            onItemsPerPageChange={handleStoreItemsPerPageChange}
            onSort={handleStoreSort}
            currentSort={storeSortConfig}
            showAdd={false}
            showExport={false}
            actions={true}
            darkMode={darkMode}
            mobileColumns={['name', 'status', 'totalSales']}
            rowActions={(row) => (
              <>
                <Tooltip content="Detail / Edit Toko">
                  <button 
                    onClick={() => router.push(`/manager/stores/${row.id}`)} // Still navigate to page for detail/edit
                    className="text-green-600 hover:text-green-900 mr-3 p-1 rounded-full hover:bg-green-100 flex items-center justify-center"
                  >
                    <Eye size={18} />
                  </button>
                </Tooltip>
                <Tooltip content="Akses Toko">
                  <button 
                    onClick={async () => {
                      // Trigger a signIn with updated credentials to change store context
                      // WARNING: Passing password directly from frontend is a security risk.
                      // In a production environment, implement a secure token exchange
                      // or a server-side session update mechanism.
                      const result = await signIn('credentials', {
                        redirect: false, // Prevent redirecting to sign-in page
                        username: session.user.username,
                        password: 'PASSWORD_PLACEHOLDER', // ! SECURITY RISK: Needs secure handling
                        selectedStoreId: row.id,
                        selectedStoreRole: ROLES.ADMIN, // Manager accesses store as ADMIN
                      });

                      if (result?.error) {
                        toast.error(`Gagal mengakses toko: ${result.error}`);
                      } else {
                        router.push('/admin'); // Redirect to admin dashboard of the selected store
                      }
                    }}
                    className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100 flex items-center justify-center"
                  >
                    <Edit size={18} /> {/* Using Edit icon for Access for now */}
                  </button>
                </Tooltip>
              </>
            )}
          />
        </div>
      </div>
    </main>
  );
}