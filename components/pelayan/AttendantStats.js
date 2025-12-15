// components/pelayan/AttendantStats.js
'use client';

import { useState, useEffect } from 'react';
import { Package, TrendingUp, ShoppingCart, User, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

const AttendantStats = ({ attendantId, darkMode }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/pelayan/stats?attendantId=${attendantId}`);
        if (!response.ok) throw new Error('Gagal mengambil statistik');
        const data = await response.json();

        setStats(data.stats);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (attendantId) {
      fetchStats();
    }
  }, [attendantId]);

  if (loading) {
    return (
      <div className={`p-6 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 rounded-lg shadow flex items-center ${darkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-100 text-red-700'}`}>
        <AlertCircle className="h-5 w-5 mr-2" />
        Error: {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statItems = [
    {
      title: "Daftar Belanja",
      value: stats.totalLists,
      icon: ShoppingCart,
      color: "purple",
      subtitle: "Total bulan ini"
    },
    {
      title: "Nilai Rata-rata",
      value: `Rp ${stats.avgValue?.toLocaleString('id-ID')}`,
      icon: TrendingUp,
      color: "green",
      subtitle: "Per daftar"
    },
    {
      title: "Produk Terlaris",
      value: stats.topProduct,
      icon: Package,
      color: "blue",
      subtitle: "Bulan ini"
    },
    {
      title: "Konversi",
      value: `${stats.conversionRate}%`,
      icon: User,
      color: "yellow",
      subtitle: "Tingkat keberhasilan"
    }
  ];

  const getBgColor = (color) => {
    switch(color) {
      case 'purple': return darkMode ? 'bg-purple-900/30' : 'bg-purple-100';
      case 'blue': return darkMode ? 'bg-blue-900/30' : 'bg-blue-100';
      case 'green': return darkMode ? 'bg-green-900/30' : 'bg-green-100';
      case 'yellow': return darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100';
      default: return darkMode ? 'bg-gray-900/30' : 'bg-gray-100';
    }
  };

  const getTextColor = (color) => {
    switch(color) {
      case 'purple': return 'text-pastel-purple-600';
      case 'blue': return 'text-blue-600';
      case 'green': return 'text-green-600';
      case 'yellow': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-6`}>
      {statItems.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className={`p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${getBgColor(stat.color)}`}>
                <Icon className={`h-6 w-6 ${getTextColor(stat.color)}`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stat.title}
                </p>
                <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stat.value}
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {stat.subtitle}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AttendantStats;