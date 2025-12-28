'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { ROLES } from '@/lib/constants';
import { ArrowLeft, UserCog } from 'lucide-react';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function EditUserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { userId } = params;
  
  const { userTheme } = useUserTheme();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userData, setUserData] = useState({
    name: '',
    username: '',
    employeeNumber: '',
    phone: '',
    address: '',
    role: '',
    status: 'AKTIF',
    storeId: '', // Added for assigning to a new store
  });
  
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const fetchUserData = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/manager/users/${userId}`);
      const data = await response.json();

      if (response.ok) {
        setUserData({
          name: data.name || '',
          username: data.username || '',
          employeeNumber: data.employeeNumber || '',
          phone: data.phone || '',
          address: data.address || '',
          role: data.role || '',
          status: data.status || 'AKTIF',
          storeId: data.stores.length > 0 ? data.stores[0].storeId : '',
        });
      } else {
        toast.error(data.error || 'Gagal mengambil data pengguna');
        router.push('/manager/users');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Terjadi kesalahan saat mengambil data pengguna');
      router.push('/manager/users');
    }
  }, [userId, router]);

  const fetchStores = useCallback(async () => {
    try {
      const response = await fetch('/api/stores');
      const data = await response.json();
      if (response.ok) {
        setStores(data.stores || []);
      } else {
        console.error('Error fetching stores:', data.error);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }
    
    Promise.all([fetchUserData(), fetchStores()]).finally(() => setLoading(false));

  }, [status, session, router, fetchUserData, fetchStores]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userData.name.trim()) {
      toast.error('Nama wajib diisi');
      return;
    }

    if (passwordData.newPassword && passwordData.newPassword.length < 6) {
      toast.error('Password baru minimal harus 6 karakter');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Password baru dan konfirmasi password tidak cocok');
      return;
    }

    setIsSubmitting(true);

    const updatedData = {
        name: userData.name.trim(),
        employeeNumber: userData.employeeNumber.trim(),
        phone: userData.phone.trim(),
        address: userData.address.trim(),
        role: userData.role,
        status: userData.status,
    };

    if (passwordData.newPassword) {
        updatedData.password = passwordData.newPassword;
    }
    
    try {
      const response = await fetch(`/api/manager/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`User ${userData.name} berhasil diperbarui!`);
        setTimeout(() => {
          router.push('/manager/users');
        }, 1500);
      } else {
        toast.error(result.error || 'Gagal memperbarui user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Terjadi kesalahan saat memperbarui user');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8 ${userTheme.darkMode ? 'dark' : ''}`}>
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Kembali</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Pengguna</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Perbarui detail pengguna dan kelola akses mereka.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
               <div>
                <label className="block text-sm font-medium mb-1">Nama *</label>
                <input
                  type="text"
                  name="name"
                  value={userData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={userData.username}
                  className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-600 dark:text-gray-300"
                  readOnly
                  disabled
                />
              </div>

               <div>
                <label className="block text-sm font-medium mb-1">Nomor Pegawai</label>
                <input
                  type="text"
                  name="employeeNumber"
                  value={userData.employeeNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Telepon</label>
                <input
                  type="tel"
                  name="phone"
                  value={userData.phone}
                  onChange={handleInputChange}
                  maxLength={13}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                />
              </div>

               <div>
                <label className="block text-sm font-medium mb-1">Alamat</label>
                <textarea
                  name="address"
                  value={userData.address}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Password Baru (Opsional)</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  placeholder="Isi untuk mengganti password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  placeholder="Ulangi password baru"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Peran Utama *</label>
                <select
                  name="role"
                  value={userData.role}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="MANAGER">Manager</option>
                  <option value="WAREHOUSE">Gudang</option>
                  <option value="ADMIN">Admin</option>
                  <option value="CASHIER">Kasir</option>
                  <option value="ATTENDANT">Pelayan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status Pengguna *</label>
                <select
                  name="status"
                  value={userData.status}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="AKTIF">Aktif</option>
                  <option value="TIDAK_AKTIF">Tidak Aktif</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border rounded"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <UserCog className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
