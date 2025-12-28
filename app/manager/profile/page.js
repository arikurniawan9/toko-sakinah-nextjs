// app/manager/profile/page.js
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useUserTheme } from '@/components/UserThemeContext';

export default function ManagerProfile() {
  const { data: session, update: updateSession } = useSession();
  const { userTheme } = useUserTheme();
  const [userData, setUserData] = useState({
    name: '',
    username: '',
    employeeNumber: '',
    phone: '',
    address: '',
    email: ''
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load user data when session is available
  useEffect(() => {
    if (session?.user) {
      setUserData({
        name: session.user.name || '',
        username: session.user.username || '',
        employeeNumber: session.user.employeeNumber || '',
        phone: session.user.phone || '',
        address: session.user.address || '',
        email: session.user.email || ''
      });
      setIsLoading(false);
    }
  }, [session]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password) {
      toast.error('Password wajib diisi untuk menyimpan perubahan', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    if (confirmPassword && confirmPassword.length > 0 && confirmPassword !== password) {
      toast.error('Konfirmasi password tidak cocok', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          password, // Include password for verification
          newPassword: confirmPassword || undefined // Only send new password if provided
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Profil berhasil diperbarui', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // Update the session with new data
        await updateSession({
          user: { ...session.user,
                  name: userData.name,
                  username: userData.username,
                  employeeNumber: userData.employeeNumber,
                  phone: userData.phone,
                  address: userData.address,
                  email: userData.email }
        });
      } else {
        toast.error(result.error || 'Gagal memperbarui profil', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Terjadi kesalahan saat memperbarui profil', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Profil Manager</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Informasi Pengguna
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Lengkapi dan perbarui informasi akun Anda.
          </p>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700">
          <dl className="divide-y divide-gray-200 dark:divide-gray-700">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nama Lengkap *</dt>
              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="name"
                  value={userData.name}
                  onChange={handleChange}
                  className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                  required
                />
              </dd>
            </div>
            <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Username *</dt>
              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="username"
                  value={userData.username}
                  onChange={handleChange}
                  className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                  required
                />
              </dd>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email *</dt>
              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                <input
                  type="email"
                  name="email"
                  value={userData.email}
                  onChange={handleChange}
                  className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                  required
                />
              </dd>
            </div>
            <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nomor Pegawai</dt>
              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                <input
                  type="text"
                  name="employeeNumber"
                  value={userData.employeeNumber}
                  onChange={handleChange}
                  className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                />
              </dd>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Telepon</dt>
              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                <input
                  type="tel"
                  name="phone"
                  value={userData.phone}
                  onChange={handleChange}
                  maxLength={13}
                  className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                />
              </dd>
            </div>
            <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Alamat</dt>
              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                <textarea
                  name="address"
                  value={userData.address}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                />
              </dd>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Password *</dt>
              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                  placeholder="Masukkan password Anda untuk menyimpan perubahan"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Masukkan password Anda untuk mengonfirmasi perubahan profil
                </p>
              </dd>
            </div>
            <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Ganti Password</dt>
              <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                <input
                  type="password"
                  name="newPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                  placeholder="Kosongkan jika tidak ingin mengganti password"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Isi jika Anda ingin mengganti password Anda
                </p>
              </dd>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:px-6">
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </dl>
        </div>
      </form>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={userTheme.darkMode ? "dark" : "light"}
      />
    </div>
  );
}
