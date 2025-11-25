'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ROLES } from '@/lib/constants';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import StockAlertNotification from '@/components/warehouse/StockAlertNotification';
import {
  Package,
  Store,
  Truck,
  ShoppingCart,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export default function WarehouseDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStores: 0,
    pendingDistributions: 0,
    totalPurchases: 0,
  });
  const [loading, setLoading] = useState(true);
  const [warehouseStock, setWarehouseStock] = useState([]);
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER)) {
      router.push('/unauthorized');
      return;
    }

    fetchStats();
    fetchWarehouseStock();
  }, [status, session, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/warehouse/stats');
      const data = await response.json();

      if (response.ok) {
        setStats({
          totalProducts: data.totalQuantityInWarehouse,
          totalStores: data.totalStoresLinked,
          pendingDistributions: data.pendingDistributions,
          totalPurchases: 0, // Placeholder for now
        });
      } else {
        console.error('Failed to fetch warehouse stats:', data.error);
        setStats({
          totalProducts: 0,
          totalStores: 0,
          pendingDistributions: 0,
          totalPurchases: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching warehouse stats:', error);
      setStats({
        totalProducts: 0,
        totalStores: 0,
        pendingDistributions: 0,
        totalPurchases: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseStock = async () => {
    try {
      const response = await fetch('/api/warehouse/stock');
      const data = await response.json();

      if (response.ok) {
        setWarehouseStock(data.warehouseProducts);
      } else {
        console.error('Failed to fetch warehouse stock:', data.error);
        setWarehouseStock([]);
      }
    } catch (error) {
      console.error('Error fetching warehouse stock:', error);
      setWarehouseStock([]);
    }
  };

  if (status === 'loading') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (status !== 'authenticated' || (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER)) {
    return null; // Redirect sudah ditangani di useEffect
  }

  // Ambil 5 produk teratas dengan stok rendah
  const lowStockProducts = warehouseStock
    .filter(item => (item.quantity - item.reserved) < 10) // Produk dengan stok tersedia kurang dari 10
    .sort((a, b) => (a.quantity - a.reserved) - (b.quantity - b.reserved)) // Urutkan dari stok terendah
    .slice(0, 5); // Ambil 5 produk pertama

  return (
    <div className={`min-h-screen ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <header className={`${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } shadow border-b`}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className={`text-2xl font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>Dashboard Gudang</h1>
              <p className={`mt-1 text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Kelola stok gudang dan distribusi ke toko
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {session.user.role === ROLES.MANAGER && (
                <button
                  onClick={() => router.push('/manager')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    darkMode
                      ? 'bg-purple-700 hover:bg-purple-600 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  ← Kembali ke Manager
                </button>
              )}
              <div className={`px-4 py-2 rounded-lg ${
                darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
              }`}>
                <p className="text-sm">Selamat datang, <span className="font-medium">{session.user.name}</span></p>
                <p className="text-xs">{session.user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={`rounded-xl shadow p-5 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <h3 className={`text-sm font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Produk di Gudang</h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow p-5 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Store className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <h3 className={`text-sm font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Jumlah Toko</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalStores}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow p-5 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <h3 className={`text-sm font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Distribusi Tertunda</h3>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingDistributions}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow p-5 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <ShoppingCart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <h3 className={`text-sm font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Pembelian Bulan Ini</h3>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalPurchases}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Purchase Management */}
          <div className={`rounded-xl shadow p-6 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-start">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className={`text-lg font-medium mb-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Manajemen Pembelian</h3>
                <p className={`text-sm mb-4 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Buat dan pantau pembelian produk dari supplier
                </p>
                <button
                  onClick={() => router.push('/warehouse/purchase')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200 text-sm"
                >
                  Buat Pembelian Baru
                </button>
              </div>
            </div>
          </div>

          {/* Distribution Management */}
          <div className={`rounded-xl shadow p-6 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-start">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className={`text-lg font-medium mb-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Distribusi ke Toko</h3>
                <p className={`text-sm mb-4 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Distribusikan produk dari gudang ke masing-masing toko
                </p>
                <button
                  onClick={() => router.push('/warehouse/distribution')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition duration-200 text-sm"
                >
                  Buat Distribusi Baru
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Management */}
          <div className={`rounded-xl shadow ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`px-6 py-4 border-b ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className={`text-xl font-semibold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>Stok Gudang</h2>
                  <p className={`mt-1 text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Lihat dan kelola stok produk di gudang
                  </p>
                </div>
                <button
                  onClick={() => router.push('/warehouse/stock')}
                  className={`text-sm ${
                    darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                  }`}
                >
                  Lihat Semua Produk →
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <h3 className={`text-lg font-medium ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Daftar Produk</h3>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className={`mt-4 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Memuat data stok...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                      <tr>
                        <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          darkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          Produk
                        </th>
                        <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          darkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          Stok Tersedia
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${
                      darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'
                    }`}>
                      {warehouseStock.length === 0 ? (
                        <tr>
                          <td colSpan="2" className={`px-4 py-4 whitespace-nowrap text-center text-sm ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Tidak ada produk di gudang.
                          </td>
                        </tr>
                      ) : (
                        warehouseStock
                          .slice(0, 5) // Ambil 5 produk pertama untuk tampilan ringkas
                          .map((item) => (
                            <tr key={item.id} className={darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}>
                              <td className={`px-4 py-4 whitespace-nowrap text-sm ${
                                darkMode ? 'text-gray-300' : 'text-gray-900'
                              }`}>
                                <div className="font-medium">{item.product.name}</div>
                                <div className={`text-xs ${
                                  darkMode ? 'text-gray-500' : 'text-gray-500'
                                }`}>({item.product.productCode})</div>
                              </td>
                              <td className={`px-4 py-4 whitespace-nowrap text-sm ${
                                darkMode ? 'text-gray-300' : 'text-gray-900'
                              }`}>
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  (item.quantity - item.reserved) <= 5
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    : (item.quantity - item.reserved) <= 10
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                }`}>
                                  {item.quantity - item.reserved}
                                </span>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Products */}
          <div className={`rounded-xl shadow ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`px-6 py-4 border-b ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center">
                <AlertTriangle className={`h-5 w-5 mr-2 ${
                  darkMode ? 'text-yellow-400' : 'text-yellow-600'
                }`} />
                <h2 className={`text-xl font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Produk Stok Rendah
                </h2>
              </div>
              <p className={`mt-1 text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Produk dengan stok tersedia kurang dari 10
              </p>
            </div>

            <div className="p-6">
              {lowStockProducts.length === 0 ? (
                <div className={`text-center py-4 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <p>Tidak ada produk dengan stok rendah</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lowStockProducts.map(item => (
                    <div
                      key={item.id}
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        (item.quantity - item.reserved) <= 5
                          ? (darkMode ? 'bg-red-900/20' : 'bg-red-50')
                          : (darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50')
                      }`}
                    >
                      <div>
                        <h3 className={`font-medium ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>{item.product.name}</h3>
                        <p className={`text-xs ${
                          darkMode ? 'text-gray-500' : 'text-gray-500'
                        }`}>{item.product.productCode}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        (item.quantity - item.reserved) <= 5
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        Tersisa: {item.quantity - item.reserved}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Alert stok minimum */}
      {session && session.user && (
        <StockAlertNotification userId={session.user.id} />
      )}
    </div>
  );
}