import { useState } from 'react';
import { Download, X, FileSpreadsheet, FileText, FileDown } from 'lucide-react';

const ExportFormatSelector = ({ isOpen, onClose, onExport, title, darkMode }) => {
  const [selectedFormat, setSelectedFormat] = useState('excel');

  if (!isOpen) return null;

  const handleExportClick = () => {
    onExport(selectedFormat);
    onClose();
  };

  return (
    <div className="fixed z-[100] inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${darkMode ? 'border-gray-700' : 'border-gray-200'} border`}>
          <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${darkMode ? 'bg-blue-900' : 'bg-blue-100'} sm:mx-0 sm:h-10 sm:w-10`}>
                <Download className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className={`text-lg leading-6 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Pilih Format Ekspor
                </h3>
                <div className="mt-4">
                  <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Pilih format file yang ingin Anda ekspor untuk "{title}":
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setSelectedFormat('excel')}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                        selectedFormat === 'excel'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : darkMode
                            ? 'border-gray-600 hover:bg-gray-700'
                            : 'border-gray-300 hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <FileSpreadsheet className="h-8 w-8 mb-2" />
                      <span className="text-sm font-medium">Excel</span>
                    </button>
                    
                    <button
                      onClick={() => setSelectedFormat('csv')}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                        selectedFormat === 'csv'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : darkMode
                            ? 'border-gray-600 hover:bg-gray-700'
                            : 'border-gray-300 hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <FileText className="h-8 w-8 mb-2" />
                      <span className="text-sm font-medium">CSV</span>
                    </button>
                    
                    <button
                      onClick={() => setSelectedFormat('pdf')}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                        selectedFormat === 'pdf'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : darkMode
                            ? 'border-gray-600 hover:bg-gray-700'
                            : 'border-gray-300 hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <FileDown className="h-8 w-8 mb-2" />
                      <span className="text-sm font-medium">PDF</span>
                    </button>
                  </div>
                  
                  <div className="mt-4 text-sm">
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      {selectedFormat === 'excel' && 'Ekspor ke file Excel (.xlsx) dengan format yang terstruktur.'}
                      {selectedFormat === 'csv' && 'Ekspor ke file CSV (.csv) untuk digunakan di aplikasi lain.'}
                      {selectedFormat === 'pdf' && 'Ekspor ke file PDF (.pdf) untuk cetak dan dokumentasi.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <button
              type="button"
              onClick={handleExportClick}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Ekspor Sekarang
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`mt-3 w-full inline-flex justify-center px-4 py-2 border shadow-sm text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${
                darkMode
                  ? 'border-gray-600 bg-gray-600 text-white hover:bg-gray-500 focus:ring-gray-600'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-300'
              }`}
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportFormatSelector;