// app/kasir/profile/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import { useDarkMode } from '@/components/DarkModeContext';
import { User, Lock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function CashierProfile() {
  const { data: session, update: updateSession } = useSession();
  const { darkMode } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '', // Display only, not editable
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || '',
      }));
    }
  }, [session]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Kata sandi dan konfirmasi kata sandi tidak cocok.');
      setLoading(false);
      return;
    }

    try {
      const payload = { name: formData.name };
      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Profil berhasil diperbarui!');
        if (session?.user?.name !== formData.name) {
          await updateSession({ user: { name: formData.name } });
        }
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Gagal memperbarui profil.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Terjadi kesalahan saat memperbarui profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="CASHIER">
      <Sidebar>
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Profil Saya</h1>
              <p className={`mt-1 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Perbarui informasi profil dan kata sandi Anda.</p>
            </div>

            {/* Form Card */}
            <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} border overflow-hidden`}>
              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-6">
                  {/* Success/Error Messages */}
                  {success && (
                    <div className="flex items-center p-4 rounded-lg bg-green-500/10 text-green-400">
                      <CheckCircle className="h-5 w-5 mr-3" />
                      <p className="text-sm font-medium">{success}</p>
                    </div>
                  )}
                  {error && (
                    <div className="flex items-center p-4 rounded-lg bg-red-500/10 text-red-400">
                      <AlertTriangle className="h-5 w-5 mr-3" />
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  )}

                  {/* Nama */}
                  <div>
                    <label htmlFor="name" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nama
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      required
                    />
                  </div>
  
                  {/* Email (Read-only) */}
                  <div>
                    <label htmlFor="email" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email (tidak dapat diubah)
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      readOnly
                      className={`w-full px-4 py-2 border rounded-lg cursor-not-allowed ${
                        darkMode 
                          ? 'bg-gray-900 border-gray-700 text-gray-400' 
                          : 'bg-gray-100 border-gray-300 text-gray-500'
                      }`}
                    />
                  </div>
  
                  <hr className={darkMode ? 'border-gray-700' : 'border-gray-200'} />

                  {/* Kata Sandi Baru */}
                  <div>
                    <label htmlFor="password" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Kata Sandi Baru (kosongkan jika tidak ingin mengubah)
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
  
                  {/* Konfirmasi Kata Sandi */}
                  <div>
                    <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>
  
                {/* Footer */}
                <div className={`px-6 py-4 ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'} border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end`}>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`inline-flex items-center justify-center px-6 py-2 rounded-lg font-semibold text-white transition-colors ${
                      loading
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 ${darkMode ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'} focus:ring-purple-500`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </Sidebar>
    </ProtectedRoute>
  );
}