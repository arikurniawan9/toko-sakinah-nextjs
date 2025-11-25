'use client';

import { X } from 'lucide-react';

export default function DuplicateSupplierConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onCancel, 
  duplicateSuppliers, 
  darkMode, 
  loading = false 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className={`relative w-full max-w-md rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Konfirmasi Data Duplikat</h3>
          <button
            onClick={onCancel}
            disabled={loading}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Ditemukan {duplicateSuppliers.length} supplier yang sudah ada dalam sistem. Apakah Anda ingin memperbarui data tersebut?
          </p>
          
          <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <ul className="space-y-2">
              {duplicateSuppliers.map((supplier) => (
                <li key={supplier.id} className="text-sm text-gray-900 dark:text-gray-200">
                  {supplier.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Lanjutkan Import'}
          </button>
        </div>
      </div>
    </div>
  );
}