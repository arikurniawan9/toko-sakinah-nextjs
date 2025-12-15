// app/kasir/page.js
'use client';

import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../components/ProtectedRoute';
import Link from 'next/link';
import { Calculator, History, CreditCard, ShoppingCart, AlertTriangle, User } from 'lucide-react';
import Sidebar from '../../components/Sidebar'; // Import Sidebar
import { useUserTheme } from '../../components/UserThemeContext'; // Import useDarkMode
import { useState, useEffect } from 'react';
import ScrollingStockAlert from '../../components/kasir/dashboard/ScrollingStockAlert';

export default function CashierDashboard() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode; // Use dark mode context
  const [summaryData, setSummaryData] = useState({
    transactionsCount: 0,
    totalRevenue: 0,
    totalItemsSold: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [lowStockLoading, setLowStockLoading] = useState(true);

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

    const fetchLowStockProducts = async () => {
      try {
        setLowStockLoading(true);
        const response = await fetch('/api/produk/low-stock?threshold=10');
        if (!response.ok) {
          throw new Error('Failed to fetch low stock products');
        }
        const data = await response.json();
        setLowStockProducts(data.lowStockProducts);
      } catch (error) {
        console.error('Error fetching low stock products:', error);
      } finally {
        setLowStockLoading(false);
      }
    };

    fetchSummary();
    fetchLowStockProducts();
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
      description: "Lihat riwayat transaksi yang telah Anda proses",
      href: "/kasir/riwayat", // Changed to cashier-specific route
      icon: History,
      color: "bg-blue-100 text-blue-600", // Light mode colors
      darkModeColor: "bg-blue-900/30 text-blue-400", // Dark mode colors
    },
    {
      title: "Profil Saya",
      description: "Ubah data profil kasir",
      href: "/kasir/profile",
      icon: User,
      color: "bg-green-100 text-green-600",
      darkModeColor: "bg-green-900/30 text-green-400",
    },
  ];

  const formatCurrency = (amount) => {
    // Validasi bahwa amount adalah angka sebelum diformat
    const numAmount = typeof amount === 'number' ? amount : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  return (
    <ProtectedRoute requiredRole="CASHIER">
      <Sidebar>
        <main className={`flex-1 p-4 min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Scrolling Stock Alert */}
            <div className="mb-6">
              <ScrollingStockAlert darkMode={darkMode} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Quick Links */}
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Menu Kasir</h2>
                  <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Selamat datang, {session?.user?.name || 'Kasir'}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          <div className={`flex items-center justify-center font-medium ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
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
                
                {/* Quick Tips Section */}
                <div className={`mt-6 p-5 rounded-xl shadow border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h2 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Tips Harian</h2>
                  <ul className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Gunakan tombol pintas (Alt+H) untuk kembali ke dashboard</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Tekan Enter setelah mengetik kode produk untuk scan cepat</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Gunakan Alt+Enter untuk langsung membayar jika jumlah sudah cukup</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Gunakan SHIFT+S untuk menangguhkan transaksi</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Quick Stats & Low Stock Products */}
              <div className="lg:col-span-1 space-y-6">
                {/* Quick Stats */}
                <div>
                  <h2 className={`text-2xl font-semibold mb-4 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>Ringkasan Hari Ini</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {/* Low Stock Products */}
                <div>
                  <h2 className={`text-2xl font-semibold mb-4 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>Produk Stok Menipis</h2>
                  <div className={`p-5 rounded-xl shadow border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    {lowStockLoading ? (
                      <p className="text-center text-gray-500">Memuat produk...</p>
                    ) : lowStockProducts.length > 0 ? (
                      <ul className="space-y-3">
                        {lowStockProducts.map(product => (
                          <li key={product.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                              <span className={`${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{product.name}</span>
                            </div>
                            <span className={`font-semibold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Stok: {product.stock}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center text-gray-500">Tidak ada produk dengan stok menipis.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </Sidebar>
    </ProtectedRoute>
  );
}