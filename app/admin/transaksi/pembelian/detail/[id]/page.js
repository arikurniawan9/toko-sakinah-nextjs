
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDarkMode } from '@/components/DarkModeContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';

export default function PurchaseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { darkMode } = useDarkMode();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      const fetchPurchaseDetail = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/purchase/${id}`);
          if (!res.ok) {
            throw new Error('Failed to fetch purchase details');
          }
          const data = await res.json();
          setPurchase(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchPurchaseDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <main className="p-8">Loading...</main>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <main className="p-8 text-red-500">Error: {error}</main>
      </ProtectedRoute>
    );
  }
  
  if (!purchase) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <main className="p-8">Purchase not found.</main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className={`p-4 sm:p-6 lg:p-8 min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <Link href="/admin/transaksi/pembelian" className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
              <ArrowLeft size={16} className="mr-2" />
              Kembali ke Riwayat Pembelian
            </Link>
            <button 
              onClick={() => window.print()}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
            >
              <Printer size={16} className="mr-2" />
              Cetak
            </button>
          </div>

          {/* Purchase Details Card */}
          <div className={`bg-white rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800' : ''}`}>
            <div className="flex flex-col sm:flex-row justify-between border-b pb-4 mb-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}">
              <div>
                <h1 className="text-2xl font-bold">Detail Pembelian</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ID Transaksi: {purchase.id}
                </p>
              </div>
              <div className="text-left sm:text-right mt-4 sm:mt-0">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{purchase.supplier.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{purchase.supplier.address}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{purchase.supplier.phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Tanggal Pembelian</p>
                <p className="font-semibold">{new Date(purchase.purchaseDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Dibuat Oleh</p>
                <p className="font-semibold">{purchase.user.name}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Status</p>
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Completed
                </span>
              </div>
            </div>

            {/* Items Table */}
            <h2 className="text-lg font-semibold mb-2">Item yang Dibeli</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Produk</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Kuantitas</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Harga Satuan</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {purchase.items.map(item => (
                    <tr key={item.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">{item.product.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">{item.quantity}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">Rp {item.purchasePrice.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700 dark:text-gray-300">Rp {(item.quantity * item.purchasePrice).toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold ${darkMode ? 'border-gray-700' : 'border-gray-300'}">
                    <td colSpan="3" className="text-right px-4 py-3">Total Keseluruhan</td>
                    <td className="text-right px-4 py-3 text-lg">Rp {purchase.totalAmount.toLocaleString('id-ID')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
