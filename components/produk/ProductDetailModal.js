// components/produk/ProductDetailModal.js
'use client';

import { X, Tag, Truck, Package, DollarSign, Scale, Info } from 'lucide-react';
import Tooltip from '../Tooltip';

export default function ProductDetailModal({
  isOpen,
  onClose,
  product,
  darkMode,
}) {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen sm:p-0 p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`relative inline-block align-bottom ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg sm:rounded-none text-left overflow-hidden shadow-xl transform transition-all sm:my-0 sm:h-full sm:align-middle sm:max-w-lg md:max-w-3xl sm:w-full ${darkMode ? 'border-gray-700' : 'border-gray-200'} border`}>
          <button onClick={onClose} className={`absolute top-0 right-0 mt-4 mr-4 p-1 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'} transition-colors z-10`}>
            <X className="h-6 w-6" />
          </button>
          <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${darkMode ? 'bg-gray-800' : ''}`}>
            <div className="w-full">
              <h3 className={`text-lg leading-6 font-medium ${darkMode ? 'text-purple-400' : 'text-purple-800'}`} id="modal-title">
                Detail Produk: {product.name}
              </h3>
              <div className="mt-4 w-full space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Product Details */}
                  <fieldset className={`p-4 border rounded-lg ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                    <legend className={`px-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Informasi Dasar</legend>
                    <div className="space-y-3 pt-2 text-sm">
                      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="font-medium">Kode Produk:</span> {product.productCode}
                      </p>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="font-medium">Nama Produk:</span> {product.name}
                      </p>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="font-medium">Stok:</span> {product.stock}
                      </p>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="font-medium">Kategori:</span> {product.category?.name || '-'}
                      </p>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="font-medium">Supplier:</span> {product.supplier?.name || '-'}
                      </p>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="font-medium">Deskripsi:</span> {product.description || '-'}
                      </p>
                    </div>
                  </fieldset>

                  {/* Right Column - Pricing Details */}
                  <fieldset className={`p-4 border rounded-lg ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                    <legend className={`px-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Detail Harga</legend>
                    <div className="space-y-3 pt-2 text-sm">
                      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span className="font-medium">Harga Beli:</span> Rp {product.purchasePrice?.toLocaleString('id-ID') || '0'}
                      </p>
                      <h4 className={`font-medium mt-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Tingkatan Harga Jual:</h4>
                      {product.priceTiers && product.priceTiers.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {product.priceTiers.sort((a, b) => a.minQty - b.minQty).map((tier, index) => (
                            <li key={index} className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {tier.minQty} {tier.maxQty ? `- ${tier.maxQty}` : '+'} pcs: Rp {tier.price.toLocaleString('id-ID')}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tidak ada tingkatan harga jual.</p>
                      )}
                    </div>
                  </fieldset>
                </div>
              </div>
            </div>
          </div>
          <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`mt-3 w-full inline-flex justify-center rounded-md border ${
                darkMode ? 'border-gray-600 bg-transparent hover:bg-gray-700 text-gray-300' : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
              } shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm`}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
