'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ROLES } from '@/lib/constants';
import { ShoppingCart, Users, BarChart3, Settings, CreditCard } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { useNotification } from '@/components/notifications/NotificationProvider';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const { showNotification } = useNotification();

  // Contoh data untuk grafik penjualan
  const salesData = [
    { name: 'Sen', sales: 4000 },
    { name: 'Sel', sales: 3000 },
    { name: 'Rab', sales: 2000 },
    { name: 'Kam', sales: 2780 },
    { name: 'Jum', sales: 1890 },
    { name: 'Sab', sales: 2390 },
    { name: 'Min', sales: 3490 },
  ];

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {status === 'authenticated' && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-xl p-6 shadow">
              <div className="mb-6 text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Selamat Datang, {session.user.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Anda masuk sebagai <span className="font-semibold">{session.user.role}</span>
                </p>
              </div>

              {/* Dashboard Summary for Authenticated Users */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Total Toko</h3>
                  <p className="text-3xl font-bold text-blue-600">3</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Aktif</p>
                </div>
                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Penjualan Hari Ini</h3>
                  <p className="text-3xl font-bold text-green-600">Rp 4.200.000</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">8 transaksi</p>
                </div>
                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Produk Tersedia</h3>
                  <p className="text-3xl font-bold text-purple-600">127</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">dari 150</p>
                </div>
                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Member</h3>
                  <p className="text-3xl font-bold text-indigo-600">89</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">aktif</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Main content for non-authenticated users */}
        {status !== 'authenticated' && (
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
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50"
                  >
                    <span>Mulai Sekarang</span>
                  </Link>
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
                    Login untuk mengakses sistem sesuai peran Anda
                  </p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                    &copy; 2025 Toko Sakinah. All rights reserved.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}