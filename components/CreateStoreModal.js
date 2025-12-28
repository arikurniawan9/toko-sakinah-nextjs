'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

const CreateStoreModal = ({ isOpen, onClose, onStoreCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    status: 'ACTIVE'
  });
  const [adminData, setAdminData] = useState({
    name: '',
    username: '',
    employeeNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi password
    if (adminData.password !== adminData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store: formData,
          admin: adminData
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Reset form
        setFormData({
          name: '',
          code: '',
          description: '',
          address: '',
          phone: '',
          email: '',
          status: 'ACTIVE'
        });
        setAdminData({
          name: '',
          username: '',
          employeeNumber: '',
          password: '',
          confirmPassword: ''
        });
        
        // Panggil callback untuk refresh data
        if (onStoreCreated) {
          onStoreCreated();
        }
        
        onClose();
      } else {
        setError(result.error || 'Gagal membuat toko');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat membuat toko');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdminData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tambah Toko Baru</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Informasi Toko */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Nama Toko *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Kode Toko
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Opsional"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Deskripsi
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                ></textarea>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Alamat *
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                ></textarea>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Telepon
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Tidak Aktif</option>
                  <option value="SUSPENDED">Ditangguhkan</option>
                </select>
              </div>
            </div>

            {/* Informasi Admin */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                <h3 className="text-md font-medium mb-4 text-gray-900 dark:text-white">
                  Informasi Akun Admin
                </h3>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="adminName" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Nama Lengkap Admin *
                    </label>
                    <input
                      type="text"
                      id="adminName"
                      name="name"
                      value={adminData.name}
                      onChange={handleAdminChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Username *
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={adminData.username}
                      onChange={handleAdminChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="employeeNumber" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Kode Pegawai
                    </label>
                    <input
                      type="text"
                      id="employeeNumber"
                      name="employeeNumber"
                      value={adminData.employeeNumber}
                      onChange={handleAdminChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      placeholder="Opsional"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Password *
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={adminData.password}
                      onChange={handleAdminChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Konfirmasi Password *
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={adminData.confirmPassword}
                      onChange={handleAdminChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Membuat Toko...' : 'Buat Toko'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStoreModal;