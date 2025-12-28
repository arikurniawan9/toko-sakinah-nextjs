'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserTheme } from '@/components/UserThemeContext';
import Breadcrumb from '@/components/Breadcrumb';
import { User, Package, Calendar, Store, AlertTriangle, CheckCircle, Tag, TrendingUp, Eye } from 'lucide-react';
import DataTable from '@/components/DataTable';
import DistributionDetailModal from '@/components/warehouse/DistributionDetailModal';

const UserDetailPage = () => {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const { data: session } = useSession();
  const params = useParams();
  const { id: userId } = params;

  const [user, setUser] = useState(null);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const userResponse = await fetch(`/api/users/${userId}`);
        if (!userResponse.ok) {
          throw new Error('Gagal memuat data user.');
        }
        const userData = await userResponse.json();
        setUser(userData.user);

        if (userData.user?.role === 'ATTENDANT') {
          const distResponse = await fetch(`/api/warehouse/users/${userId}/distributions`);
          if (!distResponse.ok) {
            throw new Error('Gagal memuat riwayat distribusi.');
          }
          const distData = await distResponse.json();
          setDistributions(distData.distributions || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);
  
  const handleViewDetails = (distribution) => {
    setSelectedDistribution(distribution);
    setShowDetailModal(true);
  };

    const summaryStats = user?.role === 'ATTENDANT' ? [
      {
        title: "Total Faktur",
        value: distributions.length,
        icon: Package,
      },
      {
        title: "Total Barang Terkirim",
        value: distributions.reduce((sum, group) => sum + group.totalItems, 0).toLocaleString('id-ID'),
        icon: TrendingUp,
      },
      {
        title: "Total Nilai Distribusi",
        value: `Rp ${distributions.reduce((sum, group) => sum + group.totalAmount, 0).toLocaleString('id-ID')}`,
        icon: Tag,
      }
    ] : [];
  
    const distributionColumns = [
      { 
        key: 'no', 
        title: 'No.', 
        render: (_, __, index) => index + 1 
      },
      {
        key: 'invoiceNumber',
        title: 'No. Faktur',
        render: (value, row) => value || row.id || 'N/A', // Display invoiceNumber, fallback to ID, or 'N/A' if both are null/empty
        sortable: true,
      },
      { 
        key: 'distributedAt', 
        title: 'Tanggal', 
        render: (value) => new Date(value).toLocaleDateString('id-ID'), 
        sortable: true 
      },
      { 
        key: 'store', 
        title: 'Toko Tujuan', 
        render: (value, row) => row.store?.name || 'N/A',
        sortable: true 
      },
      { 
        key: 'items', 
        title: 'Total Barang', 
        render: (value, row) => (row.totalItems || 0).toLocaleString('id-ID'), 
        sortable: true 
      },
      { 
        key: 'items', 
        title: 'Total Nilai', 
        render: (value, row) => `Rp ${(row.totalAmount || 0).toLocaleString('id-ID')}`, 
        sortable: true 
      },
      {
        key: 'status',
        title: 'Status',
        render: (value) => {
          const isAccepted = value === 'ACCEPTED';
          return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isAccepted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {isAccepted ? 'Diterima' : 'Menunggu'}
            </span>
          );
        }
      },
      {
        key: 'actions',
        title: 'Aksi',
        render: (_, row) => (
          <button
            onClick={() => handleViewDetails(row)}
            className="p-1 text-blue-500 hover:text-blue-700"
            title="Lihat Detail Faktur"
          >
            <Eye size={18} />
          </button>
        )
      }
    ];
  if (loading) {
    return (
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Memuat data detail user...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 text-center">
         <div className="p-4 rounded-lg bg-red-100 border border-red-400 text-red-700">
            <div className="flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
      </main>
    );
  }

  return (
    <ProtectedRoute requiredRole={['WAREHOUSE', 'MANAGER']}>
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { title: 'Dashboard Gudang', href: '/warehouse' },
            { title: 'Manajemen User', href: '/warehouse/users' },
            { title: 'Detail User', href: `/warehouse/users/${userId}` },
          ]}
          darkMode={darkMode}
        />

        {/* User Info Header */}
        <div className={`p-6 rounded-xl shadow-lg mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${darkMode ? 'bg-cyan-900/50' : 'bg-cyan-100'}`}>
              <User className={`h-8 w-8 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user?.name}</h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user?.username} - {user?.role === 'ATTENDANT' ? 'Pelayan Gudang' : user?.role}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <p><strong>Kode Karyawan:</strong> {user?.employeeNumber || '-'}</p>
            <p><strong>No. Telepon:</strong> {user?.phone || '-'}</p>
            <p><strong>Status:</strong> {user?.status}</p>
            <p><strong>Tanggal Bergabung:</strong> {new Date(user?.createdAt).toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        {/* Distribution Summary for Attendants */}
        {user?.role === 'ATTENDANT' && (
          <>
            <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Ringkasan Aktivitas Distribusi</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {summaryStats.map((stat, index) => (
                <div key={index} className={`p-5 rounded-xl shadow-md flex items-center space-x-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className={`p-3 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <stat.icon className={`h-6 w-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                    <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.title}</p>
                        <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                    </div>
                </div>
              ))}
            </div>

            <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Riwayat Distribusi</h2>
             <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                <DataTable
                  data={distributions}
                  columns={distributionColumns}
                  loading={loading}
                  darkMode={darkMode}
                  emptyMessage="Tidak ada riwayat distribusi untuk pelayan ini."
                />
            </div>
          </>
        )}
      </main>
      
      {showDetailModal && (
        <DistributionDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          distribution={selectedDistribution}
        />
      )}
    </ProtectedRoute>
  );
};

export default UserDetailPage;
