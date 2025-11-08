// components/produk/ProductModal.js
'use client';

import { Save, X, Plus, Trash2 } from 'lucide-react';
import Tooltip from '../Tooltip';

export default function ProductModal({ 
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
  suppliers
}) {
  if (!showModal) return null;

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={closeModal}>
          <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`relative inline-block align-bottom ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg md:max-w-4xl sm:w-full ${darkMode ? 'border-gray-700' : 'border-gray-200'} border`}>
          <button onClick={closeModal} className={`absolute top-0 right-0 mt-4 mr-4 p-1 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'} transition-colors z-10`}>
            <X className="h-6 w-6" />
          </button>
          <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${darkMode ? 'bg-gray-800' : ''}`}>
            <div className="w-full">
              <h3 className={`text-lg leading-6 font-medium ${darkMode ? 'text-purple-400' : 'text-purple-800'}`} id="modal-title">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
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
                          <select name="categoryId" id="categoryId" value={formData.categoryId} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 bg-white text-gray-900'}`}>
                            <option value="">Pilih Kategori</option>
                            {categories.map(category => (
                              <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="supplierId" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Supplier</label>
                          <select name="supplierId" id="supplierId" value={formData.supplierId} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 bg-white text-gray-900'}`}>
                            <option value="">Pilih Supplier</option>
                            {suppliers.map(supplier => (
                              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor="description" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Deskripsi</label>
                          <textarea name="description" id="description" rows={3} value={formData.description} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 bg-white text-gray-900'}`} placeholder="Deskripsi singkat produk..."></textarea>
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
                          <input type="number" name="purchasePrice" id="purchasePrice" value={formData.purchasePrice} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 bg-white text-gray-900'}`} placeholder="Rp 0" />
                        </div>
                        <hr className={darkMode ? 'border-gray-600' : 'border-gray-300'} />
                        {formData.priceTiers.map((tier, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-5">
                              <label className="text-xs sr-only">Jumlah Min</label>
                              <input type="number" value={tier.minQty} onChange={(e) => handleTierChange(index, 'minQty', e.target.value)} placeholder="Jumlah Min" className={`w-full px-2 py-1 border rounded-md sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`} />
                            </div>
                            <div className="col-span-5">
                              <label className="text-xs sr-only">Jumlah Max</label>
                              <input type="number" value={tier.maxQty} onChange={(e) => handleTierChange(index, 'maxQty', e.target.value)} placeholder="Jumlah Max (opsional)" className={`w-full px-2 py-1 border rounded-md sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`} />
                            </div>
                            <div className="col-span-12">
                               <label className="text-xs sr-only">Harga</label>
                               <input type="number" value={tier.price} onChange={(e) => handleTierChange(index, 'price', e.target.value)} placeholder="Harga per item" className={`w-full px-2 py-1 border rounded-md sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`} />
                            </div>
                            <div className="col-span-2 flex items-end">
                              {formData.priceTiers.length > 1 && (
                                <Tooltip content="Hapus Tingkatan">
                                  <button type="button" onClick={() => removeTier(index)} className={`p-2 rounded-md ${darkMode ? 'text-red-400 hover:bg-red-900/50' : 'text-red-500 hover:bg-red-100'}`}>
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        ))}
                        <Tooltip content="Tambah Tingkatan Harga">
                          <button type="button" onClick={addTier} className={`w-full flex items-center justify-center py-2 px-4 border border-dashed rounded-md text-sm font-medium ${darkMode ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-gray-300 text-gray-500 hover:bg-gray-100'}`}>
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Tingkatan
                          </button>
                        </Tooltip>
                      </div>
                    </fieldset>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <Tooltip content={editingProduct ? 'Perbarui produk' : 'Simpan produk baru'}>
              <button type="button" onClick={handleSave} className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm flex items-center ${darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
                <Save className="h-4 w-4 mr-1" />
                {editingProduct ? 'Perbarui' : 'Simpan'}
              </button>
            </Tooltip>
            <Tooltip content="Batal">
              <button type="button" onClick={closeModal} className={`mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm flex items-center ${darkMode ? 'bg-gray-600 text-white hover:bg-gray-500 border-gray-500' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`}>
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
