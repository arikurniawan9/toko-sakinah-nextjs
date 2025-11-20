// app/manager/stores/[storeId]/page.js
'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ROLES } from '@/lib/constants';
import { ArrowLeft } from 'lucide-react';

export default function StoreDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId;

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }
    if (storeId) {
      fetchStoreDetails();
    }
  }, [status, session, storeId, router]);

  const fetchStoreDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stores/${storeId}`);
      if (response.ok) {
        const data = await response.json();
        setStore(data.store);
      } else {
        const errData = await response.json();
        setError(errData.error || 'Gagal memuat detail toko');
      }
    } catch (err) {
      setError('Terjadi kesalahan pada server');
      console.error('Error fetching store details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  if (!store) {
    return <div className="flex justify-center items-center h-screen">Toko tidak ditemukan.</div>;
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <button onClick={() => router.back()} className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-4">
          <ArrowLeft size={18} className="mr-2" />
          Kembali ke Dashboard
        </button>
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{store.name}</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Detail dan informasi toko</p>
            </div>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${store.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {store.status}
            </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="border-t border-gray-200 dark:border-gray-700">
          <dl>
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nama Toko</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{store.name}</dd>
            </div>
            <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Deskripsi</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{store.description || '-'}</dd>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Alamat</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{store.address || '-'}</dd>
            </div>
            <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Telepon</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{store.phone || '-'}</dd>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{store.email || '-'}</dd>
            </div>
             <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Dibuat pada</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{new Date(store.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
         <div className="px-4 py-5 sm:px-6 flex justify-end">
            <button
                onClick={() => router.push(`/manager/edit-store/${storeId}`)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Edit Toko
            </button>
        </div>
      </div>
    </main>
  );
}
