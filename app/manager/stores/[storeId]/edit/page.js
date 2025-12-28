'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserTheme } from '@/components/UserThemeContext';
import { ROLES } from '@/lib/constants';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function EditStorePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    status: 'ACTIVE', // Default status
  });

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await fetch(`/api/stores/${params.storeId}`);
        const data = await response.json();
        
        if (response.ok) {
          setFormData({
            name: data.store.name,
            description: data.store.description || '',
            address: data.store.address || '',
            phone: data.store.phone || '',
            email: data.store.email || '',
            status: data.store.status,
          });
        } else {
          toast.error(data.error || 'Gagal mengambil data toko');
          router.push('/manager/stores');
        }
      } catch (error) {
        console.error('Error fetching store:', error);
        toast.error('Terjadi kesalahan saat mengambil data toko');
        router.push('/manager/stores');
      } finally {
        setLoading(false);
      }
    };

    if (params.storeId) {
      fetchStore();
    }
  }, [params.storeId, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/stores/${params.storeId}`, {
        method: 'PUT', // Assuming API supports PUT for updates
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Toko berhasil diperbarui!');
        // Redirect to store detail page after a short delay
        setTimeout(() => {
          router.push(`/manager/stores/${params.storeId}`);
        }, 1500);
      } else {
        toast.error(result.error || 'Gagal memperbarui toko');
      }
    } catch (error) {
      console.error('Error updating store:', error);
      toast.error('Terjadi kesalahan saat memperbarui toko');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="MANAGER">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const inputClass = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
    darkMode
      ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500'
      : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
  }`;

  return (
    <ProtectedRoute requiredRole="MANAGER">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit Toko</h1>
            <button
              onClick={() => router.push(`/manager/stores/${params.storeId}`)}
              className={`px-4 py-2 rounded-md ${
                darkMode 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Batal
            </button>
          </div>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Perbarui informasi toko {formData.name}
          </p>
        </div>

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Nama Toko *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className={inputClass}
                placeholder="Nama toko"
              />
            </div>

            <div>
              <label htmlFor="description" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Deskripsi
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className={inputClass}
                placeholder="Deskripsi toko (opsional)"
              ></textarea>
            </div>

            <div>
              <label htmlFor="address" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Alamat
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="2"
                className={inputClass}
                placeholder="Alamat toko (opsional)"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  No. Telepon
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  maxLength={13}
                  className={inputClass}
                  placeholder="Nomor telepon (opsional)"
                />
              </div>
              
              <div>
                <label htmlFor="email" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="Email toko (opsional)"
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={inputClass}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.push(`/manager/stores/${params.storeId}`)}
                className={`px-4 py-2 rounded-md border ${
                  darkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-md text-white ${
                  isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } flex items-center`}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Menyimpan...</span>
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}