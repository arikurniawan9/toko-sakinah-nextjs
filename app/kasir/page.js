// app/kasir/page.js
'use client';

import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../components/ProtectedRoute';
import Link from 'next/link';
import { Calculator, History, CreditCard, ShoppingCart } from 'lucide-react';
import Sidebar from '../../components/Sidebar'; // Import Sidebar
import { useDarkMode } from '../../components/DarkModeContext'; // Import useDarkMode
import { useState, useEffect } from 'react';

export default function CashierDashboard() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode(); // Use dark mode context
  const [summaryData, setSummaryData] = useState({
    transactionsCount: 0,
    totalRevenue: 0,
    totalItemsSold: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/kasir-summary');
        if (!response.ok) {
          throw new Error('Failed to fetch summary');
        }
        const data = await response.json();
        setSummaryData(data);
      } catch (error) {
        console.error(error);
        // Optionally set an error state here
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  // Menu items for cashier dashboard quick links
  const menuItems = [
    {
      title: "Transaksi Baru",
      description: "Buat transaksi penjualan baru",
      href: "/kasir/transaksi", // Assuming a dedicated cashier transaction page
      icon: Calculator,
      color: "bg-purple-100 text-purple-600", // Light mode colors
      darkModeColor: "bg-purple-900/30 text-purple-400", // Dark mode colors
    },
    {
      title: "Riwayat Transaksi",
      description: "Lihat riwayat transaksi hari ini",
      href: "/admin/transaksi", // Changed to admin/transaksi as per likely structure
      icon: History,
      color: "bg-blue-100 text-blue-600", // Light mode colors
      darkModeColor: "bg-blue-900/30 text-blue-400", // Dark mode colors
    },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <ProtectedRoute requiredRole="CASHIER">
      <Sidebar> {/* Wrap content with Sidebar */}
        <main className={`flex-1 p-4 min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header - Simplified as Sidebar handles main header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard Kasir</h1>
                <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sistem Penjualan Toko Sakinah</p>
              </div>
              {/* User info and logout can be handled by Sidebar's header */}
            </div>

            <div className="mb-8">
              <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Menu Kasir</h2>
              <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pilih menu untuk melakukan transaksi</p>
            </div>

            {/* Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={index}
                    href={item.href}
                    className={`rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border ${
                      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    } overflow-hidden group`}
                  >
                    <div className="p-8 text-center">
                      <div className={`${darkMode ? item.darkModeColor : item.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                        <IconComponent size={32} />
                      </div>
                      <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>{item.description}</p>
                      <div className={`flex items-center justify-center font-medium ${darkMode ? 'text-pastel-purple-400' : 'text-pastel-purple-600'}`}>
                        <span>Mulai</span>
                        <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Quick Stats */}
            <div className="mt-16 max-w-4xl mx-auto">
              <h2 className={`text-2xl font-semibold mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>Ringkasan Hari Ini</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-xl shadow border text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className={`mx-auto p-3 rounded-full w-12 h-12 flex items-center justify-center mb-3 ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                    <CreditCard className={`h-6 w-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Transaksi Selesai</h3>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {loading ? '...' : summaryData.transactionsCount}
                  </p>
                </div>

                <div className={`p-6 rounded-xl shadow border text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className={`mx-auto p-3 rounded-full w-12 h-12 flex items-center justify-center mb-3 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                    <ShoppingCart className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Item Terjual</h3>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {loading ? '...' : summaryData.totalItemsSold}
                  </p>
                </div>

                <div className={`p-6 rounded-xl shadow border text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className={`mx-auto p-3 rounded-full w-12 h-12 flex items-center justify-center mb-3 ${darkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                    <Calculator className={`h-6 w-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  </div>
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Pendapatan</h3>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {loading ? '...' : formatCurrency(summaryData.totalRevenue)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </Sidebar>
    </ProtectedRoute>
  );
}