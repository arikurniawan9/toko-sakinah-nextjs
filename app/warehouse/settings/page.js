'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useUserTheme } from '../../../components/UserThemeContext';
import { useSession } from 'next-auth/react';
import Breadcrumb from '../../../components/Breadcrumb';
import { Package, Save, AlertTriangle, CheckCircle } from 'lucide-react';

export default function WarehouseSettingsPage() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
  });

  // Fetch warehouse data when component mounts
  useEffect(() => {
    fetchWarehouseData();
  }, []);

  const fetchWarehouseData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/warehouse');
      
      if (!response.ok) {
        throw new Error('Gagal memuat data gudang');
      }
      
      const data = await response.json();
      
      if (data.warehouses && data.warehouses.length > 0) {
        const warehouseData = data.warehouses[0]; // Assume single warehouse
        setWarehouse(warehouseData);
        setFormData({
          name: warehouseData.name || '',
          description: warehouseData.description || '',
          address: warehouseData.address || '',
          phone: warehouseData.phone || '',
        });
      } else {
        // Create default warehouse if doesn't exist
        const newWarehouse = {
          id: 'default-warehouse-id',
          name: 'Gudang Pusat',
          description: 'Gudang utama untuk menyimpan produk',
          address: '',
          phone: '',
        };
        setWarehouse(newWarehouse);
        setFormData({
          name: newWarehouse.name,
          description: newWarehouse.description,
          address: newWarehouse.address,
          phone: newWarehouse.phone,
        });
      }
    } catch (error) {
      console.error('Error fetching warehouse data:', error);
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000); // Hide notification after 3 seconds
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showNotification('Nama gudang wajib diisi', 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/warehouse', {
        method: warehouse?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: warehouse?.id // Include ID for update operations
        })
      });

      const result = await response.json();

      if (response.ok) {
        showNotification('Pengaturan gudang berhasil disimpan', 'success');
        // Refresh warehouse data
        fetchWarehouseData();
      } else {
        throw new Error(result.error || 'Gagal menyimpan pengaturan gudang');
      }
    } catch (error) {
      console.error('Error saving warehouse settings:', error);
      showNotification(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="WAREHOUSE">
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb
            items={[
              { title: 'Dashboard Gudang', href: '/warehouse' },
              { title: 'Pengaturan', href: '/warehouse/settings' }
            ]}
            darkMode={darkMode}
          />
          
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="WAREHOUSE">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[
            { title: 'Dashboard Gudang', href: '/warehouse' },
            { title: 'Pengaturan', href: '/warehouse/settings' }
          ]}
          darkMode={darkMode}
        />

        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Pengaturan Gudang
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Kelola informasi dan pengaturan gudang pusat
          </p>
        </div>

        <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Nama Gudang *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Nama gudang"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Nomor Telepon
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                maxLength={13}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Nomor telepon gudang"
              />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Alamat
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="3"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Alamat lengkap gudang"
              />
            </div>

            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Deskripsi
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="Deskripsi gudang"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center px-6 py-3 rounded-lg font-medium ${
                saving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Simpan Pengaturan
                </>
              )}
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification.show && (
          <div
            className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center ${
              notification.type === 'error' 
                ? 'bg-red-500/10 text-red-400' 
                : notification.type === 'success'
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-blue-500/10 text-blue-400'
            }`}
          >
            <div className="mr-3">
              {notification.type === 'error' ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
            </div>
            <span>{notification.message}</span>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}