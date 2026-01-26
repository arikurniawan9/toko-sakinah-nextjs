'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/constants';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Breadcrumb from '@/components/Breadcrumb';
import { BarChart3, TrendingUp, Package, ShoppingCart, RotateCcw, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function WarehouseReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('inventory');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [reportData, setReportData] = useState(null);

  // Fetch reports data
  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.WAREHOUSE) {
      router.push('/unauthorized');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          type: reportType,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });

        const response = await fetch(`/api/warehouse/reports/advanced?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Gagal mengambil data laporan');
        }

        const data = await response.json();
        setReportData(data);
      } catch (err) {
        setError('Gagal mengambil data laporan: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status, session, reportType, dateRange, router]);

  // Hydration-safe loading and authentication checks
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (status !== 'authenticated' || session.user.role !== ROLES.WAREHOUSE) {
    router.push('/unauthorized');
    return null;
  }

  const renderReport = () => {
    if (!reportData) {
      return null;
    }

    switch(reportType) {
      case 'inventory':
        const lowStockCount = reportData.filter(p => p.currentStock < 50).length;
        const totalProducts = reportData.length;
        return (
          <div className="space-y-6">
            <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
              <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Analisis Inventaris
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4b5563' : '#d1d5db'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                    <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                    <Tooltip 
                      contentStyle={darkMode ? { backgroundColor: '#1f2937', borderColor: '#374151', color: 'white' } : {}} 
                      labelStyle={darkMode ? { color: 'white' } : {}}
                    />
                    <Legend />
                    <Bar dataKey="currentStock" name="Stok Saat Ini" fill="#8884d8" />
                    <Bar dataKey="minStock" name="Stok Minimum" fill="#ff7300" />
                    <Bar dataKey="maxStock" name="Stok Maksimum" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Produk Total</h3>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalProducts}</p>
                  </div>
                </div>
              </div>
              
              <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                    <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Stok Rendah</h3>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{lowStockCount}</p>
                  </div>
                </div>
              </div>
              
              <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                    <RotateCcw className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Perlu Ditinjau</h3>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{lowStockCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'distribution':
        return (
          <div className="space-y-6">
            <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
              <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Tren Distribusi
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4b5563' : '#d1d5db'} />
                    <XAxis dataKey="date" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                    <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                    <Tooltip 
                      contentStyle={darkMode ? { backgroundColor: '#1f2937', borderColor: '#374151', color: 'white' } : {}} 
                      labelStyle={darkMode ? { color: 'white' } : {}}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="distributed" name="Distribusi" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="received" name="Penerimaan" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      
      case 'supplier':
        return (
          <div className="space-y-6">
            <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
              <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Kinerja Supplier
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4b5563' : '#d1d5db'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                    <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                    <Tooltip 
                      contentStyle={darkMode ? { backgroundColor: '#1f2937', borderColor: '#374151', color: 'white' } : {}} 
                      labelStyle={darkMode ? { color: 'white' } : {}}
                    />
                    <Legend />
                    <Bar dataKey="onTimeDeliveries" name="Pengiriman Tepat Waktu (%)" fill="#8884d8" />
                    <Bar dataKey="qualityRating" name="Rating Kualitas" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>Report type not supported</div>;
    }
  };

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { title: 'Dashboard', href: '/warehouse' },
          { title: 'Laporan', href: '/warehouse/reports' },
        ]}
        darkMode={darkMode}
      >
        <div className="flex items-center">
          <BarChart3 className={`h-8 w-8 mr-3 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Laporan Gudang Lanjutan
            </h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Analisis dan laporan lanjutan untuk operasional gudang
            </p>
          </div>
        </div>
      </Breadcrumb>

      {error && (
        <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`}>
          {error}
        </div>
      )}

      <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border mb-6`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setReportType('inventory')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  reportType === 'inventory'
                    ? 'bg-blue-600 text-white'
                    : darkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Package className="h-4 w-4 mr-2 inline" />
                Inventaris
              </button>
              <button
                onClick={() => setReportType('distribution')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  reportType === 'distribution'
                    ? 'bg-blue-600 text-white'
                    : darkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <TrendingUp className="h-4 w-4 mr-2 inline" />
                Distribusi
              </button>
              <button
                onClick={() => setReportType('supplier')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  reportType === 'supplier'
                    ? 'bg-blue-600 text-white'
                    : darkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <ShoppingCart className="h-4 w-4 mr-2 inline" />
                Supplier
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Dari:</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  className={`px-3 py-2 rounded-md text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border`}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sampai:</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  className={`px-3 py-2 rounded-md text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border`}
                />
              </div>
              
              <button className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            renderReport()
          )}
        </div>
      </div>
    </main>
  );
}