// components/warehouse/WarehouseProductModal.js
'use client';

import { Save, X, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useEscapeKey } from '../../lib/hooks/useEscapeKey';
import Tooltip from '../../components/Tooltip';
import ButtonSelector from '../../components/ButtonSelector';

export default function WarehouseProductModal({
  showModal,
  closeModal,
  editingProduct,
  formData,
  handleInputChange,
  handleTierChange,
  addTier,
  removeTier,
  handleSave,
  darkMode,
  categories,
  suppliers,
  onSuccess
}) {
  if (!showModal) return null;

  // Gunakan hook untuk menangani tombol ESC
  useEscapeKey(closeModal, showModal);

  // --- Selection Handlers ---

  const handleCategorySelect = (category) => {
    handleInputChange({ target: { name: 'categoryId', value: category ? category.id : null } });
  };

  const handleSupplierSelect = (supplier) => {
    handleInputChange({ target: { name: 'supplierId', value: supplier ? supplier.id : null } });
  };

  // --- Determine Selected Items for Edit Mode ---

  const selectedCategory = formData.categoryId
    ? categories.find(c => c.id === formData.categoryId)
    : null;

  const selectedSupplier = formData.supplierId
    ? suppliers.find(s => s.id === formData.supplierId)
    : null;

  return (
    <div className="fixed z-[100] inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen sm:p-0 p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={closeModal}>
          <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`relative inline-block align-bottom ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg sm:rounded-none text-left overflow-hidden shadow-xl transform transition-all sm:my-0 sm:h-full sm:align-middle sm:max-w-lg md:max-w-4xl sm:w-full ${darkMode ? 'border-gray-700' : 'border-gray-200'} border`}>
          <button onClick={closeModal} className={`absolute top-0 right-0 mt-4 mr-4 p-1 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'} transition-colors z-10`}>
            <X className="h-6 w-6" />
          </button>
          <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${darkMode ? 'bg-gray-800' : ''}`}>
            <div className="w-full">
              <h3 className={`text-lg leading-6 font-medium ${darkMode ? 'text-purple-400' : 'text-purple-800'}`} id="modal-title">
                {editingProduct ? 'Edit Produk Gudang' : 'Tambah Produk Gudang Baru'}
              </h3>
              <div className="mt-4 w-full space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Product Details Fieldset */}
                    <fieldset className={`p-4 border rounded-lg ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                      <legend className={`px-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Detail Produk</legend>
                      <div className="space-y-4 pt-2">
                        <div>
                          <label htmlFor="productCode" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Kode Produk *</label>
                          <input type="text" name="productCode" id="productCode" value={formData.productCode} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 bg-white text-gray-900'}`} placeholder="Cth: KLP-001" />
                        </div>
                        <div>
                          <label htmlFor="name" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Nama Produk *</label>
                          <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 bg-white text-gray-900'}`} placeholder="Cth: Kemeja Lengan Panjang" />
                        </div>
                        <div>
                          <label htmlFor="stock" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Stok</label>
                          <input type="number" name="stock" id="stock" value={formData.stock} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 bg-white text-gray-900'}`} placeholder="0" />
                        </div>
                      </div>
                    </fieldset>

                    {/* Categorization Fieldset */}
                    <fieldset className={`p-4 border rounded-lg ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                      <legend className={`px-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Kategorisasi</legend>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label htmlFor="categoryId" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Kategori</label>
                          <ButtonSelector
                            items={categories}
                            selectedItem={selectedCategory}
                            onSelect={handleCategorySelect}
                            placeholder="Pilih kategori..."
                            searchPlaceholder="Cari kategori..."
                            darkMode={darkMode}
                            itemLabelKey="name"
                            itemValueKey="id"
                          />
                        </div>
                        <div>
                          <label htmlFor="supplierId" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Supplier</label>
                          <ButtonSelector
                            items={suppliers}
                            selectedItem={selectedSupplier}
                            onSelect={handleSupplierSelect}
                            placeholder="Pilih supplier..."
                            searchPlaceholder="Cari supplier..."
                            darkMode={darkMode}
                            itemLabelKey="name"
                            itemValueKey="id"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor="description" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Deskripsi</label>
                          <textarea 
                            name="description" 
                            id="description" 
                            rows={3} 
                            value={formData.description || ''} 
                            onChange={handleInputChange} 
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 bg-white text-gray-900'}`} 
                            placeholder="Deskripsi singkat produk..."
                          ></textarea>
                        </div>
                      </div>
                    </fieldset>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Pricing Fieldset */}
                    <fieldset className={`p-4 border rounded-lg ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                      <legend className={`px-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Harga Jual Bertingkat</legend>
                      <div className="space-y-4 pt-2">
                        <div>
                          <label htmlFor="purchasePrice" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Harga Beli</label>
                          <input 
                            type="number" 
                            name="purchasePrice" 
                            id="purchasePrice" 
                            value={formData.purchasePrice || ''} 
                            onChange={handleInputChange} 
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 bg-white text-gray-900'}`} 
                            placeholder="Rp 0" 
                          />
                        </div>
                        <hr className={darkMode ? 'border-gray-600' : 'border-gray-300'} />
                        <div className="grid grid-cols-1 gap-3">
                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-6">
                              <label htmlFor="retailPrice" className={`block text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Harga Eceran</label>
                              <input
                                type="number"
                                name="retailPrice"
                                id="retailPrice"
                                value={formData.retailPrice || ''}
                                onChange={handleInputChange}
                                className={`w-full px-2 py-1 border rounded-md sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                                placeholder="Harga eceran"
                              />
                            </div>
                            <div className="col-span-6">
                              <label htmlFor="silverPrice" className={`block text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Harga Silver</label>
                              <input
                                type="number"
                                name="silverPrice"
                                id="silverPrice"
                                value={formData.silverPrice || ''}
                                onChange={handleInputChange}
                                className={`w-full px-2 py-1 border rounded-md sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                                placeholder="Harga member silver"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-6">
                              <label htmlFor="goldPrice" className={`block text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Harga Gold</label>
                              <input
                                type="number"
                                name="goldPrice"
                                id="goldPrice"
                                value={formData.goldPrice || ''}
                                onChange={handleInputChange}
                                className={`w-full px-2 py-1 border rounded-md sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                                placeholder="Harga member gold"
                              />
                            </div>
                            <div className="col-span-6">
                              <label htmlFor="platinumPrice" className={`block text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Harga Platinum</label>
                              <input
                                type="number"
                                name="platinumPrice"
                                id="platinumPrice"
                                value={formData.platinumPrice || ''}
                                onChange={handleInputChange}
                                className={`w-full px-2 py-1 border rounded-md sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                                placeholder="Harga member platinum/partai"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </fieldset>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <Tooltip content={editingProduct ? 'Perbarui produk gudang' : 'Simpan produk gudang baru'}>
              <button 
                type="button" 
                onClick={() => handleSave(onSuccess || null)} 
                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm flex items-center ${
                  darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                <Save className="h-4 w-4 mr-1" />
                {editingProduct ? 'Perbarui' : 'Simpan'}
              </button>
            </Tooltip>
            <Tooltip content="Batal">
              <button 
                type="button" 
                onClick={closeModal} 
                className={`mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm flex items-center ${
                  darkMode ? 'bg-gray-600 text-white hover:bg-gray-500 border-gray-500' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
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
}