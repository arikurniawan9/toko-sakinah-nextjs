import React, { useEffect } from 'react';
import { Save, X } from 'lucide-react';

const CategoryModal = ({
  showModal,
  closeModal,
  editingCategory,
  formData,
  handleInputChange,
  handleSave,
  error,
  setFormError,
  darkMode,
}) => {
  // Handle ESC key press to close modal
  useEffect(() => {
    if (!showModal) return;

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showModal, closeModal]);

  if (!showModal) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
          </h3>
          <button 
            onClick={closeModal} 
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-800 bg-red-100 dark:bg-red-500/10 dark:text-red-400 rounded-lg">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nama Kategori
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                onFocus={() => setFormError('')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-theme-purple-500 transition-colors"
                placeholder="e.g., Pakaian Pria"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Deskripsi (Opsional)
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-theme-purple-500 transition-colors"
                placeholder="e.g., Kumpulan semua pakaian untuk pria dewasa"
              ></textarea>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-theme-purple-600 hover:bg-theme-purple-700 rounded-lg shadow-sm transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{editingCategory ? 'Simpan Perubahan' : 'Simpan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
