import React from 'react';
import { CheckCircle } from 'lucide-react';

const SuccessModal = ({ isOpen, onClose, message, details = null, darkMode = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-500'} bg-opacity-75`}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${
          darkMode ? 'border-gray-700' : 'border-theme-purple-200'
        } border`}>
          <div className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className={`p-3 rounded-full ${
                darkMode ? 'bg-green-900/30' : 'bg-green-100'
              }`}>
                <CheckCircle className={`h-12 w-12 ${
                  darkMode ? 'text-green-400' : 'text-green-600'
                }`} />
              </div>
              
              <h3 className={`mt-4 text-lg font-medium ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Berhasil!
              </h3>
              
              <div className={`mt-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <p className="text-sm">{message}</p>
                {details && (
                  <div className={`mt-3 text-xs p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700 text-gray-200' : 'bg-green-50 text-gray-700'
                  }`}>
                    {details}
                  </div>
                )}
              </div>
              
              <div className="mt-6 w-full">
                <button
                  type="button"
                  onClick={onClose}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
                    darkMode
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  }`}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;