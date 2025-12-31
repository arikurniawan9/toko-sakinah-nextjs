'use client';

import { useState, useEffect, useRef } from 'react';
import DistributionReceipt from '../warehouse/DistributionReceipt';
import DistributionInvoice from '../warehouse/DistributionInvoice';
import { Printer, X } from 'lucide-react';
import { useUserTheme } from '../UserThemeContext';

const DistributionReceiptModal = ({ distributionData, isOpen, onClose }) => {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const receiptRef = useRef();
  const invoiceRef = useRef();
  const [printType, setPrintType] = useState('receipt'); // 'receipt' or 'invoice'

  // Fungsi cetak langsung
  const handlePrint = () => {
    if (!distributionData) {
      console.error('Distribution data is not available');
      return;
    }

    // Force reflow untuk memastikan perubahan kelas diterapkan
    if (typeof window !== 'undefined') {
      window.getComputedStyle(document.body).height;
    }

    // Tunggu sebentar agar perubahan kelas diterapkan sebelum mencetak
    setTimeout(() => {
      // Panggil fungsi cetak browser langsung
      window.print();

      // Tutup modal setelah selesai mencetak
      const handleAfterPrint = () => {
        onClose();
        window.removeEventListener('afterprint', handleAfterPrint);
      };

      window.addEventListener('afterprint', handleAfterPrint);
    }, 300);
  };

  // Handle ESC key press to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !distributionData) return null;

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-section, .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .multi-page-invoice {
            display: block;
          }
          .multi-page-invoice > div {
            page-break-after: always;
          }
          .multi-page-invoice > div:last-child {
            page-break-after: auto;
          }
          @page {
            size: ${printType === 'receipt' ? '80mm auto' : 'A4'};
            margin: ${printType === 'receipt' ? '0.25in' : '0.4in'};
          }
        }
      `}</style>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Cetak Distribusi Produk
              </h2>
              <button
                onClick={onClose}
                className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Print Type Selector */}
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Pilih Jenis Cetakan:
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-blue-600"
                    checked={printType === 'receipt'}
                    onChange={() => setPrintType('receipt')}
                  />
                  <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Struk (80mm)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-blue-600"
                    checked={printType === 'invoice'}
                    onChange={() => setPrintType('invoice')}
                  />
                  <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Faktur (A4)</span>
                </label>
              </div>
            </div>

            {/* Receipt Preview */}
            <div className="space-y-4">
              <div className={`print-section ${printType === 'receipt' ? 'block' : 'hidden'}`} ref={receiptRef}>
                <DistributionReceipt
                  distributionData={distributionData}
                />
              </div>

              <div className={`print-section ${printType === 'invoice' ? 'block' : 'hidden'}`} ref={invoiceRef}>
                <DistributionInvoice
                  distributionData={distributionData}
                  isModalPreview={true}
                />
              </div>

              {/* Print Buttons - Hidden during actual print */}
              <div className="flex space-x-3 mt-6 no-print">
                <button
                  onClick={handlePrint}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium ${
                    darkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  <Printer className="h-5 w-5 mr-2" />
                  Cetak {printType === 'receipt' ? 'Struk' : 'Faktur'}
                </button>
                <button
                  onClick={onClose}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                    darkMode ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                  }`}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DistributionReceiptModal;