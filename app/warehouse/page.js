'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { subDays } from 'date-fns';

import ProtectedRoute from '../../components/ProtectedRoute';
import { useUserTheme } from '../../components/UserThemeContext';
import Breadcrumb from '../../components/Breadcrumb';
import StatCard from '../../components/warehouse/StatCard';
import { formatNumber } from '../../lib/utils';
import { useWarehouseStats, useRecentDistributions } from '../../lib/hooks/useWarehouseData';
import {
  Package,
  Users,
  Move3D,
  CalendarIcon,
  Clock,
} from 'lucide-react';


export default function WarehouseDashboard() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  const [startDate, setStartDate] = useState(subDays(new Date(), 6));
  const [endDate, setEndDate] = useState(new Date());
  const [dateError, setDateError] = useState('');

  // SWR hooks for data fetching
  const { stats, isLoading: isLoadingStats, isError: isErrorStats } = useWarehouseStats();
  const { distributions, isLoading: isLoadingDists, isError: isErrorDists } = useRecentDistributions(startDate, endDate);

  const isLoading = isLoadingStats || isLoadingDists;

  // Validate date range
  useEffect(() => {
    if (startDate && endDate && startDate > endDate) {
      setDateError('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
    } else {
      setDateError('');
    }
  }, [startDate, endDate]);

  const breadcrumbItems = [{ title: 'Dashboard Gudang', href: '/warehouse' }];

  const renderLoadingSkeleton = () => (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={breadcrumbItems} darkMode={darkMode} />
      <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Memuat Data Dasbor Gudang...</h2>
      {/* Skeleton for stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`p-6 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </main>
  );

  if (isLoading && !stats) {
    return (
      <ProtectedRoute requiredRole="WAREHOUSE">
        {renderLoadingSkeleton()}
      </ProtectedRoute>
    );
  }

  if (isErrorStats || isErrorDists) {
    return (
      <ProtectedRoute requiredRole="WAREHOUSE">
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb items={breadcrumbItems} darkMode={darkMode} />
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
            <p className="font-bold">Gagal memuat data</p>
            <p>Terjadi kesalahan saat mengambil data dasbor. Silakan coba lagi nanti.</p>
          </div>
        </main>
      </ProtectedRoute>
    )
  }
  
  return (
    <ProtectedRoute requiredRole="WAREHOUSE">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} darkMode={darkMode} />

        {/* Header and Date Picker */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Dasbor Gudang
          </h2>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-4 sm:mt-0">
            <div className="flex items-center">
              <CalendarIcon className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                className={`p-2 rounded-md border w-32 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                dateFormat="dd/MM/yyyy"
              />
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>-</span>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                className={`p-2 rounded-md border w-32 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                dateFormat="dd/MM/yyyy"
              />
            </div>
          </div>
        </div>

        {/* Date Error Message */}
        {dateError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {dateError}
          </div>
        )}

        {/* System Summary */}
        <div className="mb-8">
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Ringkasan Sistem Gudang</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard 
              title="Total Produk Unik" 
              value={stats?.totalUniqueProductsInWarehouse} 
              icon={Package} 
              darkMode={darkMode} 
              href="/warehouse/products"
              loading={isLoading} 
            />
            <StatCard 
              title="Toko Terhubung" 
              value={stats?.totalStoresLinked} 
              icon={Users} 
              darkMode={darkMode} 
              href="/warehouse/stores"
              loading={isLoading} 
            />
            <StatCard
              title="Distribusi Tertunda"
              value={stats?.pendingDistributions}
              icon={Clock}
              darkMode={darkMode}
              href="/warehouse/distribution/pending"
              loading={isLoading}
              warning={stats?.pendingDistributions > 0}
            />
            <StatCard 
              title="Total Didistribusi" 
              value={stats?.totalDistributed} 
              icon={Move3D} 
              darkMode={darkMode} 
              href="/warehouse/distribution/history"
              loading={isLoading} 
            />
          </div>
        </div>

        {/* Recent Distributions */}
        <div className={`rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Distribusi Terbaru
              </h2>
              <a
                href="/warehouse/distribution/history"
                className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
              >
                Lihat Semua →
              </a>
            </div>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 animate-pulse">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                    <div className="w-16 h-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    <div className="w-16 h-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    <div className="w-20 h-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : distributions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Produk
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Toko Tujuan
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Jumlah
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Status
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Tanggal
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {distributions.map((distribution) => (
                      <tr key={distribution.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className={`px-4 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {distribution.product?.name || 'N/A'}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {distribution.store?.name || 'N/A'}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                          {distribution.quantity?.toLocaleString('id-ID') || 0}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm`}>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            distribution.status === 'DELIVERED' || distribution.status === 'ACCEPTED'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : distribution.status === 'PENDING_ACCEPTANCE'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : distribution.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                          }`}>
                            {distribution.status === 'PENDING_ACCEPTANCE' ? 'Menunggu Konfirmasi' :
                             distribution.status === 'ACCEPTED' ? 'Diterima' :
                             distribution.status === 'REJECTED' ? 'Ditolak' :
                             distribution.status}
                          </span>
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(distribution.distributedAt).toLocaleDateString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                Tidak ada distribusi terbaru
              </div>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}