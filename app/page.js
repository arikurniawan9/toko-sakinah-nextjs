'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ROLES } from '@/lib/constants';
import { Sun, Moon, ShoppingCart, Users, BarChart3, Settings, CreditCard } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check system preference or saved preference for dark mode
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(savedDarkMode || systemPrefersDark);
  }, []);

  useEffect(() => {
    if (isClient) {
      // Apply dark mode class to document
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      // Save preference to localStorage
      localStorage.setItem('darkMode', darkMode.toString());
    }
  }, [darkMode, isClient]);

  // Fungsi untuk toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Jika sedang loading, tampilkan loading
  if (status === 'loading' || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-blue-700 dark:text-blue-300">Memuat...</p>
        </div>
      </div>
    );
  }

  // Fungsi untuk mendapatkan dashboard URL berdasarkan role
  const getDashboardUrl = () => {
    if (!session?.user?.role) return '/login';

    switch (session.user.role) {
      case ROLES.MANAGER:
        return '/manager';
      case ROLES.WAREHOUSE:
        return '/warehouse';
      case ROLES.ADMIN:
      case ROLES.CASHIER:
      case ROLES.ATTENDANT:
        return '/select-store';
      default:
        return '/login';
    }
  };

  // Fungsi untuk mendapatkan nama dashboard berdasarkan role
  const getDashboardName = () => {
    if (!session?.user?.role) return 'Dashboard';

    switch (session.user.role) {
      case ROLES.MANAGER:
        return 'Dashboard Manager';
      case ROLES.WAREHOUSE:
        return 'Dashboard Gudang';
      case ROLES.ADMIN:
      case ROLES.CASHIER:
      case ROLES.ATTENDANT:
        return 'Pilih Toko';
      default:
        return 'Dashboard';
    }
  };

  // Fungsi untuk mendapatkan ikon berdasarkan role
  const getDashboardIcon = () => {
    if (!session?.user?.role) return Settings;

    switch (session.user.role) {
      case ROLES.MANAGER:
        return BarChart3;
      case ROLES.WAREHOUSE:
        return ShoppingCart;
      case ROLES.ADMIN:
        return Settings;
      case ROLES.CASHIER:
        return CreditCard;
      case ROLES.ATTENDANT:
        return Users;
      default:
        return Settings;
    }
  };

  // Header untuk semua kondisi
  const renderHeader = () => {
    const DashboardIcon = getDashboardIcon();

    return (
      <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-indigo-600 dark:text-indigo-400 mr-2" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">
                  Toko Sakinah
                </h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Dark/Light Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {status === 'authenticated' ? (
                <Link
                  href={getDashboardUrl()}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                >
                  <DashboardIcon className="h-4 w-4 mr-2" />
                  {getDashboardName()}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="user-profile flex items-center justify-center"
                  aria-label="User Login Button"
                  role="button"
                  tabIndex="0"
                >
                  <div className="user-profile-inner flex items-center justify-center">
                    <svg
                      aria-hidden="true"
                      className="w-6 h-6 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <g data-name="Layer 2" id="Layer_2">
                        <path
                          d="m15.626 11.769a6 6 0 1 0 -7.252 0 9.008 9.008 0 0 0 -5.374 8.231 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 9.008 9.008 0 0 0 -5.374-8.231zm-7.626-4.769a4 4 0 1 1 4 4 4 4 0 0 1 -4-4zm10 14h-12a1 1 0 0 1 -1-1 7 7 0 0 1 14 0 1 1 0 0 1 -1 1z"
                        ></path>
                      </g>
                    </svg>
                    <span className="ml-2">Log In</span>
                  </div>
                </Link>
              )}
            </div>

            {/* Mobile menu button - simple version */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  };

  // Konten utama
  const renderMainContent = () => (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
              Selamat Datang di <span className="text-indigo-600 dark:text-indigo-400">Sistem Informasi</span> Toko Sakinah
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Solusi lengkap untuk mengelola toko Anda dengan sistem informasi penjualan &amp; inventaris multi-toko
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Fitur Unggulan</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Sistem kami menyediakan berbagai fitur untuk memudahkan pengelolaan toko multi-toko Anda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-600">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                <ShoppingCart className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Manajemen Penjualan</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Sistem kasir yang mudah digunakan untuk transaksi penjualan cepat dan akurat
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-600">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Laporan Lengkap</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Laporan keuangan, stok, dan penjualan yang komprehensif untuk pengambilan keputusan
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-600">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Multi-Role & Multi-Toko</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Sistem yang mendukung berbagai peran pengguna dan manajemen multi-toko
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-600">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Manajemen Keuangan</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Pengelolaan pengeluaran, piutang, dan arus kas yang terintegrasi
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-600">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-lg flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Manajemen Produk</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Pengelolaan stok, kategori, dan informasi produk secara menyeluruh
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-600">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Manajemen Pelanggan</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Sistem keanggotaan dan manajemen pelanggan untuk loyalitas yang lebih baik
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-700 dark:to-purple-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Siap Mengelola Toko Anda Secara Digital?</h2>
          <p className="text-xl text-indigo-100 mb-8">
            Bergabunglah dengan ribuan pengguna lainnya yang telah meningkatkan efisiensi toko mereka
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {status === 'authenticated' ? (
              <Link
                href={getDashboardUrl()}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50"
              >
                <span>Ke Dashboard Saya</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50"
              >
                <span>Mulai Sekarang</span>
              </Link>
            )}
            <Link
              href="#"
              className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-white bg-transparent hover:bg-white hover:bg-opacity-10"
            >
              <span>Pelajari Lebih Lanjut</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 py-8 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-base text-gray-600 dark:text-gray-400">
              {status === 'authenticated'
                ? `Halo, ${session.user.name} - Akses dashboard Anda sesuai peran`
                : 'Login untuk mengakses sistem sesuai peran Anda'
              }
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
              &copy; 2025 Toko Sakinah. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      {renderHeader()}
      {renderMainContent()}
    </div>
  );
}