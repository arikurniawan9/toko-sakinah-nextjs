// components/kasir/transaksi/PaymentSummary.js
'use client';

import { CreditCard } from 'lucide-react';

const PaymentSummary = ({ calculation, payment, setPayment, processPayment, loading, darkMode }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      {calculation && (
        <div className={`rounded-lg shadow p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Perhitungan</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Subtotal:</span>
              <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(calculation.subTotal || 0)}</span>
            </div>
            {calculation.itemDiscount > 0 && (
              <div className={`flex justify-between ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                <span>Diskon Tier Harga:</span>
                <span>-{formatCurrency(calculation.itemDiscount || 0)}</span>
              </div>
            )}
            {calculation.memberDiscount > 0 && (
              <div className={`flex justify-between ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                <span>Diskon Member:</span>
                <span>-{formatCurrency(calculation.memberDiscount || 0)}</span>
              </div>
            )}
            <div className={`flex justify-between font-bold text-lg border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-2 mt-2`}>
              <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>Total:</span>
              <span className={`${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{formatCurrency(calculation.grandTotal || 0)}</span>
            </div>
          </div>
        </div>
      )}

      <div className={`rounded-lg shadow p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pembayaran</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="payment" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}>
              Jumlah Bayar
            </label>
            <input
              type="number"
              id="payment"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
              }`}
              value={payment}
              onChange={(e) => setPayment(Number(e.target.value))}
              placeholder="Masukkan jumlah pembayaran"
            />
          </div>

          {calculation && (
            <div className="text-sm">
              <div className="flex justify-between font-medium">
                <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Kembalian:</span>
                <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(Math.max(0, payment - (calculation.grandTotal || 0)))}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={processPayment}
            disabled={loading || !calculation || payment < (calculation?.grandTotal || 0)}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Memproses...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Proses Pembayaran
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default PaymentSummary;
