'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserTheme } from '../../../components/UserThemeContext';
import { useTheme } from '@/components/ThemeContext';
import { Settings, Store, Shield, Cog, Upload, Download, Trash2, Loader2 } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import ConfirmationModal from '@/components/ConfirmationModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function PengaturanIndex() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const { themeColor } = useTheme();

  const [activeTab, setActiveTab] = useState('toko'); // Default to 'toko' tab

  // Import komponen langsung di sini
  const TokoSettings = () => {
    const [settings, setSettings] = useState({ shopName: '', address: '', phone: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      const fetchSettings = async () => {
        setLoading(true);
        try {
          const response = await fetch('/api/pengaturan');
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Gagal mengambil pengaturan');
          }
          setSettings(data);
        } catch (error) {
          toast.error(error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchSettings();
    }, []);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
      setSaving(true);
      try {
        const response = await fetch('/api/pengaturan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Gagal menyimpan pengaturan');
        }
        toast.success('Pengaturan berhasil disimpan!');
        // Optionally refresh theme context if needed
        window.location.reload(); // Simple way to refresh all contexts
      } catch (error) {
        toast.error(error.message);
      } finally {
        setSaving(false);
      }
    };
    
    if (loading) {
      return (
        <div className="flex justify-center items-center p-6">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      );
    }

    return (
      <div className={`p-6 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pengaturan Toko</h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nama Toko</label>
            <input
              type="text"
              name="shopName"
              value={settings.shopName || ''}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              placeholder="Nama toko Anda"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Alamat</label>
            <textarea
              rows="3"
              name="address"
              value={settings.address || ''}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              placeholder="Alamat toko Anda"
            ></textarea>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Telepon</label>
            <input
              type="text"
              name="phone"
              value={settings.phone || ''}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              placeholder="Nomor telepon toko"
            />
          </div>
          <button onClick={handleSave} disabled={saving} className={`flex items-center justify-center px-4 py-2 rounded-md text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:bg-blue-400`}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan Toko'}
          </button>
        </div>
      </div>
    );
  };

  const SistemSettings = () => {
    const [loading, setLoading] = useState({
      backup: false,
      import: false,
      clear: false,
    });
    const [importFile, setImportFile] = useState(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [clearConfirmText, setClearConfirmText] = useState('');

    const handleBackup = async () => {
      setLoading(prev => ({ ...prev, backup: true }));
      toast.info('Memulai proses backup database...');
      try {
        const response = await fetch('/api/database/backup', {
          method: 'POST',
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.details || 'Backup gagal');
        }

        toast.success('Backup database berhasil dibuat. Mengunduh file...');

        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = `/api/database/download?file=${result.fileName}`;
        link.setAttribute('download', result.fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

      } catch (error) {
        toast.error(`Terjadi kesalahan: ${error.message}`);
      } finally {
        setLoading(prev => ({ ...prev, backup: false }));
      }
    };

    const handleImport = async (e) => {
      e.preventDefault();
      if (!importFile) {
        toast.error('Silakan pilih file untuk diimpor.');
        return;
      }
      setLoading(prev => ({ ...prev, import: true }));
      toast.info('Memulai proses import database...');

      const formData = new FormData();
      formData.append('file', importFile);

      try {
        const response = await fetch('/api/database/import', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.details || 'Import gagal');
        }

        toast.success('Import database berhasil.');
      } catch (error) {
        toast.error(`Terjadi kesalahan: ${error.message}`);
      } finally {
        setLoading(prev => ({ ...prev, import: false }));
        setImportFile(null);
        // Reset the file input
        e.target.reset();
      }
    };

    const handleClearDatabase = async () => {
        setShowClearConfirm(false);
        if (clearConfirmText.toLowerCase() !== 'hapus data') {
            toast.error('Teks konfirmasi tidak cocok.');
            return;
        }

        setLoading(prev => ({ ...prev, clear: true }));
        toast.info('Memulai proses pembersihan data...');

        try {
            const response = await fetch('/api/database/clear', {
                method: 'DELETE',
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.details || 'Pembersihan data gagal');
            }

            toast.success('Pembersihan data aplikasi berhasil.');
        } catch (error) {
            toast.error(`Terjadi kesalahan: ${error.message}`);
        } finally {
            setLoading(prev => ({ ...prev, clear: false }));
            setClearConfirmText('');
        }
    };


    return (
      <>
        <div className={`p-6 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Manajemen Database</h3>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
            Kelola backup, import, dan pembersihan data. Gunakan dengan hati-hati.
          </p>

          <div className="space-y-6">
            {/* Backup Section */}
            <div className={`p-4 border rounded-lg ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Backup Database</h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Buat salinan cadangan dari seluruh database Anda.
                  </p>
                </div>
                <button
                  onClick={handleBackup}
                  disabled={loading.backup}
                  className={`flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed`}
                >
                  {loading.backup ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {loading.backup ? 'Memproses...' : 'Backup Sekarang'}
                </button>
              </div>
            </div>

            {/* Import Section */}
            <div className={`p-4 border rounded-lg ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <form onSubmit={handleImport}>
                <h4 className={`font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Import Database</h4>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Pulihkan database dari file backup. Ini akan menimpa data yang ada.
                </p>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept=".sql,.backup"
                    onChange={(e) => setImportFile(e.target.files[0])}
                    className={`flex-grow text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                ${darkMode ? 'file:bg-gray-600 file:text-gray-200 hover:file:bg-gray-500' : 'file:bg-gray-100 file:text-gray-800 hover:file:bg-gray-200'}`}
                  />
                  <button
                    type="submit"
                    disabled={loading.import || !importFile}
                    className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
                  >
                    {loading.import ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {loading.import ? 'Mengimpor...' : 'Import'}
                  </button>
                </div>
              </form>
            </div>

            {/* Clear Data Section */}
            <div className={`p-4 border border-red-500/50 rounded-lg ${darkMode ? 'bg-red-900/10' : 'bg-red-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-medium text-red-600 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Hapus Data Aplikasi</h4>
                  <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-500'}`}>
                    Tindakan ini akan menghapus semua data (produk, transaksi, dll) secara permanen.
                  </p>
                </div>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  disabled={loading.clear}
                  className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed"
                >
                  {loading.clear ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  {loading.clear ? 'Menghapus...' : 'Hapus Data'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <ConfirmationModal
            isOpen={showClearConfirm}
            onClose={() => setShowClearConfirm(false)}
            onConfirm={handleClearDatabase}
            title="Konfirmasi Hapus Data"
            confirmText="Ya, Hapus Semua Data"
            confirmButtonColor="bg-red-600 hover:bg-red-700"
            disabled={clearConfirmText.toLowerCase() !== 'hapus data'}
        >
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Ini adalah tindakan yang sangat berbahaya dan tidak dapat diurungkan. Semua data seperti produk, kategori, transaksi, dan lainnya akan hilang.
            </p>
            <p className={`mt-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Untuk melanjutkan, ketik <strong className="text-red-500">hapus data</strong> di bawah ini.
            </p>
            <input
                type="text"
                value={clearConfirmText}
                onChange={(e) => setClearConfirmText(e.target.value)}
                className={`w-full px-3 py-2 mt-2 border rounded-md ${
                darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
            />
        </ConfirmationModal>
        
        <ToastContainer
          position="bottom-right"
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
      </>
    );
  };

  const KeamananSettings = () => (
    <div className={`p-6 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pengaturan Keamanan</h3>
      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fitur pengaturan keamanan akan segera tersedia.</p>

      <div className="mt-4 space-y-4">
        <div className="p-4 border rounded-lg">
          <h4 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Password</h4>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ubah password akun Anda</p>
          <button className="mt-2 px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300">
            Ganti Password
          </button>
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Akses</h4>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Atur izin akses pengguna</p>
          <button className="mt-2 px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300">
            Atur Akses
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[{ title: 'Pengaturan', href: '/admin/pengaturan' }]}
          darkMode={darkMode}
        />

        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pengaturan</h1>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Kelola pengaturan sistem dan toko Anda
          </p>
        </div>

        {/* Tab Navigation */}
        <div className={`mb-6 rounded-lg p-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('toko')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                activeTab === 'toko'
                  ? `${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} shadow`
                  : `${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Store className="w-4 h-4" />
                <span>Pengaturan Toko</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('sistem')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                activeTab === 'sistem'
                  ? `${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} shadow`
                  : `${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Cog className="w-4 h-4" />
                <span>Pengaturan Sistem</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('keamanan')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                activeTab === 'keamanan'
                  ? `${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} shadow`
                  : `${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Keamanan</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'toko' && <TokoSettings />}
          {activeTab === 'sistem' && <SistemSettings />}
          {activeTab === 'keamanan' && <KeamananSettings />}
        </div>
      </main>
    </ProtectedRoute>
  );
}