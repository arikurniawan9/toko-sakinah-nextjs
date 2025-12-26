// components/produk/ProductDetailModal.js
'use client';

import { useState } from 'react';
import { X, Tag, Truck, Package, DollarSign, Scale, Info, Hash } from 'lucide-react';
import { useEscapeKey } from '@/lib/hooks/useEscapeKey';
import Tooltip from '../Tooltip';
import ProductBarcodePreview from '../admin/ProductBarcodePreview';
import { generateSingleProductBarcodePDF } from '../admin/ProductBarcodePDFGenerator';

export default function ProductDetailModal({
  isOpen,
  onClose,
  product,
  darkMode,
}) {
  const [quantity, setQuantity] = useState(1);
  const [showBarcodePreview, setShowBarcodePreview] = useState(false);

  if (!isOpen || !product) return null;

  // Gunakan hook untuk menangani tombol ESC
  useEscapeKey(onClose, isOpen);

  const handlePrintBarcode = () => {
    if (!product) return;
    setShowBarcodePreview(true);
  };

  const handleConfirmPrint = (options = {}) => {
    try {
      generateSingleProductBarcodePDF(product, quantity, {
        barcodeWidth: 38, barcodeHeight: 15,
        labelWidth: options.labelWidth || 50,
        labelHeight: options.labelHeight || 25,
        margin: 5,
        fontSize: options.fontSize || 8,
        darkMode: darkMode,
        includeProductName: options.includeProductName || false,
        includeProductCode: options.includeProductCode || true
      });
      setShowBarcodePreview(false);
    } catch (error) {
      console.error('Error printing barcode:', error);
      // Handle error jika perlu
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen p-0 sm:items-center sm:p-4">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`relative inline-block align-bottom w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-0 sm:align-middle sm:max-w-md sm:w-full ${darkMode ? 'border-gray-700' : 'border-gray-200'} border`}>
          <div className="flex items-center justify-between p-3 sm:p-4">
            <h3 className={`text-sm leading-5 font-medium ${darkMode ? 'text-purple-400' : 'text-purple-800'}`} id="modal-title">
              Detail Produk: {product.name}
            </h3>
            <button onClick={onClose} className={`p-1 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'} transition-colors`}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className={`px-3 pb-3 sm:px-4 sm:pb-4 ${darkMode ? 'bg-gray-800' : ''}`}>
            <div className="w-full">
              <div className="mt-1 w-full space-y-2.5 sm:space-y-3">
                {/* Product Information Section */}
                <div className="space-y-2.5">
                  {/* Product Info - Stacked vertically on all screen sizes for better mobile experience */}
                  <div className="space-y-2.5">
                    <div className="flex items-start space-x-2">
                      <Tag className={`flex-shrink-0 h-3.5 w-3.5 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-[10px] font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Kode Produk</p>
                        <p className={`mt-0.5 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{product.productCode}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Scale className={`flex-shrink-0 h-3.5 w-3.5 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-[10px] font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Stok</p>
                        <p className={`mt-0.5 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{product.stock}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Info className={`flex-shrink-0 h-3.5 w-3.5 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-[10px] font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Kategori</p>
                        <p className={`mt-0.5 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{product.category?.name || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Truck className={`flex-shrink-0 h-3.5 w-3.5 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div>
                        <p className={`text-[10px] font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Supplier</p>
                        <p className={`mt-0.5 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{product.supplier?.name || '-'}</p>
                      </div>
                    </div>

                    <div className="pt-1">
                      <p className={`text-[10px] font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Deskripsi</p>
                      <p className={`mt-0.5 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{product.description || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Pricing Section */}
                <div className={`border-t pt-2.5 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>Harga Produk</h4>

                  <div className="space-y-1">
                    <div className={`flex justify-between items-center py-1 px-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Eceran</span>
                      <span className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Rp {(product.retailPrice || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className={`flex justify-between items-center py-1 px-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Silver</span>
                      <span className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Rp {(product.silverPrice || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className={`flex justify-between items-center py-1 px-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Gold</span>
                      <span className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Rp {(product.goldPrice || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className={`flex justify-between items-center py-1 px-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Platinum</span>
                      <span className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Rp {(product.platinumPrice || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Barcode Section */}
                <div className={`border-t pt-2.5 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'} mb-2`}>Cetak Barcode</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
                    <div className="flex-1">
                      <label className={`block text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Jumlah Barcode</label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className={`w-full px-2 py-1.5 text-xs border rounded-md shadow-sm ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-1 focus:ring-theme-purple-500`}
                      />
                    </div>
                    <div className="mt-1 sm:mt-0">
                      <button
                        onClick={handlePrintBarcode}
                        className={`inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm ${
                          darkMode
                            ? 'text-gray-200 bg-gray-800 hover:bg-gray-700'
                            : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <Hash className="h-4 w-4" />
                      </button>
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

        {/* Barcode Preview Modal */}
        <ProductBarcodePreview
          isOpen={showBarcodePreview}
          onClose={() => setShowBarcodePreview(false)}
          product={product}
          quantity={quantity}
          darkMode={darkMode}
          onPrint={handleConfirmPrint}
        />
      </div>
    </div>
  );
}