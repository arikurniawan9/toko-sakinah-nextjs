'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ROLES } from '@/lib/constants';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useNotification } from '@/components/notifications/NotificationProvider';

export default function WarehouseDistributionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [distributionData, setDistributionData] = useState({
    storeId: '',
    distributionDate: new Date().toISOString().split('T')[0],
    items: [],
  });
  const [newItem, setNewItem] = useState({
    productId: '',
    quantity: 1,
  });
  const [loading, setLoading] = useState(true);
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const { showNotification } = useNotification();

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER)) {
      router.push('/unauthorized');
      return;
    }

    fetchInitialData();
  }, [status, session, router]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [storesRes, productsRes, warehouseStockRes] = await Promise.all([
        fetch('/api/warehouse/stores'),
        fetch('/api/warehouse/products'),
        fetch('/api/warehouse/stock'),
      ]);

      const storesData = await storesRes.json();
      const productsData = await productsRes.json();
      const warehouseStockData = await warehouseStockRes.json();

      if (storesRes.ok) {
        setStores(storesData.stores);
      } else {
        console.error('Failed to fetch stores:', storesData.error);
        setStores([]);
      }

      if (productsRes.ok) {
        setProducts(productsData.products);
      } else {
        console.error('Failed to fetch products:', productsData.error);
        setProducts([]);
      }

      if (warehouseStockRes.ok) {
        setWarehouseStock(warehouseStockData.warehouseProducts);
      } else {
        console.error('Failed to fetch warehouse stock:', warehouseStockData.error);
        setWarehouseStock([]);
      }
    } catch (error) {
      console.error('Error fetching initial data for warehouse distribution:', error);
      setStores([]);
      setProducts([]);
      setWarehouseStock([]);
      showNotification('Error mengambil data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };


  if (status === 'loading' || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (status !== 'authenticated' || (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER)) {
    router.push('/unauthorized');
    return null;
  }

  const handleAddItem = () => {
    // Cek apakah produk tersedia di gudang dengan jumlah yang cukup
    const stockItem = warehouseStock.find(s => s.productId === newItem.productId);
    if (!stockItem || stockItem.quantity < newItem.quantity) {
      showNotification('Stok tidak mencukupi atau produk tidak tersedia di gudang', 'error');
      return;
    }

    if (newItem.productId && newItem.quantity > 0) {
      // Cek apakah item sudah ada di daftar, jika ya tambahkan jumlahnya
      const existingItemIndex = distributionData.items.findIndex(item => item.productId === newItem.productId);
      if (existingItemIndex >= 0) {
        const updatedItems = [...distributionData.items];
        updatedItems[existingItemIndex].quantity += newItem.quantity;

        // Cek kembali apakah total jumlah melebihi stok
        const totalRequested = updatedItems[existingItemIndex].quantity;
        if (stockItem.quantity < totalRequested) {
          showNotification('Total jumlah melebihi stok yang tersedia', 'error');
          return;
        }

        setDistributionData({
          ...distributionData,
          items: updatedItems,
        });
      } else {
        setDistributionData({
          ...distributionData,
          items: [...distributionData.items, { ...newItem, id: Date.now() }],
        });
      }
      setNewItem({ productId: '', quantity: 1 });
    }
  };

  const handleRemoveItem = (id) => {
    setDistributionData({
      ...distributionData,
      items: distributionData.items.filter(item => item.id !== id),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/warehouse/distribution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...distributionData,
          distributedBy: session.user.id,
          status: 'DELIVERED', // Default status
        }),
      });

      if (response.ok) {
        showNotification('Distribusi berhasil disimpan', 'success');
        router.push('/warehouse');
      } else {
        const error = await response.json();
        showNotification(error.message || 'Gagal menyimpan distribusi', 'error');
      }
    } catch (error) {
      showNotification('Terjadi kesalahan saat menyimpan distribusi: ' + error.message, 'error');
      console.error('Error submitting distribution:', error);
    }
  };

  return (
    <div className={`min-h-screen ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <header className={`${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } shadow border-b`}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className={`text-2xl font-bold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>Distribusi ke Toko</h1>
          <div className={`text-right ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <p className="text-sm">Selamat datang,</p>
            <p className="font-medium">{session.user.name}</p>
            <p className="text-xs">{session.user.role}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className={`rounded-xl shadow ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } p-6`}>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label htmlFor="storeId" className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Pilih Toko Tujuan *
                </label>
                <select
                  id="storeId"
                  value={distributionData.storeId}
                  onChange={(e) => setDistributionData({...distributionData, storeId: e.target.value})}
                  required
                  className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } border`}
                >
                  <option value="">Pilih Toko</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="distributionDate" className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Tanggal Distribusi *
                </label>
                <input
                  type="date"
                  id="distributionDate"
                  value={distributionData.distributionDate}
                  onChange={(e) => setDistributionData({...distributionData, distributionDate: e.target.value})}
                  required
                  className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } border`}
                />
              </div>
            </div>

            <div className="mb-8">
              <h3 className={`text-lg font-medium mb-4 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>Tambahkan Produk dari Gudang</h3>
              <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-3">
                <div>
                  <label htmlFor="productId" className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Produk
                  </label>
                  <select
                    id="productId"
                    value={newItem.productId}
                    onChange={(e) => setNewItem({...newItem, productId: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } border`}
                  >
                    <option value="">Pilih Produk</option>
                    {warehouseStock
                      .filter(item => item.quantity > 0) // Hanya produk dengan stok > 0
                      .map(item => {
                        const product = products.find(p => p.id === item.productId);
                        return (
                          <option key={item.productId} value={item.productId}>
                            {product?.name} - Stok: {item.quantity}
                          </option>
                        );
                      })}
                  </select>
                </div>
                <div>
                  <label htmlFor="quantity" className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Jumlah Distribusi
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
                    min="1"
                    className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } border`}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition duration-200"
                  >
                    Tambah ke Distribusi
                  </button>
                </div>
              </div>

              {/* Daftar item yang akan didistribusikan */}
              {distributionData.items.length > 0 && (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                      <tr>
                        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          darkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          Produk
                        </th>
                        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          darkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          Jumlah
                        </th>
                        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          darkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          Stok di Gudang
                        </th>
                        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          darkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${
                      darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'
                    }`}>
                      {distributionData.items.map((item) => {
                        const product = products.find(p => p.id === item.productId);
                        const stockItem = warehouseStock.find(s => s.productId === item.productId);
                        return (
                          <tr key={item.id} className={darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                              darkMode ? 'text-gray-300' : 'text-gray-900'
                            }`}>
                              <div className="font-medium">{product?.name}</div>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                              darkMode ? 'text-gray-300' : 'text-gray-900'
                            }`}>
                              <div>{item.quantity}</div>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                              darkMode ? 'text-gray-300' : 'text-gray-900'
                            }`}>
                              <div>{stockItem?.quantity || 0}</div>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm`}>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                  darkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={distributionData.items.length === 0 || !distributionData.storeId}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
                  distributionData.items.length === 0 || !distributionData.storeId
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Simpan Distribusi
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}