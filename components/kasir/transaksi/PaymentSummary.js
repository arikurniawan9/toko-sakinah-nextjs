// components/kasir/transaksi/PaymentSummary.js
'use client';

import { CreditCard, Save, Wallet, Coins } from 'lucide-react';
import { memo, useState, useCallback } from 'react';
import ReferenceModal from './ReferenceModal';

const PaymentSummary = memo(({
  calculation,
  payment,
  setPayment,
  paymentMethod,
  setPaymentMethod,
  initiatePaidPayment,
  initiateUnpaidPayment,
  referenceNumber,
  setReferenceNumber,
  loading,
  darkMode,
  additionalDiscount,
  setAdditionalDiscount,
  sessionStatus,
  selectedMember,
  selectedAttendant
}) => {
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [localReferenceNumber, setLocalReferenceNumber] = useState('');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const grandTotal = calculation?.grandTotal || 0;
  const hasCalculation = !!calculation;

  // Logic for disabling buttons
  const isPaidDisabled = loading || !hasCalculation || payment < grandTotal || !selectedAttendant;
  const isUnpaidDisabled = loading || !hasCalculation || !selectedMember || selectedMember.name === 'Pelanggan Umum' || !selectedAttendant;

  // Fungsi untuk pembulatan ke kelipatan tertentu (misalnya ke ribuan terdekat)
  const roundToNearest = (num, roundTo = 1000) => {
    return Math.ceil(num / roundTo) * roundTo;
  };

  // Fungsi untuk tombol pembayaran cepat dengan nilai umum
  const quickPaymentAmount = (amount) => {
    setPayment(amount);
  };

  // Fungsi untuk menangani pembayaran yang bergantung pada metode pembayaran
  const handlePaymentSubmission = useCallback(() => {
    if (paymentMethod === 'CASH') {
      // Langsung tampilkan modal konfirmasi untuk pembayaran tunai
      if (payment >= grandTotal) {
        initiatePaidPayment();
      } else {
        initiateUnpaidPayment();
      }
    } else {
      // Tampilkan modal referensi untuk QRIS atau Transfer
      setShowReferenceModal(true);
    }
  }, [paymentMethod, payment, grandTotal, initiatePaidPayment, initiateUnpaidPayment]);

  // Fungsi untuk submit referensi dan melanjutkan pembayaran
  const handleReferenceSubmit = useCallback((refNumber) => {
    setReferenceNumber(localReferenceNumber); // Use local reference number
    setShowReferenceModal(false);

    // Lanjutkan ke proses pembayaran berdasarkan status pembayaran
    if (payment >= grandTotal) {
      initiatePaidPayment();
    } else {
      initiateUnpaidPayment();
    }
  }, [payment, grandTotal, localReferenceNumber, setReferenceNumber, initiatePaidPayment, initiateUnpaidPayment]);

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
            {additionalDiscount > 0 && (
              <div className={`flex justify-between ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                <span>Diskon Tambahan:</span>
                <span>-{formatCurrency(additionalDiscount)}</span>
              </div>
            )}
            <div className={`flex justify-between font-bold text-lg border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-2 mt-2`}>
              <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>Total:</span>
              <span className={`${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      )}

      <div className={`rounded-lg shadow p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pembayaran</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="paymentMethod" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}>
              Metode Pembayaran
            </label>
            <select
              id="paymentMethod"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
              }`}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="CASH">CASH</option>
              <option value="TRANSFER">TRANSFER</option>
              <option value="QRIS">QRIS</option>
            </select>
          </div>
          <div>
            <label htmlFor="additionalDiscount" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}>
              Diskon Tambahan
            </label>
            <input
              type="number"
              id="additionalDiscount"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
              }`}
              value={additionalDiscount}
              onChange={(e) => setAdditionalDiscount(Number(e.target.value))}
              placeholder="Masukkan diskon tambahan"
              min="0"
              max={calculation?.subTotal || 0}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="payment" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Jumlah Bayar
              </label>
              <div className="flex space-x-1">
                <button
                  onClick={() => setPayment(grandTotal)}
                  disabled={!hasCalculation}
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    darkMode
                      ? 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-600'
                      : 'bg-purple-100 hover:bg-purple-200 text-purple-700 disabled:bg-gray-200'
                  } disabled:cursor-not-allowed`}
                >
                  Uang Pas
                </button>
              </div>
            </div>
            <input
              type="number"
              id="payment"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
              }`}
              value={payment}
              onChange={(e) => setPayment(Number(e.target.value))}
              placeholder="Masukkan jumlah pembayaran"
              min="0"
            />
             {calculation && payment > 0 && payment < grandTotal && (
              <p className="mt-2 text-xs text-red-500">
                Kurang {formatCurrency(grandTotal - payment)} lagi untuk menyelesaikan pembayaran
              </p>
            )}
            {calculation && payment >= grandTotal && payment > 0 && (
              <p className="mt-2 text-xs text-green-500">
                Kembalian: {formatCurrency(payment - grandTotal)}
              </p>
            )}
          </div>

          {/* Tombol pembayaran cepat */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => quickPaymentAmount(20000)}
              disabled={!hasCalculation}
              className={`text-xs py-2 rounded flex items-center justify-center ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-50'
              }`}
            >
              <Wallet className="h-3 w-3 mr-1" />
              20K
            </button>
            <button
              onClick={() => quickPaymentAmount(50000)}
              disabled={!hasCalculation}
              className={`text-xs py-2 rounded flex items-center justify-center ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-50'
              }`}
            >
              <Wallet className="h-3 w-3 mr-1" />
              50K
            </button>
            <button
              onClick={() => quickPaymentAmount(100000)}
              disabled={!hasCalculation}
              className={`text-xs py-2 rounded flex items-center justify-center ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-50'
              }`}
            >
              <Coins className="h-3 w-3 mr-1" />
              100K
            </button>
            <button
              onClick={() => quickPaymentAmount(200000)}
              disabled={!hasCalculation}
              className={`text-xs py-2 rounded flex items-center justify-center ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-50'
              }`}
            >
              <Coins className="h-3 w-3 mr-1" />
              200K
            </button>
          </div>


          {calculation && (
            <div className="text-sm">
              <div className="flex justify-between font-medium">
                <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Kembalian:</span>
                <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(Math.max(0, payment - grandTotal))}
                </span>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={() => {
                if (paymentMethod === 'CASH') {
                  initiateUnpaidPayment();
                } else {
                  setReferenceNumber('');
                  setShowReferenceModal(true);
                }
              }}
              disabled={isUnpaidDisabled}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Memproses...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan sebagai Hutang
                </>
              )}
            </button>
            <button
              onClick={handlePaymentSubmission}
              disabled={isPaidDisabled}
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
                  Bayar Lunas
                </>
              )}
            </button>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
            <span>(Alt+S)</span>
            <span>(Alt+Enter)</span>
          </div>
        </div>
      </div>

      <ReferenceModal
        isOpen={showReferenceModal}
        onClose={() => setShowReferenceModal(false)}
        onSubmit={handleReferenceSubmit}
        paymentMethod={paymentMethod}
        darkMode={darkMode}
        referenceNumber={localReferenceNumber}
        setReferenceNumber={setLocalReferenceNumber}
        loading={loading}
      />
    </>
  );
});

export default PaymentSummary;