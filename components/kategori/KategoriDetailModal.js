// components/kategori/KategoriDetailModal.js
'use client';

import { X, Package, Info } from 'lucide-react';
import Tooltip from '../Tooltip';

export default function KategoriDetailModal({
  isOpen,
  onClose,
  category,
  darkMode,
}) {
  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen p-0 sm:items-center sm:p-4">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`relative inline-block align-bottom w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-0 sm:align-middle sm:max-w-md sm:w-full ${darkMode ? 'border-gray-700' : 'border-gray-200'} border`}>
          <div className="flex items-center justify-between p-3 sm:p-4">
            <h3 className={`text-sm leading-5 font-medium ${darkMode ? 'text-purple-400' : 'text-purple-800'}`} id="modal-title">
              Detail Kategori: {category.name}
            </h3>
            <button onClick={onClose} className={`p-1 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'} transition-colors`}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className={`px-3 pb-3 sm:px-4 sm:pb-4 ${darkMode ? 'bg-gray-800' : ''}`}>
            <div className="w-full">
              <div className="mt-1 w-full space-y-2.5 sm:space-y-3">
                {/* Category Information Section */}
                <div className="space-y-2.5">
                  {/* Category Info - Stacked vertically on all screen sizes for better mobile experience */}
                  <div className="space-y-2.5">
                    <div className="flex items-start space-x-2">
                      <Package className={`flex-shrink-0 h-3.5 w-3.5 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-[10px] font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nama Kategori</p>
                        <p className={`mt-0.5 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{category.name}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Info className={`flex-shrink-0 h-3.5 w-3.5 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-[10px] font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Deskripsi</p>
                        <p className={`mt-0.5 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{category.description || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Info className={`flex-shrink-0 h-3.5 w-3.5 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-[10px] font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Jumlah Produk</p>
                        <p className={`mt-0.5 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{category.productCount || 0}</p>
                      </div>
                    </div>

                    <div className="pt-1">
                      <p className={`text-[10px] font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Icon</p>
                      <p className={`mt-0.5 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{category.icon || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`px-3 py-2 sm:px-4 sm:flex sm:flex-row-reverse ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`mt-2 w-full inline-flex justify-center rounded-md border ${
                darkMode ? 'border-gray-600 bg-transparent hover:bg-gray-600 text-gray-300' : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
              } shadow-sm px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto`}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}