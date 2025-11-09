'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import Sidebar from '../../../../components/Sidebar';
import { useDarkMode } from '../../../../components/DarkModeContext';

export default function PengaturanToko() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    namaToko: 'Toko Sakinah',
    alamatToko: 'Jl. Contoh Alamat Toko No. 123',
    nomorTelepon: '(021) 12345678',
    emailToko: 'tokosakinah@example.com',
    deskripsiToko: 'Toko kebutuhan sehari-hari yang menyediakan berbagai macam barang',
    jamOperasional: '08:00 - 21:00',
    kebijakanRetur: 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan',
    informasiTambahan: 'Kami memberikan pelayanan terbaik untuk pelanggan setia kami',
    logoToko: null,
    warnaTema: '#6366f1', // Default purple
    kota: 'Jakarta',
    kodePos: '12345'
  });

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        // In a real application, you would fetch the current settings from an API
        // For now, we use the default values
        setFormData({
          namaToko: 'Toko Sakinah',
          alamatToko: 'Jl. Contoh Alamat Toko No. 123',
          nomorTelepon: '(021) 12345678',
          emailToko: 'tokosakinah@example.com',
          deskripsiToko: 'Toko kebutuhan sehari-hari yang menyediakan berbagai macam barang',
          jamOperasional: '08:00 - 21:00',
          kebijakanRetur: 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan',
          informasiTambahan: 'Kami memberikan pelayanan terbaik untuk pelanggan setia kami',
          logoToko: null,
          warnaTema: '#6366f1',
          kota: 'Jakarta',
          kodePos: '12345'
        });
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Gagal memuat pengaturan toko');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        logoToko: file
      }));
    }
  };

  const handleColorChange = (e) => {
    setFormData(prev => ({
      ...prev,
      warnaTema: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      // In a real application, you would send the data to an API
      // For now, we just simulate the save process
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Pengaturan toko berhasil disimpan!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Gagal menyimpan pengaturan toko');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <Sidebar>
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pengaturan Toko</h1>
            <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Atur informasi dan pengaturan toko Anda
            </p>
          </div>

          {success && (
            <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'} border`}>
              <p className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-700'}`}>{success}</p>
            </div>
          )}

          {error && (
            <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'} border`}>
              <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
            </div>
          )}

          <div className={`rounded-xl shadow ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border overflow-hidden`}>
            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nama Toko */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nama Toko
                    </label>
                    <input
                      type="text"
                      name="namaToko"
                      value={formData.namaToko}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pastel-purple-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      required
                    />
                  </div>

                  {/* Kota */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Kota
                    </label>
                    <input
                      type="text"
                      name="kota"
                      value={formData.kota}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pastel-purple-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* Kode Pos */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Kode Pos
                    </label>
                    <input
                      type="text"
                      name="kodePos"
                      value={formData.kodePos}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pastel-purple-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* Alamat Toko */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Alamat Toko
                    </label>
                    <textarea
                      name="alamatToko"
                      value={formData.alamatToko}
                      onChange={handleChange}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pastel-purple-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      required
                    />
                  </div>

                  {/* Nomor Telepon */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nomor Telepon
                    </label>
                    <input
                      type="tel"
                      name="nomorTelepon"
                      value={formData.nomorTelepon}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pastel-purple-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* Email Toko */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email Toko
                    </label>
                    <input
                      type="email"
                      name="emailToko"
                      value={formData.emailToko}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pastel-purple-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* Jam Operasional */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Jam Operasional
                    </label>
                    <input
                      type="text"
                      name="jamOperasional"
                      value={formData.jamOperasional}
                      onChange={handleChange}
                      placeholder="Contoh: 08:00 - 21:00"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pastel-purple-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* Warna Tema */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Warna Tema
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={formData.warnaTema}
                        onChange={handleColorChange}
                        className="w-10 h-10 border-0 rounded cursor-pointer"
                      />
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formData.warnaTema}
                      </span>
                    </div>
                  </div>

                  {/* Logo Toko */}
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Logo Toko
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`h-16 w-16 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Logo
                          </span>
                        </div>
                      </div>
                      <label className="cursor-pointer">
                        <span className={`px-4 py-2 rounded-lg border border-dashed ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' 
                            : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}>
                          Pilih Gambar
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Deskripsi Toko */}
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Deskripsi Toko
                    </label>
                    <textarea
                      name="deskripsiToko"
                      value={formData.deskripsiToko}
                      onChange={handleChange}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pastel-purple-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* Kebijakan Retur */}
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Kebijakan Retur
                    </label>
                    <textarea
                      name="kebijakanRetur"
                      value={formData.kebijakanRetur}
                      onChange={handleChange}
                      rows={2}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pastel-purple-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* Informasi Tambahan */}
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Informasi Tambahan
                    </label>
                    <textarea
                      name="informasiTambahan"
                      value={formData.informasiTambahan}
                      onChange={handleChange}
                      rows={2}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pastel-purple-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-6 py-2 rounded-lg font-medium ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : `bg-pastel-purple-600 hover:bg-pastel-purple-700 text-white`
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-purple-500`}
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </Sidebar>
    </ProtectedRoute>
  );
}