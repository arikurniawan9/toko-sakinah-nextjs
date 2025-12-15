// app/pelayan/profil/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { User, Mail, Phone, Building, Calendar, Key, Save, AlertCircle } from 'lucide-react';
import { useNotification } from '../../../components/notifications/NotificationProvider';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function PelayanProfil() {
  const { data: session, status, update } = useSession();
  const [userData, setUserData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    employeeNumber: '',
    createdAt: '',
    storeName: '',
    storeCode: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const { showNotification } = useNotification();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      loadUserData();
    }
  }, [status, session]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // Dalam kasus pelayan, kita hanya menggunakan session karena datanya terbatas
      setUserData({
        name: session.user.name || '',
        username: session.user.username || '',
        email: session.user.email || '',
        phone: session.user.phone || '',
        employeeNumber: session.user.employeeNumber || '',
        createdAt: session.user.createdAt ? new Date(session.user.createdAt).toLocaleDateString('id-ID') : '',
        storeName: session.user.storeAccess?.name || '',
        storeCode: session.user.storeAccess?.code || ''
      });
    } catch (error) {
      showNotification('Gagal memuat data profil', 'error');
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    if (!userData.name.trim()) {
      showNotification('Nama harus diisi', 'error');
      return;
    }

    setSaving(true);
    try {
      // Update hanya profil, tidak termasuk password
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          phone: userData.phone,
          email: userData.email,
        })
      });

      const result = await response.json();
      if (response.ok) {
        showNotification('Profil berhasil diperbarui', 'success');
        // Update session
        await update({
          ...session,
          user: {
            ...session.user,
            name: userData.name,
            phone: userData.phone,
            email: userData.email
          }
        });
      } else {
        showNotification(result.error || 'Gagal memperbarui profil', 'error');
      }
    } catch (error) {
      showNotification('Terjadi kesalahan saat memperbarui profil', 'error');
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('Password baru dan konfirmasi password tidak cocok', 'error');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showNotification('Password baru harus minimal 6 karakter', 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const result = await response.json();
      if (response.ok) {
        showNotification('Password berhasil diperbarui', 'success');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showNotification(result.error || 'Gagal mengganti password', 'error');
      }
    } catch (error) {
      showNotification('Terjadi kesalahan saat mengganti password', 'error');
      console.error('Error updating password:', error);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return <LoadingSpinner />;
  }

  if (!session?.user) {
    return <div>Unauthorized</div>;
  }

  return (
    <ProtectedRoute requiredRole="ATTENDANT">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-6 text-center text-sm font-medium ${
                  activeTab === 'profile'
                    ? 'text-pastel-purple-600 border-b-2 border-pastel-purple-600 dark:text-pastel-purple-400 dark:border-pastel-purple-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Profil Saya
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`py-4 px-6 text-center text-sm font-medium ${
                  activeTab === 'password'
                    ? 'text-pastel-purple-600 border-b-2 border-pastel-purple-600 dark:text-pastel-purple-400 dark:border-pastel-purple-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Ganti Password
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <form onSubmit={updateProfile} className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Informasi Profil</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <User className="h-4 w-4 inline mr-2" />
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={userData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-pastel-purple-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <User className="h-4 w-4 inline mr-2" />
                        Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={userData.username}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Mail className="h-4 w-4 inline mr-2" />
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={userData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-pastel-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Phone className="h-4 w-4 inline mr-2" />
                        Telepon
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={userData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-pastel-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <User className="h-4 w-4 inline mr-2" />
                        Kode Karyawan
                      </label>
                      <input
                        type="text"
                        name="employeeNumber"
                        value={userData.employeeNumber}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Calendar className="h-4 w-4 inline mr-2" />
                        Tanggal Bergabung
                      </label>
                      <input
                        type="text"
                        value={userData.createdAt}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Building className="h-4 w-4 inline mr-2" />
                        Toko Terdaftar
                      </label>
                      <input
                        type="text"
                        value={`${userData.storeName} (${userData.storeCode})`}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pastel-purple-600 hover:bg-pastel-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-purple-500 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <AlertCircle className="h-4 w-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
            
            {activeTab === 'password' && (
              <form onSubmit={updatePassword} className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Ganti Password</h2>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Key className="h-4 w-4 inline mr-2" />
                        Password Saat Ini
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-pastel-purple-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Key className="h-4 w-4 inline mr-2" />
                        Password Baru
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-pastel-purple-500"
                        required
                        minLength={6}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Key className="h-4 w-4 inline mr-2" />
                        Konfirmasi Password Baru
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-pastel-purple-500"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pastel-purple-600 hover:bg-pastel-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-purple-500 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <AlertCircle className="h-4 w-4 mr-2 animate-spin" />
                        Mengganti...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Ganti Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}