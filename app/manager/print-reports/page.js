'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ROLES } from '@/lib/constants';
import { Printer, Store, FileText, ShoppingCart, TrendingUp, DollarSign, Package } from 'lucide-react';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function PrintReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userTheme } = useUserTheme();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedReport, setSelectedReport] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Fetch all stores
  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }

    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores');
        const data = await response.json();
        if (response.ok) {
          setStores(data.stores || []);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [status, session, router]);

  // Handle printing
  const handlePrint = async () => {
    if (!selectedStore || !selectedReport) {
      alert('Silakan pilih toko dan jenis laporan terlebih dahulu');
      return;
    }

    try {
      // Buat parameter URL
      const params = new URLSearchParams({
        storeId: selectedStore,
        type: selectedReport,
        startDate: dateRange.start,
        endDate: dateRange.end
      });

      // Redirect ke halaman cetak yang sesuai
      let printUrl = '';
      switch(selectedReport) {
        case 'sales':
          printUrl = `/api/reports/sales/print?${params.toString()}`;
          break;
        case 'inventory':
          printUrl = `/api/reports/inventory/print?${params.toString()}`;
          break;
        case 'daily':
          printUrl = `/api/reports/daily/print?${params.toString()}`;
          break;
        case 'summary':
          printUrl = `/api/reports/summary/print?${params.toString()}`;
          break;
        default:
          printUrl = `/api/reports/summary/print?${params.toString()}`;
      }

      // Buka laporan di tab baru
      window.open(printUrl, '_blank');
    } catch (error) {
      console.error('Error printing report:', error);
      alert('Terjadi kesalahan saat mencetak laporan');
    }
  };

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

  // Report types
  const reportTypes = [
    { id: 'sales', name: 'Laporan Penjualan', icon: ShoppingCart },
    { id: 'daily', name: 'Laporan Harian', icon: TrendingUp },
    { id: 'inventory', name: 'Laporan Inventaris', icon: Package },
    { id: 'summary', name: 'Ringkasan Laporan', icon: FileText },
  ];

  return (
    <div className={`max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 ${userTheme.darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cetak Laporan Toko</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Cetak berbagai jenis laporan untuk toko masing-masing
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Store Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pilih Toko
            </label>
            <div className="relative">
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih Toko</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
              <Store className="absolute right-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
          </div>

          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Jenis Laporan
            </label>
            <div className="relative">
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Pilih Jenis Laporan</option>
                {reportTypes.map(report => (
                  <option key={report.id} value={report.id}>
                    {report.name}
                  </option>
                ))}
              </select>
              <FileText className="absolute right-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
          </div>

          {/* Date Range Start */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tanggal Awal
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date Range End */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Print Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handlePrint}
            disabled={!selectedStore || !selectedReport}
            className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Printer className="h-5 w-5 mr-2" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Report Types Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map((report, index) => {
          const IconComponent = report.icon;
          return (
            <div 
              key={report.id}
              className={`p-6 rounded-xl shadow ${
                userTheme.darkMode ? 'bg-gray-800' : 'bg-white'
              } border-l-4 border-blue-500 cursor-pointer hover:shadow-md transition-shadow ${
                selectedReport === report.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedReport(report.id)}
            >
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <h3 className={`text-lg font-medium ${
                    userTheme.darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {report.name}
                  </h3>
                  <p className={`text-sm ${
                    userTheme.darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {report.id === 'sales' && 'Detail penjualan harian'}
                    {report.id === 'daily' && 'Ringkasan aktivitas harian'}
                    {report.id === 'inventory' && 'Stok produk terkini'}
                    {report.id === 'summary' && 'Ringkasan keseluruhan'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}