// components/admin/CreateStoreModal.js
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/constants';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/LoadingSpinner'; // Import LoadingSpinner

export default function CreateStoreModal({ isOpen, onClose, onStoreCreated }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    adminUsername: '',
    adminPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [newAdminCredentials, setNewAdminCredentials] = useState(null);

  useEffect(() => {
    if (!isOpen) { // Reset state when modal is closed
      setFormData({
        name: '', description: '', address: '', phone: '', email: '', adminUsername: '', adminPassword: '',
      });
      setNewAdminCredentials(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
    router.push('/unauthorized'); // Should ideally be handled by parent route protection
    return null;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setNewAdminCredentials(result.adminCredentials);
        toast.success(result.message || 'Toko berhasil dibuat!');
        if (onStoreCreated) onStoreCreated(); // Notify parent to refresh data
        // onClose(); // Don't close immediately, let user see credentials
      } else {
        toast.error(result.error || 'Gagal membuat toko');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat membuat toko');
      console.error('Error creating store:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderSuccessMessage = () => (
    <div className="bg-green-50 dark:bg-green-900 border-l-4 border-green-400 p-4 rounded-md shadow-lg">
      <h3 className="text-lg font-bold text-green-800 dark:text-green-200">Toko Berhasil Dibuat!</h3>
      <p className="mt-2 text-gray-700 dark:text-gray-300">
        Akun admin untuk toko baru telah dibuat secara otomatis. Harap simpan kredensial ini di tempat yang aman.
      </p>
      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
          Username: <span className="font-mono text-blue-600 dark:text-blue-400">{newAdminCredentials.username}</span>
        </p>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">
          Password: <span className="font-mono text-blue-600 dark:text-blue-400">{newAdminCredentials.password}</span>
        </p>
      </div>
      <div className="mt-6">
        <button
          onClick={onClose} // Close the modal
          className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Tutup
        </button>
      </div>
    </div>
  );

  if (!isOpen) return null;

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

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Buat Toko Baru</h2>
        
        {newAdminCredentials ? renderSuccessMessage() : (
          <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Nama toko"
              />
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
                placeholder="Deskripsi toko (opsional)"
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
                placeholder="Alamat toko (opsional)"
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
                  placeholder="Nomor telepon (opsional)"
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
                  placeholder="Email toko (opsional)"
                />
              </div>
            </div>

            <hr className="my-6 border-gray-200 dark:border-gray-700" />

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Informasi Akun Admin Toko (Opsional)</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Jika tidak diisi, username dan password akan dibuat otomatis dengan format: <code className="font-mono bg-gray-100 dark:bg-gray-700 p-1 rounded">admin_namatoko</code> dan <code className="font-mono bg-gray-100 dark:bg-gray-700 p-1 rounded">password123</code>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Password Admin
                </label>
                <input
                  type="password"
                  id="adminPassword"
                  name="adminPassword"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="Password untuk admin toko"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={onClose} // Changed from router.back()
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Membuat...' : 'Buat Toko'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}