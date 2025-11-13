
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useDarkMode } from '@/components/DarkModeContext';
import Link from 'next/link';
import { Plus, Eye, Filter, X } from 'lucide-react';

export default function PurchaseHistoryPage() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for filters
  const [suppliers, setSuppliers] = useState([]);
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') return;

    const fetchSuppliers = async () => {
      try {
        const res = await fetch('/api/supplier?limit=1000');
        if (!res.ok) throw new Error('Failed to fetch suppliers');
        const data = await res.json();
        setSuppliers(data.suppliers || []);
      } catch (err) {
        console.error('Error fetching suppliers:', err);
      }
    };

    fetchSuppliers();
  }, [session]);

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') return;

    const fetchPurchases = async () => {
      setLoading(true);
      const query = new URLSearchParams({
        supplierId: filterSupplier,
        startDate: filterStartDate,
        endDate: filterEndDate,
      }).toString();

      try {
        const res = await fetch(`/api/purchase?${query}`);
        if (!res.ok) throw new Error('Failed to fetch purchase history');
        const data = await res.json();
        setPurchases(data.purchases || []);
      } catch (err) {
        console.error('Error fetching purchase history:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, [session, filterSupplier, filterStartDate, filterEndDate]);

  const resetFilters = () => {
    setFilterSupplier('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className={`flex-1 p-4 min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Riwayat Transaksi Pembelian</h1>
          <Link href="/admin/transaksi/pembelian/tambah">
            <button className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
              <Plus className="h-5 w-5 mr-2" />
              Tambah Pembelian
            </button>
          </Link>
        </div>

        {/* Filter Section */}
        <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-sm font-medium">Supplier</label>
              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className={`w-full mt-1 p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
              >
                <option value="">Semua Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Dari Tanggal</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className={`w-full mt-1 p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Sampai Tanggal</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className={`w-full mt-1 p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
              />
            </div>
            <button
              onClick={resetFilters}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
            >
              <X size={16} className="mr-2" />
              Reset Filter
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}

        <div className={`bg-white p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : ''}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dibuat Oleh</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">Loading...</td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">Tidak ada riwayat pembelian.</td>
                  </tr>
                ) : (
                  purchases.map(purchase => (
                    <tr key={purchase.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{new Date(purchase.purchaseDate).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{purchase.supplier.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">Rp {purchase.totalAmount.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{purchase.user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/admin/transaksi/pembelian/detail/${purchase.id}`}>
                          <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                            <Eye size={20} />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
