// components/kasir/transaksi/SuspendSaleModal.js
'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

const SuspendSaleModal = ({ isOpen, onClose, onConfirm, darkMode, isLoading }) => {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (!name) {
      alert('Nama penjualan harus diisi.');
      return;
    }
    onConfirm({ name, notes });
  };

  if (!isOpen) return null;

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl flex flex-col ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="text-xl font-semibold">Tangguhkan Penjualan</h3>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Simpan transaksi ini untuk dilanjutkan nanti.</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="suspend-name" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Nama Penjualan <span className="text-red-500">*</span>
            </label>
            <input
              id="suspend-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Pesanan Budi"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300'
              }`}
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="suspend-notes" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Catatan (Opsional)
            </label>
            <textarea
              id="suspend-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              placeholder="Contoh: Minta diambil jam 5 sore"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300'
              }`}
            />
          </div>
        </div>
        <div className={`flex justify-end space-x-3 p-4 border-t ${darkMode ? 'border-gray-700' : 'bg-gray-50'}`}>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`py-2 px-4 rounded-md text-sm font-medium ${
              darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
            } disabled:opacity-50`}
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !name}
            className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Tangguhkan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuspendSaleModal;
