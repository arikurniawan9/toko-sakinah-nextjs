// components/admin/ShopSettings.js
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const ShopSettings = () => {
  const [settings, setSettings] = useState({
    shopName: '',
    address: '',
    phone: '',
    themeColor: '#3c8dbc',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/setting');
      if (response.ok) {
        const data = await response.json();
        setSettings({
          shopName: data.shopName || '',
          address: data.address || '',
          phone: data.phone || '',
          themeColor: data.themeColor || '#3c8dbc',
        });
      } else if (response.status === 401) {
        // Jika unauthorized, mungkin user tidak memiliki akses ke toko tertentu
        toast.error('Anda tidak memiliki akses ke pengaturan toko ini');
        // Gunakan default values
        setSettings({
          shopName: '',
          address: '',
          phone: '',
          themeColor: '#3c8dbc',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Gagal mengambil pengaturan toko');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/setting', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Pengaturan toko berhasil diperbarui');
      } else if (response.status === 401) {
        toast.error('Anda tidak memiliki izin untuk memperbarui pengaturan toko ini');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal memperbarui pengaturan');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Gagal memperbarui pengaturan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Pengaturan Toko</h2>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="mb-4">
          <label htmlFor="shopName" className="block text-sm font-medium mb-2">
            Nama Toko
          </label>
          <input
            type="text"
            id="shopName"
            value={settings.shopName}
            onChange={(e) => setSettings({...settings, shopName: e.target.value})}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Nama toko Anda"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="address" className="block text-sm font-medium mb-2">
            Alamat Toko
          </label>
          <textarea
            id="address"
            value={settings.address}
            onChange={(e) => setSettings({...settings, address: e.target.value})}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Alamat toko Anda"
            rows="3"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="phone" className="block text-sm font-medium mb-2">
            Nomor Telepon
          </label>
          <input
            type="text"
            id="phone"
            value={settings.phone}
            onChange={(e) => setSettings({...settings, phone: e.target.value})}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Nomor telepon toko Anda"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="themeColor" className="block text-sm font-medium mb-2">
            Warna Tema
          </label>
          <div className="flex items-center">
            <input
              type="color"
              id="themeColor"
              value={settings.themeColor}
              onChange={(e) => setSettings({...settings, themeColor: e.target.value})}
              className="w-12 h-10 border rounded cursor-pointer"
            />
            <span className="ml-3">{settings.themeColor}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </form>
    </div>
  );
};

export default ShopSettings;