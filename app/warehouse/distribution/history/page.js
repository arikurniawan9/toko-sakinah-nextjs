'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useUserTheme } from '../../../../components/UserThemeContext';
import { useSession } from 'next-auth/react';
import Breadcrumb from '../../../../components/Breadcrumb';
import { Package, Search, Calendar, Printer, Eye, X, AlertTriangle, CheckCircle } from 'lucide-react';
import DataTable from '../../../../components/DataTable';
import ConfirmationModal from '../../../../components/ConfirmationModal';
import DistributionReceiptModal from '../../../../components/warehouse/DistributionReceiptModal';
import DistributionDetailModal from '../../../../components/warehouse/DistributionDetailModal';

export default function WarehouseDistributionHistoryPage() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState(null);

  // Fetch warehouse distributions
  useEffect(() => {
    fetchWarehouseDistributions();
  }, [currentPage, itemsPerPage, searchTerm, startDate, endDate]);

  const fetchWarehouseDistributions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (startDate) {
        params.append('startDate', startDate);
      }

      if (endDate) {
        params.append('endDate', endDate);
      }

      // Use the grouped API to get distributions grouped by date, store, and distributor
      const response = await fetch(`/api/warehouse/distribution/grouped?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch warehouse distributions');
      }

      setDistributions(data.distributions || []);
      setPagination(data.pagination || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = async (distributionId) => {
    try {
      // Fetch the specific distribution record to get reference information
      const response = await fetch(`/api/warehouse/distribution?id=${distributionId}`);
      const distributionRecord = await response.json();

      if (response.ok) {
        // The API will return the distribution with all related items
        // The structure is already handled correctly in the API
        setSelectedDistribution(distributionRecord);
        setShowReceiptModal(true);
      } else {
        throw new Error('Gagal mengambil data distribusi untuk struk');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleViewDetails = async (distributionId) => {
    try {
      // Fetch the specific distribution record to get all details
      const response = await fetch(`/api/warehouse/distribution?id=${distributionId}`);
      const distributionRecord = await response.json();

      if (response.ok) {
        setSelectedDistribution(distributionRecord);
        setShowDetailModal(true);
      } else {
        throw new Error('Gagal mengambil data distribusi untuk detail');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const columns = [
    {
      key: 'no',
      title: 'No.',
      render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: 'id',
      title: 'No. Invoice',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium">{row.invoiceNumber || value}</div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            ID: {value}
          </div>
        </div>
      )
    },
    {
      key: 'store.name',
      title: 'Toko Tujuan',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {row.store?.code || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'distributedAt',
      title: 'Tanggal',
      render: (value) => new Date(value).toLocaleDateString('id-ID'),
      sortable: true
    },
    {
      key: 'items',
      title: 'Jumlah Barang',
      render: (value, row) => {
        // For grouped distributions, the totalItems is already calculated
        // If it's not available, calculate from items array
        const totalItems = row.totalItems || (value?.reduce((sum, item) => sum + item.quantity, 0) || 0);
        return totalItems.toLocaleString('id-ID');
      }
    },
    {
      key: 'items',
      title: 'Total Harga',
      render: (value, row) => {
        // For grouped distributions, the totalAmount is already calculated
        // If it's not available, calculate from items array
        const totalAmount = row.totalAmount || (value?.reduce((sum, item) => sum + item.totalAmount, 0) || 0);
        return `Rp ${totalAmount.toLocaleString('id-ID')}`;
      }
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => {
        let statusColor = 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300';
        let statusText = value;

        if (value === 'PENDING_ACCEPTANCE') {
          statusColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
          statusText = 'Menunggu Konfirmasi';
        } else if (value === 'ACCEPTED') {
          statusColor = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
          statusText = 'Diterima';
        } else if (value === 'REJECTED') {
          statusColor = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
          statusText = 'Ditolak';
        }

        return (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
            {statusText}
          </span>
        );
      }
    },
  ];

  const renderRowActions = (row) => (
    <div className="flex space-x-2">
      <button
        onClick={() => handleViewDetails(row.id)}
        className="p-2 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30"
        title="Lihat Detail"
      >
        <Eye size={20} />
      </button>
      <button
        onClick={() => handlePrintReceipt(row.id)}
        className="p-2 text-green-500 hover:text-green-700 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30"
        title="Cetak Faktur"
      >
        <Printer size={20} />
      </button>
    </div>
  );

  const paginationData = {
    currentPage: pagination.currentPage || 1,
    totalPages: pagination.totalPages || 1,
    totalItems: pagination.total || 0,
    startIndex: pagination.startIndex || 1,
    endIndex: pagination.endIndex || 0,
    onPageChange: setCurrentPage,
    itemsPerPage: itemsPerPage
  };

  const statusCardData = [
    {
      title: "Total Distribusi",
      value: pagination.total || distributions.length || 0,
      icon: Package,
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Menunggu Konfirmasi",
      value: distributions.filter(d => d.status === 'PENDING_ACCEPTANCE').length,
      icon: AlertTriangle,
      color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
    },
    {
      title: "Diterima",
      value: distributions.filter(d => d.status === 'ACCEPTED').length,
      icon: CheckCircle,
      color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    },
  ];

  // Filter form
  const FilterForm = () => (
    <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Tanggal Awal
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Tanggal Akhir
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={fetchWarehouseDistributions}
            className={`w-full px-4 py-2 rounded-lg ${
              darkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            Terapkan Filter
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute requiredRole="WAREHOUSE">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { title: 'Dashboard Gudang', href: '/warehouse' },
            { title: 'Distribusi ke Toko', href: '/warehouse/distribution' },
            { title: 'Riwayat Distribusi', href: '/warehouse/distribution/history' }
          ]}
          darkMode={darkMode}
        />

        <div className="mb-6">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Riwayat Distribusi Gudang
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Lihat dan cetak faktur distribusi ke toko-toko
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statusCardData.map((card, index) => (
            <div
              key={index}
              className={`rounded-xl shadow-lg p-6 flex items-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className={`p-3 rounded-full ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {card.title}
                </p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {card.value.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Form */}
        <div className="mb-6">
          <FilterForm />
        </div>

        {/* Data Table */}
        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <DataTable
            data={distributions}
            columns={columns}
            loading={loading}
            onSearch={setSearchTerm}
            onItemsPerPageChange={setItemsPerPage}
            darkMode={darkMode}
            pagination={paginationData}
            mobileColumns={['id', 'store.name', 'distributedAt', 'status']}
            rowActions={renderRowActions}
            emptyMessage="Tidak ada riwayat distribusi ditemukan"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceiptModal && selectedDistribution && (
          <DistributionReceiptModal
            distributionData={selectedDistribution}
            isOpen={showReceiptModal}
            onClose={() => setShowReceiptModal(false)}
          />
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedDistribution && (
          <DistributionDetailModal
            distribution={selectedDistribution}
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
          />
        )}
      </main>
    </ProtectedRoute>
  );
}