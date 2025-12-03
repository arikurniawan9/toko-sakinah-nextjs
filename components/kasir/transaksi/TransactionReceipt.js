// components/kasir/transaksi/TransactionReceipt.js
'use client';

import { Printer, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';
import { useUserTheme } from '../../components/UserThemeContext';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const ReceiptContent = ({ transaction }) => {
  return (
    <div className="font-mono text-sm">
      <div className="text-center mb-2">
        <div className="font-bold text-lg">TOKO SAKINAH</div>
        <div className="text-xs">Kode Toko: {transaction.storeCode || 'N/A'}</div>
        <div className="text-xs">Jl. Contoh Alamat Toko</div>
        <div className="text-xs">Telp: 0123-456789</div>
        <div className="border-b border-gray-400 my-2"></div>
      </div>
      
      <div className="mb-2">
        <div className="flex justify-between">
          <span>Invoice:</span>
          <span>{transaction.invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Tanggal:</span>
          <span>
            {new Date(transaction.date).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Kasir:</span>
          <span>{transaction.cashierName}</span>
        </div>
        {transaction.attendantName && (
          <div className="flex justify-between">
            <span>Pelayan:</span>
            <span>{transaction.attendantName}</span>
          </div>
        )}
        {transaction.customerName && transaction.customerName !== '-' && (
          <div className="flex justify-between">
            <span>Customer:</span>
            <span>{transaction.customerName}</span>
          </div>
        )}
      </div>
      
      <div className="border-b border-gray-400 my-2"></div>
      
      <div className="mb-2">
        {transaction.items.map((item, index) => (
          <div key={index} className="flex justify-between text-xs">
            <div className="flex-1">
              <div>{item.productName}</div>
              <div className="text-gray-500">
                {item.quantity} x {formatCurrency(item.price)}
              </div>
            </div>
            <div>{formatCurrency(item.subtotal)}</div>
          </div>
        ))}
      </div>
      
      <div className="border-b border-gray-400 my-2"></div>
      
      <div className="mb-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(transaction.totalAmount - transaction.discount)}</span>
        </div>
        {transaction.discount > 0 && (
          <div className="flex justify-between">
            <span>Diskon Member:</span>
            <span>-{formatCurrency(transaction.discount)}</span>
          </div>
        )}
        {transaction.additionalDiscount > 0 && (
          <div className="flex justify-between">
            <span>Diskon Tambahan:</span>
            <span>-{formatCurrency(transaction.additionalDiscount)}</span>
          </div>
        )}
        {transaction.tax > 0 && (
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>{formatCurrency(transaction.tax)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold border-t border-gray-400 pt-1">
          <span>Total:</span>
          <span>{formatCurrency(transaction.totalAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span>Bayar:</span>
          <span>{formatCurrency(transaction.payment)}</span>
        </div>
        <div className="flex justify-between">
          <span>Kembali:</span>
          <span>{formatCurrency(transaction.change)}</span>
        </div>
        <div className="flex justify-between">
          <span>Metode:</span>
          <span>{transaction.paymentMethod || 'CASH'}</span>
        </div>
      </div>
      
      <div className="text-center mt-4 text-xs">
        Terima kasih atas kunjungan Anda
      </div>
    </div>
  );
};

const TransactionReceipt = ({ transaction, onClose }) => {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Struk-${transaction.invoiceNumber}`,
    pageStyle: `
      @media print {
        @page {
          margin: 0;
          size: 80mm auto;
        }
      }
    `,
  });

  if (!transaction) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4`}>
      <div className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto`}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Cetak Struk
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={handlePrint}
                className={`p-2 rounded ${
                  darkMode
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                title="Cetak Struk"
              >
                <Printer size={16} />
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded ${
                  darkMode
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                }`}
                title="Tutup"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Thermal Receipt Preview */}
          <div className="p-4 max-h-[70vh] overflow-y-auto">
            <ReceiptContent transaction={transaction} />
          </div>
          
          {/* Hidden element for printing */}
          <div style={{ display: 'none' }}>
            <div ref={componentRef}>
              <ReceiptContent transaction={transaction} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionReceipt;