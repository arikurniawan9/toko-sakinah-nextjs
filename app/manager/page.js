'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ROLES } from '@/lib/constants';
import StoreDetailEditModal from '@/components/admin/StoreDetailEditModal';
import CreateStoreModal from '@/components/admin/CreateStoreModal'; // Import CreateStoreModal
import Tooltip from '@/components/Tooltip'; // Import Tooltip
import DataTable from '@/components/DataTable'; // Import DataTable
import { Edit, Eye, Plus } from 'lucide-react';
import { useDarkMode } from '@/components/DarkModeContext';
import LoadingSpinner from '@/components/LoadingSpinner'; // Import LoadingSpinner

export default function ManagerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false); // For edit/detail modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // For create store modal
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const { darkMode } = useDarkMode(); // Get dark mode state

  // States for DataTable
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }
    
    fetchStores();
  }, [status, session, router, searchTerm, currentPage, itemsPerPage, sortConfig]); // Add dependencies

  const fetchStores = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction,
      }).toString();
      const response = await fetch(`/api/stores?${query}`);
      const data = await response.json();
      setStores(data.stores || []);
      setTotalItems(data.totalItems || 0); // Assuming API returns totalItems
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stores:', error);
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page on items per page change
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSort = (config) => {
    setSortConfig(config);
  };

  const columns = [
    { 
      key: 'number', 
      title: 'No', 
      render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1 
    },
    { key: 'name', title: 'Nama Toko', sortable: true },
    { key: 'address', title: 'Alamat' },
    { key: 'status', title: 'Status', sortable: true, render: (status) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
          ${status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {status}
        </span>
      )
    },
  ];

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const pagination = {
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    onPageChange: handlePageChange,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, totalItems),
  };

  // Log store data length for debugging purposes
  console.log("Stores data length:", stores.length);


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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Manager</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Selamat datang, {session.user.name}</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Toko</h3>
          <p className="text-3xl font-bold text-blue-600">{stores.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Toko Aktif</h3>
          <p className="text-3xl font-bold text-green-600">
            {stores.filter(store => store.status === 'ACTIVE').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Gudang</h3>
          <p className="text-3xl font-bold text-purple-600">1</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Manager</h3>
          <p className="text-3xl font-bold text-indigo-600">1</p>
        </div>
      </div>

      {/* Store Management Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Manajemen Toko</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Kelola toko yang ada atau buat toko baru</p>
        </div>
        
        <div className="p-6">
          <DataTable
            data={stores}
            columns={columns}
            loading={loading}
            pagination={pagination}
            onSearch={handleSearch}
            onItemsPerPageChange={handleItemsPerPageChange}
            onSort={handleSort}
            currentSort={sortConfig}
            showAdd={true}
            onAdd={() => setIsCreateModalOpen(true)}
            showExport={false}
            actions={true}
            darkMode={darkMode}
            mobileColumns={['name', 'status']}
            rowActions={(row) => (
              <div className="flex justify-end space-x-1">
                <Tooltip content="Lihat Detail Toko">
                  <button
                    onClick={() => {
                      setSelectedStoreId(row.id);
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label="Lihat Detail"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </Tooltip>
                <Tooltip content="Edit Toko">
                  <button
                    onClick={() => {
                      setSelectedStoreId(row.id);
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-indigo-600 hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
                    aria-label="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </Tooltip>
              </div>
            )}
          />
        </div>
      </div>

      {/* Other Manager Functions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monitor All Stores */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Monitor Semua Toko</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Lihat ringkasan aktivitas dari semua toko</p>
          <button
            onClick={() => router.push('/manager/monitor-all')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition duration-200"
          >
            Lihat Monitor
          </button>
        </div>
        
        {/* Warehouse Overview */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Gudang Pusat</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Kelola dan pantau gudang pusat</p>
          <button
            onClick={() => router.push('/warehouse')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition duration-200"
          >
            Akses Gudang
          </button>
        </div>
      </div>
      {/* Store Detail/Edit Modal */}
      <StoreDetailEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        storeId={selectedStoreId}
        onStoreUpdated={fetchStores} // Pass fetchStores to refresh data after update
      />
      {/* Create Store Modal */}
      <CreateStoreModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onStoreCreated={fetchStores} // Refresh store list after creation
      />
    </main>
  );
}

  