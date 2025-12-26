import React, { useState, useEffect } from 'react';
import { Save, X, User, AtSign, Lock, Mail, Building, Shield, Phone, Home } from 'lucide-react';
import { ROLES } from '@/lib/constants';

const UserModal = ({
  showModal,
  closeModal,
  handleSave,
  formData,
  handleInputChange,
  editingUser,
  error,
  setFormError,
  darkMode,
  isAttendantForm = false,
  allowedRoles,
  stores = [],
  currentStoreName, // New prop for displaying store name in header
}) => {
  const [showPassword, setShowPassword] = useState(false);

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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSave();
  };
  
  const availableRoles = [
    { value: ROLES.MANAGER, label: 'Manager' },
    { value: ROLES.ADMIN, label: 'Admin' },
    { value: ROLES.CASHIER, label: 'Kasir' },
    { value: ROLES.ATTENDANT, label: 'Pelayan' },
  ];

  const rolesToDisplay = allowedRoles
    ? availableRoles.filter(r => allowedRoles.includes(r.value))
    : availableRoles;

  const isWarehouseOnly = allowedRoles && allowedRoles.length === 1 && allowedRoles[0] === ROLES.WAREHOUSE;
  const isWarehouseContext = allowedRoles && (allowedRoles.includes(ROLES.WAREHOUSE) || allowedRoles.includes(ROLES.CASHIER) || allowedRoles.includes(ROLES.ATTENDANT));
  const showRoleDropdown = !isAttendantForm && (!allowedRoles || (allowedRoles.length > 1 && !isWarehouseOnly));


  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md lg:max-w-xl sm:w-full ${
          darkMode ? 'border-gray-700' : 'border-theme-purple-200'
        } border`}>
          <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className={`text-lg leading-6 font-medium ${
                  darkMode ? 'text-theme-purple-400' : 'text-theme-purple-800'
                }`} id="modal-title">
                  {editingUser ? (isAttendantForm ? 'Edit Pelayan' : 'Edit User') : (isAttendantForm ? `Tambah Pelayan Baru untuk ${currentStoreName || 'Toko Ini'}` : 'Tambah User Baru')}
                </h3>
                <div className="mt-4 w-full">
                  {error && (
                    <div className={`mb-4 p-3 text-sm rounded-md ${
                      darkMode ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleFormSubmit}>
                    <div className="mb-4">
                      <label htmlFor="name" className={`block text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      } mb-1`}>
                        Nama Lengkap *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-theme-purple-400" />
                        </div>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 pl-10 border rounded-md shadow-sm focus:outline-none focus:ring-theme-purple-500 focus:border-theme-purple-500 sm:text-sm ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'border-theme-purple-300 text-gray-900'
                          }`}
                          placeholder="Masukkan nama lengkap"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="username" className={`block text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      } mb-1`}>
                        Username *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <AtSign className="h-5 w-5 text-theme-purple-400" />
                        </div>
                        <input
                          type="text"
                          name="username"
                          id="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 pl-10 border rounded-md shadow-sm focus:outline-none focus:ring-theme-purple-500 focus:border-theme-purple-500 sm:text-sm ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'border-theme-purple-300 text-gray-900'
                          }`}
                                                    placeholder="Masukkan username"
                                                    required
                                                  />
                                                </div>
                                              </div>

                                              <div className="mb-4">
                                                <label htmlFor="phone" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                                                  No. Telepon
                                                </label>
                                                <div className="relative">
                                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Phone className="h-5 w-5 text-theme-purple-400" />
                                                  </div>
                                                  <input
                                                    type="tel"
                                                    name="phone"
                                                    id="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 pl-10 border rounded-md shadow-sm focus:outline-none focus:ring-theme-purple-500 focus:border-theme-purple-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-theme-purple-300 text-gray-900'}`}
                                                    placeholder="Masukkan nomor telepon"
                                                  />
                                                </div>
                                              </div>

                                              <div className="mb-4">
                                                <label htmlFor="address" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                                                  Alamat
                                                </label>
                                                <div className="relative">
                                                  <div className="absolute inset-y-0 left-0 pl-3 pt-2 flex items-start pointer-events-none">
                                                    <Home className="h-5 w-5 text-theme-purple-400" />
                                                  </div>
                                                  <textarea
                                                    name="address"
                                                    id="address"
                                                    rows="3"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 pl-10 border rounded-md shadow-sm focus:outline-none focus:ring-theme-purple-500 focus:border-theme-purple-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-theme-purple-300 text-gray-900'}`}
                                                    placeholder="Masukkan alamat lengkap"
                                                  ></textarea>
                                                </div>
                                              </div>
                          
                                              <div className="mb-4">
                                                <label htmlFor="employeeNumber" className={`block text-sm font-medium ${
                                                  darkMode ? 'text-gray-300' : 'text-gray-700'
                                                } mb-1`}>
                                                  Kode Karyawan
                                                </label>
                                                <div className="relative">
                                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <User className="h-5 w-5 text-theme-purple-400" />
                                                  </div>
                                                  <input
                                                    type="text"
                                                    name="employeeNumber"
                                                    id="employeeNumber"
                                                    value={formData.employeeNumber}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 pl-10 border rounded-md shadow-sm focus:outline-none focus:ring-theme-purple-500 focus:border-theme-purple-500 sm:text-sm ${
                                                      darkMode
                                                        ? 'bg-gray-700 border-gray-600 text-white'
                                                        : 'border-theme-purple-300 text-gray-900'
                                                    }`}
                                                    placeholder="Kode Karyawan (opsional, unik)"
                                                  />
                                                </div>
                                              </div>
                                              
                                              <div className="mb-4">
                                                <label htmlFor="code" className={`block text-sm font-medium ${
                                                  darkMode ? 'text-gray-300' : 'text-gray-700'
                                                } mb-1`}>
                                                  Kode Pengguna
                                                </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-5 w-5 text-theme-purple-400" />
                        </div>
                        <input
                          type="text"
                          name="code"
                          id="code"
                          value={formData.code}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 pl-10 border rounded-md shadow-sm focus:outline-none focus:ring-theme-purple-500 focus:border-theme-purple-500 sm:text-sm ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'border-theme-purple-300 text-gray-900'
                          }`}
                          placeholder="Kode pengguna (opsional, unik per toko)"
                        />
                      </div>
                    </div>
                    
                    {showRoleDropdown ? (
                      <div className="mb-4">
                        <label htmlFor="role" className={`block text-sm font-medium ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        } mb-1`}>
                          Role *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Shield className="h-5 w-5 text-theme-purple-400" />
                          </div>
                          <select
                            name="role"
                            id="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 pl-10 border rounded-md shadow-sm focus:outline-none focus:ring-theme-purple-500 focus:border-theme-purple-500 sm:text-sm ${
                              darkMode
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'border-theme-purple-300 text-gray-900'
                            }`}
                            required
                          >
                            <option value="">Pilih role</option>
                            {rolesToDisplay.map(role => (
                              <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : isWarehouseOnly && (
                      <div className="mb-4">
                        <label className={`block text-sm font-medium ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        } mb-1`}>
                          Role
                        </label>
                        <div className="px-3 py-2 border rounded-md shadow-sm sm:text-sm bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                          Gudang
                        </div>
                        <input
                          type="hidden"
                          name="role"
                          value={ROLES.WAREHOUSE}
                          onChange={handleInputChange}
                        />
                      </div>
                    )}

                    {(!isAttendantForm && formData.role && formData.role !== ROLES.MANAGER && formData.role !== ROLES.WAREHOUSE) && (
                      <div className="mb-4">
                        <label htmlFor="storeId" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Toko *
                        </label>
                        <div className="relative">
                          {isWarehouseContext ? (
                            // For warehouse context, show the warehouse store as read-only
                            <div className="flex items-center">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Building className="h-5 w-5 text-theme-purple-400" />
                              </div>
                              <input
                                type="text"
                                value="Gudang"
                                className={`w-full px-3 py-2 pl-10 border rounded-md shadow-sm sm:text-sm ${
                                  darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'border-theme-purple-300 text-gray-900'
                                }`}
                                readOnly
                              />
                              <input
                                type="hidden"
                                name="storeId"
                                value={stores[0]?.id || ''} // Assuming warehouse store is first in the list
                                onChange={handleInputChange}
                              />
                            </div>
                          ) : (
                            <>
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Building className="h-5 w-5 text-theme-purple-400" />
                              </div>
                              <select
                                name="storeId"
                                id="storeId"
                                value={formData.storeId}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 pl-10 border rounded-md shadow-sm focus:outline-none focus:ring-theme-purple-500 focus:border-theme-purple-500 sm:text-sm ${
                                  darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'border-theme-purple-300 text-gray-900'
                                }`}
                                required
                              >
                                <option value="">Pilih Toko</option>
                                {Array.isArray(stores) && stores.map(store => (
                                  <option key={store.id} value={store.id}>{store.name}</option>
                                ))}
                              </select>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className={editingUser ? "" : "mb-4"}> {/* Add mb-4 only if not editing */}
                      <label htmlFor="password" className={`block text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      } mb-1`}>
                        {editingUser ? 'Password Baru (kosongkan jika tidak ingin diubah)' : 'Password *'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-theme-purple-400" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          id="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 pl-10 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-theme-purple-500 focus:border-theme-purple-500 sm:text-sm ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'border-theme-purple-300 text-gray-900'
                          }`}
                          placeholder={editingUser ? "Kosongkan jika tidak ingin diubah" : "Masukkan password"}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse sm:gap-3 ${
            darkMode ? 'bg-gray-700' : 'bg-theme-purple-50'
          }`}>
            <button
              type="button"
              onClick={handleFormSubmit}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm flex items-center ${
                darkMode
                  ? 'bg-theme-purple-600 hover:bg-theme-purple-700'
                  : 'bg-theme-purple-600 hover:bg-theme-purple-700'
              }`}
            >
              <Save className="h-4 w-4 mr-1" />
              {editingUser ? 'Perbarui' : 'Simpan'}
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

export default UserModal;