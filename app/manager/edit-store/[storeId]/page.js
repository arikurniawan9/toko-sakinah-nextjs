// app/manager/edit-store/[storeId]/page.js
'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ROLES } from '@/lib/constants';
import { ArrowLeft } from 'lucide-react';

export default function EditStorePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    status: 'ACTIVE',
    adminUsername: '', // Added for editable admin username
    adminEmployeeNumber: '', // Added for editable admin employee number
  });
  const [adminUser, setAdminUser] = useState(null); // To store admin user details
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTempAdminPassword, setShowTempAdminPassword] = useState(''); // To show new password after reset

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
          adminUsername: fetchedStore.adminUser?.username || '', // Initialize admin username
          adminEmployeeNumber: fetchedStore.adminUser?.employeeNumber || '', // Initialize admin employee number
        });
        setAdminUser(fetchedStore.adminUser); // Set admin user details
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
            adminUsername: formData.adminUsername, // Include adminUsername
            employeeNumber: formData.adminEmployeeNumber, // Include adminEmployeeNumber
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Redirect to detail page after successful update
        router.push(`/manager/stores/${storeId}`);
      } else {
        setError(result.error || 'Gagal memperbarui toko');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memperbarui toko');
      console.error('Error updating store:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAdminPassword = async () => {
    if (!adminUser) return;

    setLoading(true);
    setError('');
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
        // Optionally re-fetch store details to ensure UI is consistent
        // await fetchStoreDetails();
      } else {
        setError(result.error || 'Gagal mereset password admin');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mereset password admin');
      console.error('Error resetting admin password:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
       <div className="mb-6">
         <button onClick={() => router.back()} className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-4">
            <ArrowLeft size={18} className="mr-2" />
            Kembali
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Toko</h1>
      </div>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

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

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Informasi Akun Admin Toko</h2>

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
                <label htmlFor="adminEmployeeNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Kode Pegawai Admin
                </label>
                <input
                  type="text"
                  id="adminEmployeeNumber"
                  name="adminEmployeeNumber"
                  value={formData.adminEmployeeNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="Kode pegawai untuk admin toko"
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
              onClick={() => router.back()}
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
    </main>
  );
}
