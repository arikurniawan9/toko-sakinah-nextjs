'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ROLES } from '@/lib/constants';
import { ArrowLeft, User, Store, Clock, Eye, Edit3, Trash2, Package, Users, Activity } from 'lucide-react';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ActivityDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = useParams();
  const { userTheme } = useUserTheme();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }

    const fetchActivity = async () => {
      try {
        const response = await fetch(`/api/manager/activity-logs/${id}`);
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          } else if (response.status === 403) {
            router.push('/unauthorized');
            return;
          } else if (response.status === 404) {
            router.push('/manager/activity-log');
            return;
          }
          throw new Error('Failed to fetch activity');
        }
        const data = await response.json();
        setActivity(data.activity);
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [status, session, id, router]);

  // Hydration-safe loading and authentication checks
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
    router.push('/unauthorized');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <p className="text-gray-500 dark:text-gray-400 text-center">Aktivitas tidak ditemukan</p>
        </div>
      </div>
    );
  }

  // Fungsi untuk mendapatkan nama entitas
  const getItemName = () => {
    if (activity.newValue) {
      try {
        const parsedValue = JSON.parse(activity.newValue);
        if (activity.entity === 'STORE' && parsedValue.name) return parsedValue.name;
        if (activity.entity === 'USER' && parsedValue.name) return parsedValue.name;
        if (activity.entity === 'PRODUCT' && parsedValue.name) return parsedValue.name;
      } catch (e) {
        // Jika parsing gagal, abaikan
      }
    }
    if (activity.oldValue) {
      try {
        const parsedValue = JSON.parse(activity.oldValue);
        if (activity.entity === 'STORE' && parsedValue.name) return parsedValue.name;
        if (activity.entity === 'USER' && parsedValue.name) return parsedValue.name;
        if (activity.entity === 'PRODUCT' && parsedValue.name) return parsedValue.name;
      } catch (e) {
        // Jika parsing gagal, abaikan
      }
    }
    return activity.entityId || 'Tidak dikenal';
  };

  // Fungsi untuk mendapatkan icon berdasarkan action
  const getActionIcon = () => {
    switch(activity.action) {
      case 'CREATE':
        return <Eye className="h-5 w-5" />;
      case 'UPDATE':
        return <Edit3 className="h-5 w-5" />;
      case 'DELETE':
      case 'DEACTIVATE':
        return <Trash2 className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  // Fungsi untuk mendapatkan warna berdasarkan action
  const getActionColor = () => {
    switch(activity.action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'DEACTIVATE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'TRANSFER':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  const itemName = getItemName();

  return (
    <div className={`max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 ${userTheme.darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Kembali
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Detail Aktivitas</h1>
      </div>

      {/* Activity Card */}
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden mb-8`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${getActionColor()}`}>
                {getActionIcon()}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{itemName}</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {activity.store?.name || activity.storeId}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getActionColor()}`}>
                {activity.action}
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {new Date(activity.createdAt).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Informasi Aktivitas</h3>
            <div className="space-y-3">
              <div className="flex">
                <span className="w-32 text-gray-600 dark:text-gray-300">Aksi</span>
                <span className="font-medium">: {activity.action}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-gray-600 dark:text-gray-300">Entitas</span>
                <span className="font-medium">: {activity.entity}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-gray-600 dark:text-gray-300">ID Entitas</span>
                <span className="font-mono">: {activity.entityId}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-gray-600 dark:text-gray-300">Tanggal</span>
                <span className="font-medium">: {new Date(activity.createdAt).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-gray-600 dark:text-gray-300">IP Address</span>
                <span className="font-mono">: {activity.ipAddress || '-'}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-gray-600 dark:text-gray-300">User Agent</span>
                <span className="text-sm break-words max-w-md">: {activity.userAgent || '-'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Pengguna</h3>
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900 dark:text-white">{activity.user?.name || activity.userId || 'System'}</p>
                <p className="text-gray-600 dark:text-gray-300">{activity.user?.username || activity.userId}</p>
              </div>
            </div>

            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 mt-6">Toko</h3>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <Store className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900 dark:text-white">{activity.store?.name || activity.storeId || 'Tidak ada toko'}</p>
                <p className="text-gray-600 dark:text-gray-300">{activity.store?.address || 'Alamat tidak tersedia'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nilai Lama dan Baru */}
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Perubahan Data</h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activity.oldValue && (
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Nilai Lama</h4>
                {activity.oldValue ? (
                  (() => {
                    try {
                      const parsedValue = JSON.parse(activity.oldValue);

                      // Fungsi untuk membuat tabel perbandingan
                      const createSaleTable = (data, isOld = false) => {
                        const bgColor = isOld ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20';
                        return (
                          <div className={`${bgColor} p-4 rounded-lg overflow-x-auto`}>
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Faktur</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{data.invoiceNumber || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Tanggal</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(data.date).toLocaleString('id-ID')}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Total</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.total || 0)}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Pembayaran</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.payment || 0)}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Kembalian</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.change || 0)}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Status</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{data.status || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Metode Pembayaran</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{data.paymentMethod || '-'}</td>
                                </tr>
                              </tbody>
                            </table>

                            {data.saleDetails && data.saleDetails.length > 0 && (
                              <div className="mt-4">
                                <h4 className="font-medium mb-2">Detail Produk</h4>
                                <div className="border rounded-lg overflow-hidden">
                                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">No</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Produk</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Jumlah</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Harga</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                      {data.saleDetails.map((detail, idx) => (
                                        <tr key={idx}>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{idx + 1}</td>
                                          <td className="px-4 py-2 text-sm">
                                            <div className="font-medium">{detail.product?.name || detail.productName || 'Produk Tidak Dikenal'}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{detail.product?.productCode || detail.productCode || '-'}</div>
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{detail.quantity}x</td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(detail.price)}</td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(detail.subtotal)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      };

                      // Tampilkan data dengan format yang lebih user-friendly
                      if (activity.entity === 'SALE') {
                        return createSaleTable(parsedValue, true);
                      } else if (activity.entity === 'PRODUCT') {
                        return (
                          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Nama</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.name || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Kode Produk</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.productCode || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Stok</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.stock || 0}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Harga Beli</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parsedValue.purchasePrice || 0)}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Deskripsi</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.description || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Kategori</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.category?.name || parsedValue.categoryName || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Supplier</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.supplier?.name || parsedValue.supplierName || '-'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        );
                      } else if (activity.entity === 'STORE') {
                        return (
                          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Nama</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.name || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Alamat</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.address || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Telepon</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.phone || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Email</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.email || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Status</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.status || '-'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        );
                      } else if (activity.entity === 'USER') {
                        return (
                          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Nama</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.name || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Username</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.username || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Role</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.role || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Status</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.status || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Nomor Pegawai</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.employeeNumber || '-'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        );
                      } else {
                        // Jika tidak ada format khusus, tampilkan format JSON biasa
                        return (
                          <pre className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-sm overflow-x-auto max-h-96 overflow-y-auto">
                            {JSON.stringify(parsedValue, null, 2)}
                          </pre>
                        );
                      }
                    } catch (e) {
                      return (
                        <pre className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-sm overflow-x-auto max-h-96 overflow-y-auto">
                          {activity.oldValue}
                        </pre>
                      );
                    }
                  })()
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">Tidak ada nilai lama.</p>
                )}
              </div>
            )}

            {activity.newValue && (
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Nilai Baru</h4>
                {activity.newValue ? (
                  (() => {
                    try {
                      const parsedValue = JSON.parse(activity.newValue);

                      // Fungsi untuk membuat tabel perbandingan
                      const createSaleTable = (data, isOld = false) => {
                        const bgColor = isOld ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20';
                        return (
                          <div className={`${bgColor} p-4 rounded-lg overflow-x-auto`}>
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Faktur</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{data.invoiceNumber || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Tanggal</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(data.date).toLocaleString('id-ID')}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Total</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.total || 0)}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Pembayaran</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.payment || 0)}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Kembalian</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.change || 0)}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Status</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{data.status || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Metode Pembayaran</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{data.paymentMethod || '-'}</td>
                                </tr>
                              </tbody>
                            </table>

                            {data.saleDetails && data.saleDetails.length > 0 && (
                              <div className="mt-4">
                                <h4 className="font-medium mb-2">Detail Produk</h4>
                                <div className="border rounded-lg overflow-hidden">
                                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">No</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Produk</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Jumlah</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Harga</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                      {data.saleDetails.map((detail, idx) => (
                                        <tr key={idx}>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{idx + 1}</td>
                                          <td className="px-4 py-2 text-sm">
                                            <div className="font-medium">{detail.product?.name || detail.productName || 'Produk Tidak Dikenal'}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{detail.product?.productCode || detail.productCode || '-'}</div>
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{detail.quantity}x</td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(detail.price)}</td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(detail.subtotal)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      };

                      // Tampilkan data dengan format yang lebih user-friendly
                      if (activity.entity === 'SALE') {
                        return createSaleTable(parsedValue, false);
                      } else if (activity.entity === 'PRODUCT') {
                        return (
                          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Nama</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.name || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Kode Produk</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.productCode || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Stok</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.stock || 0}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Harga Beli</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parsedValue.purchasePrice || 0)}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Deskripsi</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.description || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Kategori</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.category?.name || parsedValue.categoryName || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Supplier</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.supplier?.name || parsedValue.supplierName || '-'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        );
                      } else if (activity.entity === 'STORE') {
                        return (
                          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Nama</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.name || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Alamat</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.address || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Telepon</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.phone || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Email</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.email || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Status</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.status || '-'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        );
                      } else if (activity.entity === 'USER') {
                        return (
                          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Nama</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.name || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Username</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.username || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Role</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.role || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Status</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.status || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Nomor Pegawai</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{parsedValue.employeeNumber || '-'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        );
                      } else {
                        // Jika tidak ada format khusus, tampilkan format JSON biasa
                        return (
                          <pre className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-sm overflow-x-auto max-h-96 overflow-y-auto">
                            {JSON.stringify(parsedValue, null, 2)}
                          </pre>
                        );
                      }
                    } catch (e) {
                      return (
                        <pre className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-sm overflow-x-auto max-h-96 overflow-y-auto">
                          {activity.newValue}
                        </pre>
                      );
                    }
                  })()
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">Tidak ada nilai baru.</p>
                )}
              </div>
            )}
          </div>

          {/* Tambahkan perbandingan nilai jika keduanya tersedia */}
          {activity.oldValue && activity.newValue && (
            <div className="mt-8">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Perbandingan Perubahan</h4>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Field</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nilai Lama</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nilai Baru</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Perubahan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {(() => {
                      try {
                        const oldData = JSON.parse(activity.oldValue);
                        const newData = JSON.parse(activity.newValue);

                        // Fungsi untuk membandingkan data
                        const compareData = (old, neww) => {
                          const changes = [];
                          const allKeys = new Set([...Object.keys(old), ...Object.keys(neww)]);

                          allKeys.forEach(key => {
                            const oldValue = old[key]?.toString();
                            const newValue = neww[key]?.toString();

                            if (oldValue !== newValue) {
                              changes.push({
                                field: key,
                                oldValue: oldValue || 'Tidak ada',
                                newValue: newValue || 'Tidak ada',
                                changed: oldValue !== newValue
                              });
                            }
                          });

                          return changes;
                        };

                        const changes = compareData(oldData, newData);

                        return changes.map((change, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{change.field}</td>
                            <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300 line-through text-red-600 dark:text-red-400">{change.oldValue}</td>
                            <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300 text-green-600 dark:text-green-400">{change.newValue}</td>
                            <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                Berubah
                              </span>
                            </td>
                          </tr>
                        ));
                      } catch (e) {
                        return (
                          <tr>
                            <td colSpan="4" className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300 text-center">
                              Tidak dapat membuat perbandingan perubahan
                            </td>
                          </tr>
                        );
                      }
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!activity.oldValue && !activity.newValue && (
            <p className="text-gray-500 dark:text-gray-400 italic">Tidak ada perubahan data yang tercatat.</p>
          )}
        </div>
      </div>
    </div>
  );
}