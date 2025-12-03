// components/kasir/transaksi/ReferenceModal.js
import { memo } from 'react';
import { X } from 'lucide-react';

const ReferenceModal = memo(({ 
  isOpen, 
  onClose, 
  onSubmit, 
  paymentMethod, 
  darkMode,
  referenceNumber,
  setReferenceNumber,
  loading = false
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(referenceNumber);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className={`relative rounded-xl shadow-2xl w-full max-w-md ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className={`p-6 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex justify-between items-center">
            <h3 className={`text-xl font-semibold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Nomor Referensi {paymentMethod}
            </h3>
            <button
              onClick={onClose}
              className={`p-1 rounded-full ${
                darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'
              }`}
              disabled={loading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="mb-4">
              <p className={`${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              } mb-4`}>
                {paymentMethod === 'QRIS' 
                  ? 'Masukkan kode pembayaran QRIS yang muncul setelah scan QR'
                  : 'Masukkan nomor referensi atau ID transaksi dari aplikasi pembayaran'}
              </p>
              
              <label htmlFor="referenceNumber" className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Nomor Referensi
              </label>
              <input
                type="text"
                id="referenceNumber"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Contoh: PAY123456789, TRF0012345"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  darkMode 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
                disabled={loading}
                required
                maxLength={50}
                minLength={4}
              />
              <p className={`mt-1 text-xs ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Masukkan nomor referensi ({paymentMethod}) - 4-50 karakter
              </p>
            </div>
          </div>

          <div className={`p-6 border-t ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-50'
                }`}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || referenceNumber.length < 4}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium text-white ${
                  darkMode
                    ? 'bg-purple-600 hover:bg-purple-700 disabled:opacity-50'
                    : 'bg-purple-600 hover:bg-purple-700 disabled:opacity-50'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Menyimpan...
                  </>
                ) : (
                  'Simpan'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});

export default ReferenceModal;