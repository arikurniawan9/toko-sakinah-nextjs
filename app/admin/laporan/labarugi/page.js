// app/admin/laporan/labarugi/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserTheme } from '../../../../components/UserThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Download, Calendar, Search, FileText, TrendingUp, Wallet, CreditCard, Printer } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import UniversalPrintPreview from '../../../../components/export/UniversalPrintPreview';

export default function ProfitLossReport() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // State untuk print preview
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/laporan/labarugi?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);

      if (!response.ok) {
        throw new Error('Gagal mengambil data laporan laba rugi');
      }

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Gagal memuat laporan laba rugi: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'jt';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'rb';
    }
    return num;
  };

  const handleFilter = () => {
    fetchReportData();
  };

  // Fungsi untuk membuka print preview dengan data laporan saat ini
  const openPrintPreview = () => {
    setIsPrintPreviewOpen(true);
  };

  if (loading && !reportData) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-500 dark:text-gray-400">Memuat laporan laba rugi...</span>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Breadcrumb
          items={[{ title: 'Laporan', href: '/admin/laporan' }, { title: 'Laba Rugi', href: '/admin/laporan/labarugi' }]}
          darkMode={darkMode}
        />

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Laporan Laba Rugi</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={openPrintPreview}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                darkMode
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-w-[100px]`}
            >
              <Printer className="h-4 w-4 mr-1" />
              <span>Cetak</span>
            </button>
            <button
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                darkMode
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-green-600 hover:bg-green-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 min-w-[100px]`}
            >
              <Download className="h-4 w-4 mr-1" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow rounded-lg p-4 mb-6 border`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Tanggal Awal
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleFilter}
                className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                  darkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                <Search className="h-4 w-4 inline mr-1" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview - Only show if there's data */}
        {reportData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className={`p-6 rounded-xl shadow ${
                darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
              } border`}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${
                    darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
                  }`}>
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-sm font-medium ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Total Pendapatan</h3>
                    <p className={`text-2xl font-bold ${
                      darkMode ? 'text-green-400' : 'text-green-700'
                    }`}>
                      {formatCurrency(reportData.summary.totalSales)}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-xl shadow ${
                darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
              } border`}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${
                    darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'
                  }`}>
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-sm font-medium ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Total Pengeluaran</h3>
                    <p className={`text-2xl font-bold ${
                      darkMode ? 'text-red-400' : 'text-red-700'
                    }`}>
                      {formatCurrency(reportData.summary.totalExpenses)}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-xl shadow ${
                reportData.summary.netProfit >= 0 
                  ? (darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200') 
                  : (darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200')
              } border`}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${
                    reportData.summary.netProfit >= 0 
                      ? (darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600') 
                      : (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600')
                  }`}>
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-sm font-medium ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Laba Bersih</h3>
                    <p className={`text-2xl font-bold ${
                      reportData.summary.netProfit >= 0 
                        ? (darkMode ? 'text-blue-400' : 'text-blue-700') 
                        : (darkMode ? 'text-red-400' : 'text-red-700')
                    }`}>
                      {formatCurrency(reportData.summary.netProfit)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-8 mb-8">
              {/* Sales vs Expenses Chart */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Grafik Pendapatan vs Pengeluaran</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.dailyData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4B5563' : '#E5E7EB'} />
                      <XAxis
                        dataKey="name"
                        stroke={darkMode ? '#D1D5DB' : '#6B7280'}
                      />
                      <YAxis
                        stroke={darkMode ? '#D1D5DB' : '#6B7280'}
                        tickFormatter={(value) => `Rp${formatNumber(value)}`}
                      />
                      <Tooltip
                        formatter={(value) => [formatCurrency(value), 'Jumlah']}
                        labelFormatter={(label, payload) => {
                          if (payload && payload.length > 0 && payload[0].payload.fullDate) {
                            return `Tanggal: ${new Date(payload[0].payload.fullDate).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`;
                          }
                          return `Hari: ${label}`;
                        }}
                        contentStyle={darkMode ? {
                          backgroundColor: '#1F2937',
                          borderColor: '#374151',
                          color: 'white'
                        } : {}}
                        itemStyle={darkMode ? { color: 'white' } : {}}
                        labelStyle={darkMode ? { color: 'white', fontWeight: 'bold' } : {}}
                      />
                      <Legend />
                      <Bar dataKey="sales" name="Pendapatan" fill={darkMode ? '#10B981' : '#10B981'} />
                      <Bar dataKey="expenses" name="Pengeluaran" fill={darkMode ? '#EF4444' : '#EF4444'} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Net Profit Chart */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Grafik Laba Bersih Harian</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={reportData.dailyData}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4B5563' : '#E5E7EB'} />
                      <XAxis
                        dataKey="name"
                        stroke={darkMode ? '#D1D5DB' : '#6B7280'}
                      />
                      <YAxis
                        stroke={darkMode ? '#D1D5DB' : '#6B7280'}
                        tickFormatter={(value) => `Rp${formatNumber(value)}`}
                      />
                      <Tooltip
                        formatter={(value) => [formatCurrency(value), 'Laba Bersih']}
                        labelFormatter={(label, payload) => {
                          if (payload && payload.length > 0 && payload[0].payload.fullDate) {
                            return `Tanggal: ${new Date(payload[0].payload.fullDate).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`;
                          }
                          return `Hari: ${label}`;
                        }}
                        contentStyle={darkMode ? {
                          backgroundColor: '#1F2937',
                          borderColor: '#374151',
                          color: 'white'
                        } : {}}
                        itemStyle={darkMode ? { color: 'white' } : {}}
                        labelStyle={darkMode ? { color: 'white', fontWeight: 'bold' } : {}}
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        name="Laba Bersih"
                        stroke={reportData.summary.netProfit >= 0 ? (darkMode ? '#3B82F6' : '#3B82F6') : (darkMode ? '#EF4444' : '#EF4444')}
                        fill={reportData.summary.netProfit >= 0 ? (darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)') : (darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.2)')}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {error && (
          <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
          </div>
        )}

        {/* Loading indicator when refreshing data */}
        {loading && reportData && (
          <div className={`p-4 rounded-lg mb-6 flex items-center ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
            <p className={`${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Memperbarui data...</p>
          </div>
        )}
      </main>

      {/* Print Preview Modal */}
      <UniversalPrintPreview
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        data={reportData}
        title="Laporan Laba Rugi"
        reportType="profitLoss"
        darkMode={darkMode}
        storeName={{
          name: session?.user?.storeAccess?.name || 'TOKO SAKINAH',
          address: session?.user?.storeAccess?.address
        }}
      />
    </ProtectedRoute>
  );
}