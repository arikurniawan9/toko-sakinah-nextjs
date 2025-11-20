// components/admin/StoreDetailEditModal.js
'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // Keep useRouter for potential push to unauthorized
import { ROLES } from '@/lib/constants';
import { ArrowLeft } from 'lucide-react'; // Assuming lucide-react is available
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/LoadingSpinner'; // Import LoadingSpinner

export default function StoreDetailEditModal({ isOpen, onClose, storeId, onStoreUpdated }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    status: 'ACTIVE',
    adminUsername: '',
  });
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTempAdminPassword, setShowTempAdminPassword] = useState('');

  useEffect(() => {
    if (!isOpen) { // Reset state when modal is closed
      setFormData({
        name: '', description: '', address: '', phone: '', email: '', status: 'ACTIVE', adminUsername: '',
      });
      setAdminUser(null);
      setLoading(true);
      setShowTempAdminPassword('');
      return;
    }

    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }
    
    if (storeId) {
      fetchStoreDetails();
    }
  }, [isOpen, status, session, storeId, router]);

  const fetchStoreDetails = async () => {
    try {
      const response = await fetch(`/api/stores/${storeId}`);
      if (response.ok) {
        const data = await response.json();
        const fetchedStore = data.store;
        setFormData({
          name: fetchedStore.name || '',
          description: fetchedStore.description || '',
          address: fetchedStore.address || '',
          phone: fetchedStore.phone || '',
          email: fetchedStore.email || '',
          status: fetchedStore.status || 'ACTIVE',
          adminUsername: fetchedStore.adminUser?.username || '',
        });
        setAdminUser(fetchedStore.adminUser);
      } else {
        const errData = await response.json();
        toast.error(errData.error || 'Gagal memuat detail toko');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan pada server');
      console.error('Error fetching store details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // setError(''); // Removed

    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            address: formData.address,
            phone: formData.phone,
            email: formData.email,
            status: formData.status,
            adminUsername: formData.adminUsername,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'Toko berhasil diperbarui!'); // Added toast.success
        onClose();
        if (onStoreUpdated) onStoreUpdated();
      } else {
        toast.error(result.error || 'Gagal memperbarui toko'); // Replaced setError
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat memperbarui toko'); // Replaced setError
      console.error('Error updating store:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAdminPassword = async () => {
    if (!adminUser) return;

    setLoading(true);
    // setError(''); // Removed
    setShowTempAdminPassword('');

    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resetAdminPassword: true }),
      });

      const result = await response.json();

      if (response.ok) {
        setShowTempAdminPassword(result.newAdminPassword);
        toast.success('Password admin berhasil direset!'); // Added toast.success
      } else {
        toast.error(result.error || 'Gagal mereset password admin'); // Replaced setError
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat mereset password admin'); // Replaced setError
      console.error('Error resetting admin password:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 m-4 max-w-lg w-full relative flex justify-center items-center h-48">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 m-4 max-w-3xl w-full relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Remove local error display */}

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Edit Toko</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Nama Toko *
                </label>
                <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                />
            </div>
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Status
                </label>
                <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                >
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Tidak Aktif</option>
                </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Deskripsi
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Alamat
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Telepon
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              />
            </div>
          </div>

          <hr className="my-6 border-gray-200 dark:border-gray-700" />

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Informasi Akun Admin Toko</h3>

          {adminUser ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="adminUsername" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Username Admin
                </label>
                <input
                  type="text"
                  id="adminUsername"
                  name="adminUsername"
                  value={formData.adminUsername}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="Username untuk admin toko"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleResetAdminPassword}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  disabled={loading}
                >
                  {loading ? 'Mengatur ulang...' : 'Reset Password Admin'}
                </button>
                {showTempAdminPassword && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                    Password baru: <span className="font-mono">{showTempAdminPassword}</span> (Harap catat dan sampaikan ke admin toko)
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">Tidak ada akun admin toko yang ditemukan untuk toko ini.</p>
          )}

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Memperbarui...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
