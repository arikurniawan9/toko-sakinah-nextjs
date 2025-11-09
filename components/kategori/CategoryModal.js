import React from 'react';
import Tooltip from '../Tooltip';
import { Save, X } from 'lucide-react';

const CategoryModal = ({
  showModal,
  closeModal,
  editingCategory,
  formData,
  handleInputChange,
  handleSave,
  darkMode,
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen sm:p-0 p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={closeModal}>
          <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`relative inline-block align-bottom ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } rounded-lg sm:rounded-none text-left overflow-hidden shadow-xl transform transition-all sm:my-0 sm:h-full sm:align-middle sm:max-w-lg md:max-w-3xl sm:w-full ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        } border`}>
          <button onClick={closeModal} className={`absolute top-0 right-0 mt-4 mr-4 p-1 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'} transition-colors z-10`}>
            <X className="h-6 w-6" />
          </button>
          <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${
            darkMode ? 'bg-gray-800' : ''
          }`}>
            <div className="w-full">
              <h3 className={`text-lg leading-6 font-medium ${
                darkMode ? 'text-purple-400' : 'text-purple-800'
              }`} id="modal-title">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <div className="mt-4 w-full">
                  <div className="mb-4">
                    <label htmlFor="name" className={`block text-sm font-medium ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    } mb-1`}>
                      Nama Kategori *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                      placeholder="Masukkan nama kategori"
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className={`block text-sm font-medium ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    } mb-1`}>
                      Deskripsi
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                      placeholder="Masukkan deskripsi kategori"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${
            darkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <Tooltip content={editingCategory ? 'Perbarui kategori' : 'Simpan kategori baru'}>
              <button
                type="button"
                onClick={handleSave}
                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm flex items-center ${
                  darkMode 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                <Save className="h-4 w-4 mr-1" />
                {editingCategory ? 'Perbarui' : 'Simpan'}
              </button>
            </Tooltip>
            <Tooltip content="Batal">
              <button
                type="button"
                onClick={closeModal}
                className={`mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm flex items-center ${
                  darkMode 
                    ? 'bg-gray-600 text-white hover:bg-gray-500 border-gray-500' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
              >
                <X className="h-4 w-4 mr-1" />
                Batal
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;