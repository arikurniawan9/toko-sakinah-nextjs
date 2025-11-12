// components/kasir/transaksi/PaymentModal.js
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function PaymentModal({
  isOpen,
  onClose,
  totalAmount,
  onSubmit,
  darkMode,
}) {
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [change, setChange] = useState(0);

  if (!isOpen) return null;

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
    setAmountPaid(value);
    if (paymentMethod === 'CASH' && value >= totalAmount) {
      setChange(value - totalAmount);
    } else {
      setChange(0);
    }
  };

  const handlePayment = () => {
    // Basic validation
    if (paymentMethod === 'CASH' && (!amountPaid || amountPaid < totalAmount)) {
      alert('Jumlah pembayaran tunai kurang dari total.');
      return;
    }
    onSubmit({
      paymentMethod,
      amountPaid: paymentMethod === 'CASH' ? Number(amountPaid) : totalAmount,
      totalAmount,
      change,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-8 rounded-lg shadow-2xl w-full max-w-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Pembayaran</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-lg text-gray-400">Total Tagihan</p>
          <p className="text-4xl font-extrabold text-blue-500">{formatCurrency(totalAmount)}</p>
        </div>

        <div className="mb-6">
          <p className="font-semibold mb-2">Metode Pembayaran</p>
          <div className="flex space-x-2">
            {/* Add more payment methods here in the future */}
            <button
              onClick={() => setPaymentMethod('CASH')}
              className={`px-4 py-2 rounded-lg flex-grow ${paymentMethod === 'CASH' ? 'bg-blue-600 text-white' : (darkMode ? 'bg-gray-700' : 'bg-gray-200')}`}
            >
              Tunai
            </button>
            <button
              onClick={() => setPaymentMethod('QRIS')}
              className={`px-4 py-2 rounded-lg flex-grow ${paymentMethod === 'QRIS' ? 'bg-blue-600 text-white' : (darkMode ? 'bg-gray-700' : 'bg-gray-200')}`}
            >
              QRIS
            </button>
          </div>
        </div>

        {paymentMethod === 'CASH' && (
          <div className="mb-6">
            <label className="block font-semibold mb-2">Jumlah Dibayar</label>
            <input
              type="text"
              value={formatCurrency(amountPaid || 0)}
              onChange={handleAmountChange}
              className={`w-full p-3 text-lg rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}
              placeholder="Masukkan jumlah uang"
            />
          </div>
        )}

        {paymentMethod === 'CASH' && (
          <div className="mb-8">
            <p className="text-lg text-gray-400">Kembalian</p>
            <p className={`text-3xl font-bold ${change > 0 ? 'text-green-500' : ''}`}>{formatCurrency(change)}</p>
          </div>
        )}
        
        {paymentMethod === 'QRIS' && (
          <div className="mb-8 text-center">
            <p className="mb-2">Silakan scan kode QR di bawah ini.</p>
            {/* Placeholder for QR Code */}
            <div className="w-48 h-48 bg-gray-300 mx-auto flex items-center justify-center">
              <p className="text-gray-500">QR Code</p>
            </div>
          </div>
        )}

        <button
          onClick={handlePayment}
          className="w-full bg-green-600 text-white p-4 rounded-lg font-bold text-lg hover:bg-green-700"
        >
          Selesaikan Transaksi
        </button>
      </div>
    </div>
  );
}