'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useSession } from 'next-auth/react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, storeName }) => {
  const { data: session } = useSession();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validasi password di sini akan tergantung pada implementasi backend Anda
    // Untuk saat ini, saya akan mengirim password ke fungsi onConfirm
    // dan membiarkan fungsi tersebut menangani verifikasi

    try {
      await onConfirm(password);
      setPassword('');
    } catch (err) {
      setError('Password salah atau terjadi kesalahan saat verifikasi');
      console.error('Error during delete confirmation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  // Handle ESC key press to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Konfirmasi Penghapusan Toko
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Peringatan Penting:</strong> Anda akan menghapus toko <strong>{storeName}</strong>.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  Tindakan ini akan menghapus <strong>secara permanen</strong> semua data yang terkait dengan toko ini termasuk:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 mt-2 list-disc pl-5 space-y-1">
                  <li>Semua produk, kategori, dan stok</li>
                  <li>Semua transaksi penjualan dan pembelian</li>
                  <li>Semua data pelanggan dan supplier</li>
                  <li>Semua data keuangan dan pengeluaran</li>
                  <li>Semua laporan dan riwayat aktivitas</li>
                </ul>
                <p className="text-sm text-red-600 dark:text-red-400 mt-3">
                  <strong>Data yang telah dihapus tidak dapat dipulihkan.</strong>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-4">
                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Masukkan password Anda untuk konfirmasi:
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Password Anda"
                    required
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg dark:bg-red-900/30 dark:text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? 'Menghapus...' : 'Ya, Hapus Toko'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;