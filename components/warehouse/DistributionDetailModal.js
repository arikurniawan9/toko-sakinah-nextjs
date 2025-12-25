'use client';

import { useEffect } from 'react';
import { X, Package, Eye } from 'lucide-react';

const DistributionDetailModal = ({ isOpen, onClose, distribution }) => {
  // Handle ESC key press to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !distribution) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get all items for this distribution
  const items = distribution.items || [distribution];
  
  // Calculate totals
  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100] print:flex print:items-center print:justify-center print:inset-0 print:bg-white">
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-blue-500 mr-3" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Detail Distribusi
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Distribution Info */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">No. Distribusi</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {distribution.invoiceNumber || distribution.id}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tanggal</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatDate(distribution.distributedAt || distribution.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Toko Tujuan</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {distribution.store?.name || distribution.storeName || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pengirim</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {distribution.distributedByUser?.name || distribution.distributedByName || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {distribution.status === 'PENDING_ACCEPTANCE' ? 'Menunggu Konfirmasi' :
                 distribution.status === 'ACCEPTED' ? 'Diterima' :
                 distribution.status === 'REJECTED' ? 'Ditolak' : distribution.status}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Barang</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {totalItems.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daftar Produk</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 dark:border-gray-700 rounded-lg">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">No</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Kode Produk</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Nama Produk</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Jumlah</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Harga Satuan</th>
                    <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{index + 1}</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {item.product?.productCode || item.productCode || 'N/A'}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {item.product?.name || item.productName || item.name || 'Produk Tidak Dikenal'}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                        {(item.quantity || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                        Rp {(item.unitPrice || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                        Rp {((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900 dark:text-white">Total Harga:</span>
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Notes */}
          {distribution.notes && (
            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Catatan:</h4>
              <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                {distribution.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default DistributionDetailModal;