// components/kasir/transaksi/PaymentModal.js
import { CreditCard, Save, Wallet, Coins, X } from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import ReferenceModal from './ReferenceModal';

const PaymentModal = ({
  isOpen,
  onClose,
  calculation,
  payment,
  setPayment,
  additionalDiscount = 0,
  setAdditionalDiscount,
  paymentMethod,
  setPaymentMethod,
  initiatePaidPayment,
  initiateUnpaidPayment,
  referenceNumber,
  setReferenceNumber,
  loading,
  darkMode,
  sessionStatus,
  selectedMember,
  selectedAttendant,
  clearForm
}) => {
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [localReferenceNumber, setLocalReferenceNumber] = useState('');
  const discountInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Focus on modal open
      const focusTimer = setTimeout(() => {
        discountInputRef.current?.focus();
      }, 100);

      // Select if additionalDiscount is 0
      if (additionalDiscount === 0 && discountInputRef.current) {
        // A slight delay to ensure selection happens after focus
        const selectTimer = setTimeout(() => {
          discountInputRef.current?.select();
        }, 150); // Slightly after focus timer
        return () => { clearTimeout(focusTimer); clearTimeout(selectTimer); };
      }
      return () => clearTimeout(focusTimer);
    }
  }, [isOpen, additionalDiscount]);

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

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Shortcut untuk tombol Bayar Lunas (Shift+Enter)
      if (e.shiftKey && e.key === 'Enter' && isOpen) {
        e.preventDefault();
        if (!isPaidDisabled) {
          handlePaymentSubmission();
        }
      }
      // Shortcut untuk tombol Simpan sebagai Hutang (Alt+S)
      if (e.altKey && e.key.toLowerCase() === 's' && isOpen) {
        e.preventDefault();
        if (!isUnpaidDisabled) {
          if (paymentMethod === 'CASH') {
            initiateUnpaidPayment();
          } else {
            setReferenceNumber('');
            setShowReferenceModal(true);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPaidDisabled, isUnpaidDisabled, handlePaymentSubmission, paymentMethod, initiateUnpaidPayment, setReferenceNumber, setShowReferenceModal]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className={`relative rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Ringkasan Pembayaran</h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'}`}
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          {calculation && (
            <div className={`rounded-lg shadow p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Perhitungan</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Subtotal:</span>
                  <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(calculation.subTotal || 0)}</span>
                </div>
                {calculation.itemDiscount > 0 && (
                  <div className={`flex justify-between ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    <span>Penghematan Member (Harga Tier):</span>
                    <span>-{formatCurrency(calculation.itemDiscount || 0)}</span>
                  </div>
                )}
                <div className={`flex justify-between font-bold text-lg border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-2 mt-2`}>
                  <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>Total:</span>
                  <span className={`${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Additional Discount Input */}
          {setAdditionalDiscount && (
            <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex justify-between items-center mb-2">
                <h3 className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Diskon Keseluruhan</h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[200px]">
                  <label htmlFor="additionalDiscount" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Jumlah Diskon
                  </label>
                  <div className="relative">
                    <input
                      ref={discountInputRef}
                      type="number"
                      id="additionalDiscount"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      value={additionalDiscount}
                      onChange={(e) => setAdditionalDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                      min="0"
                      max={calculation?.subTotal || Number.MAX_SAFE_INTEGER}
                      placeholder="Masukkan jumlah diskon"
                    />
                    <div className={`absolute right-3 top-2.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      IDR
                    </div>
                  </div>
                </div>

              </div>

              {calculation && (
                <div className="mt-2 text-sm">
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal:</span>
                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>{formatCurrency(calculation.subTotal || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Diskon Tambahan:</span>
                    <span className={`${darkMode ? 'text-red-400' : 'text-red-600'} font-medium`}>-{formatCurrency(additionalDiscount)}</span>
                  </div>
                  <div className="flex justify-between font-bold mt-1 pt-1 border-t border-gray-300 dark:border-gray-600">
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Total Setelah Diskon:</span>
                    <span className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                      {formatCurrency((calculation.subTotal || 0) - additionalDiscount)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

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

            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
              <span>(Alt+S)</span>
              <span>(Alt+Enter)</span>
            </div>
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
                className="w-1/2 flex flex-col items-center justify-center py-3 px-2 sm:px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mb-1"></div>
                    <span className="text-xs sm:text-sm">Memproses...</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center mb-1">
                      <Save className="h-4 w-4" />
                    </div>
                    <span className="text-xs sm:text-sm">Simpan Hutang</span>
                    <span className={`text-[0.6rem] mt-1 px-1.5 py-0.5 rounded ${
                      darkMode ? 'bg-yellow-700 text-yellow-200' : 'bg-yellow-700 text-white'
                    }`}>
                      Alt+S
                    </span>
                  </>
                )}
              </button>
              <button
                onClick={handlePaymentSubmission}
                disabled={isPaidDisabled}
                className="w-1/2 flex flex-col items-center justify-center py-3 px-2 sm:px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mb-1"></div>
                    <span className="text-xs sm:text-sm">Memproses...</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center mb-1">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <span className="text-xs sm:text-sm">Bayar Lunas</span>
                    <span className={`text-[0.6rem] mt-1 px-1.5 py-0.5 rounded ${
                      darkMode ? 'bg-purple-700 text-purple-200' : 'bg-purple-700 text-white'
                    }`}>
                      Shift+Enter
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Tombol Clear Form di bawah tombol pembayaran */}
            <div className="mt-3">
              <button
                onClick={() => {
                  clearForm();
                  onClose();
                }}
                disabled={loading}
                className={`w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white flex items-center justify-center ${
                  darkMode
                    ? 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'
                    : 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex flex-col items-center">
                  <span>Bersihkan Form</span>
                  <span className={`text-[0.6rem] mt-1 px-2 py-0.5 rounded ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-400 text-white'
                  }`}>
                    Shift+R
                  </span>
                </div>
              </button>
            </div>
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
    </div>
  );
};

export default PaymentModal;