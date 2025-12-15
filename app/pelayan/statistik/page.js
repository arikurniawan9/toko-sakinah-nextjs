// app/pelayan/statistik/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { Package, TrendingUp, ShoppingCart, User, BarChart3, RotateCcw } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useNotification } from '../../../components/notifications/NotificationProvider';

export default function AttendantStatsPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/pelayan/stats?attendantId=${session?.user?.id}`);
        if (!response.ok) throw new Error('Gagal mengambil statistik');
        const data = await response.json();
        
        setStats(data.stats);
      } catch (err) {
        setError(err.message);
        showNotification(`Gagal mengambil statistik: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchStats();
    }
  }, [session, showNotification]);

  // Initialize dark mode
  useEffect(() => {
    const storedPreference = localStorage.getItem('darkMode');
    if (storedPreference !== null) {
      setDarkMode(JSON.parse(storedPreference));
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }
  }, [darkMode]);

  const refreshStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pelayan/stats?attendantId=${session?.user?.id}`);
      if (!response.ok) throw new Error('Gagal mengambil statistik');
      const data = await response.json();
      
      setStats(data.stats);
      showNotification('Statistik diperbarui', 'success');
    } catch (err) {
      setError(err.message);
      showNotification(`Gagal memperbarui statistik: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <ProtectedRoute requiredRole="ATTENDANT">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </ProtectedRoute>
    );
  }

  if (error && !stats) {
    return (
      <ProtectedRoute requiredRole="ATTENDANT">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className={`p-6 rounded-lg shadow-lg ${
            darkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-100 text-red-700'
          }`}>
            <p>Error: {error}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const statItems = [
    {
      title: "Daftar Belanja",
      value: stats?.totalLists || 0,
      icon: ShoppingCart,
      color: "purple",
      subtitle: "Total bulan ini"
    },
    {
      title: "Nilai Rata-rata",
      value: `Rp ${(stats?.avgValue || 0).toLocaleString('id-ID')}`,
      icon: TrendingUp,
      color: "green",
      subtitle: "Per daftar"
    },
    {
      title: "Produk Terlaris",
      value: stats?.topProduct || "Tidak ada data",
      icon: Package,
      color: "blue",
      subtitle: "Bulan ini"
    },
    {
      title: "Konversi",
      value: `${stats?.conversionRate || 0}%`,
      icon: User,
      color: "yellow",
      subtitle: "Tingkat keberhasilan"
    },
    {
      title: "Total Item",
      value: stats?.totalItems || 0,
      icon: Package,
      color: "indigo",
      subtitle: "Terjual bulan ini"
    },
    {
      title: "Hari Ini",
      value: stats?.todaySales || 0,
      icon: BarChart3,
      color: "teal",
      subtitle: "Daftar belanja hari ini"
    }
  ];

  const getBgColor = (color) => {
    switch(color) {
      case 'purple': return darkMode ? 'bg-purple-900/30' : 'bg-purple-100';
      case 'blue': return darkMode ? 'bg-blue-900/30' : 'bg-blue-100';
      case 'green': return darkMode ? 'bg-green-900/30' : 'bg-green-100';
      case 'yellow': return darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100';
      case 'indigo': return darkMode ? 'bg-indigo-900/30' : 'bg-indigo-100';
      case 'teal': return darkMode ? 'bg-teal-900/30' : 'bg-teal-100';
      default: return darkMode ? 'bg-gray-900/30' : 'bg-gray-100';
    }
  };

  const getTextColor = (color) => {
    switch(color) {
      case 'purple': return 'text-pastel-purple-600';
      case 'blue': return 'text-blue-600';
      case 'green': return 'text-green-600';
      case 'yellow': return 'text-yellow-600';
      case 'indigo': return 'text-indigo-600';
      case 'teal': return 'text-teal-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <ProtectedRoute requiredRole="ATTENDANT">
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${darkMode ? 'dark' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistik Pelayan</h1>
            <div className="flex items-center space-x-4">
              <button 
                onClick={refreshStats}
                disabled={loading}
                className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 ${
                  loading ? 'animate-spin' : ''
                }`}
                title="Perbarui statistik"
              >
                <RotateCcw className={`h-5 w-5 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`} />
              </button>
            </div>
          </div>

          {error && (
            <div className={`bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md flex items-center`}>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statItems.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index} 
                  className={`p-6 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-full ${getBgColor(stat.color)}`}>
                      <Icon className={`h-6 w-6 ${getTextColor(stat.color)}`} />
                    </div>
                    <div className="ml-4">
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {stat.title}
                      </p>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stat.value}
                      </p>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {stat.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Deskripsi</h2>
            <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li className="flex">
                <span className="w-48 font-medium">Daftar Belanja:</span>
                <span>Jumlah daftar belanja yang dibuat oleh pelayan dalam sebulan</span>
              </li>
              <li className="flex">
                <span className="w-48 font-medium">Nilai Rata-rata:</span>
                <span>Rata-rata nilai dari setiap daftar belanja yang dibuat</span>
              </li>
              <li className="flex">
                <span className="w-48 font-medium">Produk Terlaris:</span>
                <span>Produk paling sering ditambahkan ke daftar belanja bulan ini</span>
              </li>
              <li className="flex">
                <span className="w-48 font-medium">Konversi:</span>
                <span>Persentase daftar belanja yang berhasil dikonversi menjadi penjualan</span>
              </li>
              <li className="flex">
                <span className="w-48 font-medium">Total Item:</span>
                <span>Jumlah total item yang ditambahkan ke daftar belanja dalam sebulan</span>
              </li>
              <li className="flex">
                <span className="w-48 font-medium">Hari Ini:</span>
                <span>Jumlah daftar belanja yang dibuat oleh pelayan hari ini</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}