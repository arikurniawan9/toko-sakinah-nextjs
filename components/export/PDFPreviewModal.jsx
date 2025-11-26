import { useState, useEffect, useRef } from 'react';
import { X, Printer, Download, FileText } from 'lucide-react';

const PDFPreviewModal = ({ isOpen, onClose, data, title, darkMode }) => {
  const componentRef = useRef();

  if (!isOpen) return null;

  return (
    <div className="fixed z-[100] inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        >
          <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
        </div>

        <span 
          className="hidden sm:inline-block sm:align-middle sm:h-screen" 
          aria-hidden="true"
        >&nbsp;</span>

        <div 
          className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } ${darkMode ? 'border-gray-700' : 'border-gray-200'} border`}
        >
          <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="sm:flex sm:items-start">
              <div 
                className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                  darkMode ? 'bg-blue-900' : 'bg-blue-100'
                } sm:mx-0 sm:h-10 sm:w-10`}
              >
                <FileText className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 
                  className={`text-lg leading-6 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  Pratinjau {title || 'Data'}
                </h3>
                
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 
                        className={`text-md font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        Tabel {title || 'Data'}
                      </h4>
                      <p 
                        className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      >
                        Pratinjau data sebelum dicetak atau diunduh
                      </p>
                    </div>
                  </div>
                  
                  <div 
                    className={`border rounded-lg overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                    ref={componentRef}
                  >
                    <div 
                      className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                    >
                      <h5 
                        className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        {title || 'Data'}
                      </h5>
                      <p 
                        className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}
                      >
                        Tanggal: {new Date().toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table 
                        className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}
                      >
                        <thead 
                          className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}
                        >
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Nama</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Kode</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Stok</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Kategori</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Supplier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Harga Beli</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Harga Jual</th>
                          </tr>
                        </thead>
                        <tbody 
                          className={`divide-y ${darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}
                        >
                          {data && data.length > 0 ? (
                            data.map((item, index) => (
                              <tr 
                                key={index} 
                                className={index % 2 === 0 ? (
                                  darkMode ? 'bg-gray-800' : 'bg-white'
                                ) : (
                                  darkMode ? 'bg-gray-750' : 'bg-gray-50'
                                )}
                              >
                                <td 
                                  className={`px-6 py-4 text-sm ${
                                    darkMode ? 'text-gray-300' : 'text-gray-500'
                                  }`}
                                >
                                  {item.nama || item.name}
                                </td>
                                <td 
                                  className={`px-6 py-4 text-sm ${
                                    darkMode ? 'text-gray-300' : 'text-gray-500'
                                  }`}
                                >
                                  {item.kode || item.code}
                                </td>
                                <td 
                                  className={`px-6 py-4 text-sm ${
                                    darkMode ? 'text-gray-300' : 'text-gray-500'
                                  }`}
                                >
                                  {item.stok || item.stock || 0}
                                </td>
                                <td 
                                  className={`px-6 py-4 text-sm ${
                                    darkMode ? 'text-gray-300' : 'text-gray-500'
                                  }`}
                                >
                                  {item.kategori || item.category || '-'}
                                </td>
                                <td 
                                  className={`px-6 py-4 text-sm ${
                                    darkMode ? 'text-gray-300' : 'text-gray-500'
                                  }`}
                                >
                                  {item.supplier || '-'}
                                </td>
                                <td 
                                  className={`px-6 py-4 text-sm ${
                                    darkMode ? 'text-gray-300' : 'text-gray-500'
                                  }`}
                                >
                                  {new Intl.NumberFormat('id-ID', { 
                                    style: 'currency', 
                                    currency: 'IDR' 
                                  }).format(item.hargaBeli || item.purchasePrice || item.price || 0)}
                                </td>
                                <td 
                                  className={`px-6 py-4 text-sm ${
                                    darkMode ? 'text-gray-300' : 'text-gray-500'
                                  }`}
                                >
                                  {new Intl.NumberFormat('id-ID', { 
                                    style: 'currency', 
                                    currency: 'IDR' 
                                  }).format(item.hargaJual || item.salePrice || item.price || 0)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td 
                                colSpan="7" 
                                className={`px-6 py-4 text-center ${
                                  darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}
                              >
                                Tidak ada data untuk ditampilkan
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div 
            className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${
              darkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`mt-3 w-full inline-flex justify-center rounded-md border px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${
                darkMode
                  ? 'border-gray-600 bg-gray-600 text-white hover:bg-gray-500 focus:ring-gray-600'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-300'
              }`}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewModal;