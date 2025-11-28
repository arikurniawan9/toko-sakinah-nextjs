'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ROLES } from '@/lib/constants';
import { useUserTheme } from '../../../components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CreateStorePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    status: 'ACTIVE'
  });
  const [adminData, setAdminData] = useState({
    name: '',
    username: '',
    employeeNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }
  }, [status, session, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdminData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (adminData.password !== adminData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store: formData,
          admin: adminData
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Toko berhasil dibuat!');
        setTimeout(() => {
          router.push('/manager/stores');
        }, 2000);
      } else {
        setError(result.error || 'Gagal membuat toko');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat membuat toko');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Buat Toko Baru</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Tambahkan toko baru lengkap dengan akun admin
        </p>
      </div>

      <div className={`rounded-xl shadow ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className={`text-lg font-medium ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Informasi Toko
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg dark:bg-green-900/30 dark:text-green-300">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Informasi Toko */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-white' : 'text-gray-700'
                }`}>
                  Nama Toko *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label htmlFor="code" className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-white' : 'text-gray-700'
                }`}>
                  Kode Toko
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Opsional"
                />
              </div>

              <div>
                <label htmlFor="description" className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-white' : 'text-gray-700'
                }`}>
                  Deskripsi
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                ></textarea>
              </div>

              <div>
                <label htmlFor="address" className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-white' : 'text-gray-700'
                }`}>
                  Alamat *
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows="2"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                ></textarea>
              </div>

              <div>
                <label htmlFor="phone" className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-white' : 'text-gray-700'
                }`}>
                  Telepon
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label htmlFor="email" className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-white' : 'text-gray-700'
                }`}>
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label htmlFor="status" className={`block text-sm font-medium mb-1 ${
                  darkMode ? 'text-white' : 'text-gray-700'
                }`}>
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Tidak Aktif</option>
                  <option value="SUSPENDED">Ditangguhkan</option>
                </select>
              </div>
            </div>

            {/* Informasi Admin */}
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <h3 className={`text-md font-medium mb-4 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Informasi Akun Admin
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="adminName" className={`block text-sm font-medium mb-1 ${
                      darkMode ? 'text-white' : 'text-gray-700'
                    }`}>
                      Nama Lengkap Admin *
                    </label>
                    <input
                      type="text"
                      id="adminName"
                      name="name"
                      value={adminData.name}
                      onChange={handleAdminChange}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode
                          ? 'bg-gray-600 border-gray-500 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label htmlFor="employeeNumber" className={`block text-sm font-medium mb-1 ${
                      darkMode ? 'text-white' : 'text-gray-700'
                    }`}>
                      Kode Pegawai
                    </label>
                    <input
                      type="text"
                      id="employeeNumber"
                      name="employeeNumber"
                      value={adminData.employeeNumber}
                      onChange={handleAdminChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode
                          ? 'bg-gray-600 border-gray-500 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Kode pegawai (opsional)"
                    />
                  </div>

                  <div>
                    <label htmlFor="username" className={`block text-sm font-medium mb-1 ${
                      darkMode ? 'text-white' : 'text-gray-700'
                    }`}>
                      Username *
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={adminData.username}
                      onChange={handleAdminChange}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode
                          ? 'bg-gray-600 border-gray-500 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className={`block text-sm font-medium mb-1 ${
                      darkMode ? 'text-white' : 'text-gray-700'
                    }`}>
                      Password *
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={adminData.password}
                      onChange={handleAdminChange}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-1 ${
                      darkMode ? 'text-white' : 'text-gray-700'
                    }`}>
                      Konfirmasi Password *
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={adminData.confirmPassword}
                      onChange={handleAdminChange}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className={`px-4 py-2 border rounded-lg ${
                darkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-white ${
                loading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Membuat Toko...' : 'Buat Toko'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}