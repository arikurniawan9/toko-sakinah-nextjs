'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ROLES } from '@/lib/constants';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useUserTheme } from '@/components/UserThemeContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AddUserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { userTheme } = useUserTheme();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userData, setUserData] = useState({
    name: '',
    username: '',
    employeeNumber: '',
    password: '',
    confirmPassword: '',
    storeId: '',
    role: 'CASHIER', // Default to CASHIER as before
    phone: '',
    address: ''
  });

  // Fetch stores
  useEffect(() => {
    if (status === 'loading') return;

    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
      router.push('/unauthorized');
      return;
    }

    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores');
        const data = await response.json();

        if (response.ok) {
          setStores(data.stores || []);
        } else {
          console.error('Error fetching stores:', data.error);
          toast.error('Gagal mengambil data toko');
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
        toast.error('Terjadi kesalahan saat mengambil data toko');
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [status, session, router]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi input
    if (!userData.name.trim()) {
      toast.error('Nama wajib diisi');
      return;
    }

    if (!userData.username.trim()) {
      toast.error('Username wajib diisi');
      return;
    }

    if (!userData.password) {
      toast.error('Password wajib diisi');
      return;
    }

    if (userData.password.length < 6) {
      toast.error('Password minimal harus 6 karakter');
      return;
    }

    if (userData.password !== userData.confirmPassword) {
      toast.error('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (!userData.storeId) {
      toast.error('Toko tujuan wajib dipilih');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/manager/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name.trim(),
          username: userData.username.trim(),
          employeeNumber: userData.employeeNumber.trim(),
          password: userData.password,
          role: userData.role,
          storeId: userData.storeId,
          phone: userData.phone.trim(),
          address: userData.address.trim()
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`User ${userData.name} berhasil ditambahkan ke toko!`);
        // Reset form
        setUserData({
          name: '',
          username: '',
          employeeNumber: '',
          password: '',
          confirmPassword: '',
          storeId: '',
          role: 'CASHIER',
          phone: '',
          address: ''
        });
        // Redirect to users list after a short delay
        setTimeout(() => {
          router.push('/manager/users');
        }, 1500);
      } else {
        toast.error(result.error || 'Gagal menambahkan user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Terjadi kesalahan saat menambahkan user');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hydration-safe loading and authentication checks
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8 ${userTheme.darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Kembali</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tambah Pengguna Baru</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Tambahkan pengguna baru ke dalam sistem dan tentukan toko serta perannya
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama *</label>
                <input
                  type="text"
                  name="name"
                  value={userData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  placeholder="Nama lengkap pengguna"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={userData.username}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  placeholder="Username untuk login"
                  required
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
                  placeholder="Nomor pegawai (opsional)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Telepon</label>
                <input
                  type="tel"
                  name="phone"
                  value={userData.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  placeholder="Nomor telepon (opsional)"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Alamat</label>
                <textarea
                  name="address"
                  value={userData.address}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  placeholder="Alamat pengguna (opsional)"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={userData.password}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  placeholder="Password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Konfirmasi Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={userData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  placeholder="Ulangi password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Toko *</label>
                <select
                  name="storeId"
                  value={userData.storeId}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Pilih Toko</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Peran *</label>
                <select
                  name="role"
                  value={userData.role}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="ADMIN">Admin</option>
                  <option value="CASHIER">Kasir</option>
                  <option value="ATTENDANT">Pelayan</option>
                  <option value="MANAGER">Manager</option>
                  <option value="WAREHOUSE">Gudang</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 dark:text-gray-300 dark:border-gray-600"
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
                  <UserPlus className="h-4 w-4 mr-2" />
                  Simpan Pengguna
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}