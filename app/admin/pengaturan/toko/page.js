'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useDarkMode } from '@/components/DarkModeContext';
import { useTheme } from '@/components/ThemeContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PengaturanTokoPage() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const { fetchSettings: fetchThemeSettings } = useTheme();

  const [settings, setSettings] = useState({
    shopName: '',
    address: '',
    phone: '',
    themeColor: '#3c8dbc',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchPageSettings() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/pengaturan');
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error(error);
        toast.error('Gagal memuat pengaturan.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchPageSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (e) => {
    setSettings((prev) => ({ ...prev, themeColor: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch('/api/pengaturan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      
      // Re-fetch settings for the whole app to apply theme and shop name changes
      await fetchThemeSettings();

      toast.success('Pengaturan berhasil disimpan!');

    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
    darkMode
      ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
      : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
  }`;

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}

          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={darkMode ? 'dark' : 'light'}
        />
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pengaturan Toko</h1>
            <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Kelola informasi toko dan tampilan aplikasi Anda.
            </p>
          </div>
          <Link href="/admin/pengaturan">
            <button className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>
              <ArrowLeft size={16} />
              Kembali
            </button>
          </Link>
        </div>

        {isLoading ? (
          <div className={`p-6 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Memuat pengaturan...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={`p-6 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="space-y-6">
              {/* Pengaturan Toko */}
              <div>
                <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Informasi Toko</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="shopName" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nama Toko
                    </label>
                    <input
                      type="text"
                      id="shopName"
                      name="shopName"
                      value={settings.shopName || ''}
                      onChange={handleInputChange}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      No. Telepon
                    </label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      value={settings.phone || ''}
                      onChange={handleInputChange}
                      className={inputClass}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="address" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Alamat
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      rows="3"
                      value={settings.address || ''}
                      onChange={handleInputChange}
                      className={inputClass}
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Pengaturan Tampilan */}
              <div>
                <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tampilan</h2>
                <div>
                  <label htmlFor="themeColor" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Warna Tema Utama
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="themeColor"
                      name="themeColor"
                      value={settings.themeColor || '#3c8dbc'}
                      onChange={handleColorChange}
                      className="w-12 h-10 p-1 border-none rounded-md cursor-pointer"
                    />
                    <span className={`px-3 py-2 rounded-md ${inputClass}`}>{settings.themeColor}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                style={{ backgroundColor: isSaving ? '' : settings.themeColor }}
                className="px-4 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </form>
        )}
      </main>
    </ProtectedRoute>
  );
}
