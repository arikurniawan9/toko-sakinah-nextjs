// components/kategori/CashierCategoryDetailModal.js
'use client';

import { X } from 'lucide-react';

const CashierCategoryDetailModal = ({
  isOpen,
  onClose,
  category,
  darkMode
}) => {
  if (!isOpen || !category) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      <div className={`relative w-full max-w-md rounded-xl shadow-lg transform transition-all ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Detail Kategori
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'} transition-colors`}
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className={`p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nama</label>
              <p className={`mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{category.name}</p>
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Deskripsi</label>
              <p className={`mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {category.description || '-'}
              </p>
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Jumlah Produk</label>
              <p className={`mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {category._count?.products || 0}
              </p>
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Dibuat Pada</label>
              <p className={`mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {new Date(category.createdAt).toLocaleDateString('id-ID')}
              </p>
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Diperbarui Pada</label>
              <p className={`mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {new Date(category.updatedAt).toLocaleDateString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-md ${
                darkMode 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              } transition-colors`}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierCategoryDetailModal;