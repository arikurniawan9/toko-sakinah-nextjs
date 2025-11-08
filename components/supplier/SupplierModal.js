import React from 'react';
import { Save, X } from 'lucide-react';

const SupplierModal = ({
  showModal,
  closeModal,
  handleSave,
  formData,
  handleInputChange,
  editingSupplier,
  error,
  setFormError,
  darkMode,
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md lg:max-w-xl sm:w-full ${
          darkMode ? 'border-gray-700' : 'border-pastel-purple-200'
        } border`}>
          <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className={`text-lg leading-6 font-medium ${
                  darkMode ? 'text-pastel-purple-400' : 'text-pastel-purple-800'
                }`} id="modal-title">
                  {editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}
                </h3>
                <div className="mt-4 w-full">
                  {error && (
                    <div className={`mb-4 p-3 text-sm rounded-md ${
                      darkMode ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                      {error}
                    </div>
                  )}
                  <div className="mb-4">
                    <label htmlFor="name" className={`block text-sm font-medium ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    } mb-1`}>
                      Nama Supplier *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-pastel-purple-500 focus:border-pastel-purple-500 sm:text-sm ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'border-pastel-purple-300 text-gray-900'
                      }`}
                      placeholder="Masukkan nama supplier"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="address" className={`block text-sm font-medium ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    } mb-1`}>
                      Alamat
                    </label>
                    <input
                      type="text"
                      name="address"
                      id="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-pastel-purple-500 focus:border-pastel-purple-500 sm:text-sm ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'border-pastel-purple-300 text-gray-900'
                      }`}
                      placeholder="Masukkan alamat supplier"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className={`block text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      } mb-1`}>
                        Telepon
                      </label>
                                                  <input
                                                    type="text"
                                                    name="phone"
                                                    id="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-pastel-purple-500 focus:border-pastel-purple-500 sm:text-sm ${
                                                      darkMode 
                                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                                        : 'border-pastel-purple-300 text-gray-900'
                                                    }`}
                                                    placeholder="Masukkan nomor telepon"
                                                  />                    </div>
                    <div>
                      <label htmlFor="email" className={`block text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      } mb-1`}>
                        Email
                      </label>
                                                  <input
                                                    type="email"
                                                    name="email"
                                                    id="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-pastel-purple-500 focus:border-pastel-purple-500 sm:text-sm ${
                                                      darkMode 
                                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                                        : 'border-pastel-purple-300 text-gray-900'
                                                    }`}
                                                    placeholder="Masukkan alamat email"
                                                  />                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse sm:gap-3 ${
            darkMode ? 'bg-gray-700' : 'bg-pastel-purple-50'
          }`}>
            <button
              type="button"
              onClick={handleSave}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm flex items-center ${
                darkMode 
                  ? 'bg-pastel-purple-600 hover:bg-pastel-purple-700' 
                  : 'bg-pastel-purple-600 hover:bg-pastel-purple-700'
              }`}
            >
              <Save className="h-4 w-4 mr-1" />
              {editingSupplier ? 'Perbarui' : 'Simpan'}
            </button>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierModal;
