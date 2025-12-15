'use client';

import { useState, useEffect, useRef } from 'react';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [scanningMode, setScanningMode] = useState('manual'); // 'manual' or 'camera'
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrcodeScanner = null;

    // Jika mode kamera dipilih dan library tersedia
    if (scanningMode === 'camera') {
      const initCameraScanner = async () => {
        try {
          // Menunggu library dimuat
          const html5QrcodeModule = await import('html5-qrcode');
          if (!html5QrcodeModule.Html5QrcodeScanner) {
            throw new Error('Html5QrcodeScanner not found in module');
          }

          const Html5QrcodeScanner = html5QrcodeModule.Html5QrcodeScanner;

          if (scannerRef.current) {
            html5QrcodeScanner = new Html5QrcodeScanner(
              scannerRef.current,
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                videoConstraints: {
                  facingMode: 'environment' // Menggunakan kamera belakang jika tersedia
                }
              },
              false
            );

            const onSuccess = (decodedText, decodedResult) => {
              onScan(decodedText, decodedResult);
              onClose(); // Tutup scanner setelah berhasil scan
              if (html5QrcodeScanner) {
                html5QrcodeScanner.clear().catch(console.error);
              }
            };

            html5QrcodeScanner.render(onSuccess, (errorMessage) => {
              // Hanya log error jika tidak dalam mode debugging
              console.log('Barcode scanning error:', errorMessage);
            });
          }
        } catch (err) {
          console.error('Scanner initialization error:', err);
          // Cek apakah error karena module tidak ditemukan
          const errorMessage = typeof err.message === 'string' ? err.message : String(err);
          if (errorMessage.includes('Cannot resolve') || errorMessage.includes('not found') || errorMessage.includes('Module not found')) {
            setError('Library html5-qrcode tidak ditemukan. Silakan install: npm install html5-qrcode');
          } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
            setError('Gagal memuat library html5-qrcode. Silakan cek koneksi internet dan install dependency.');
          } else {
            setError('Gagal menginisialisasi scanner: ' + errorMessage);
          }
          setScanningMode('manual'); // Kembali ke mode manual
        }
      };

      initCameraScanner();
    }

    return () => {
      // Membersihkan scanner jika sedang berjalan
      if (html5QrcodeScanner && scanningMode === 'camera') {
        html5QrcodeScanner.clear().catch(console.error);
      }
    };
  }, [scanningMode, onScan, onClose]);

  // Handler untuk scan manual
  const handleManualScan = () => {
    if (!manualCode.trim()) {
      setError('Silakan masukkan kode produk');
      return;
    }
    onScan(manualCode.trim(), null);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && scanningMode === 'manual') {
      handleManualScan();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Scan Barcode Produk</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="text-red-500 text-center mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Pilihan mode scan */}
          <div className="flex mb-4 border-b">
            <button
              className={`pb-2 px-4 ${scanningMode === 'manual' ? 'border-b-2 border-pastel-purple-500 text-pastel-purple-600' : 'text-gray-500'}`}
              onClick={() => setScanningMode('manual')}
            >
              Manual
            </button>
            <button
              className={`pb-2 px-4 ${scanningMode === 'camera' ? 'border-b-2 border-pastel-purple-500 text-pastel-purple-600' : 'text-gray-500'}`}
              onClick={() => setScanningMode('camera')}
            >
              Kamera
            </button>
          </div>

          {/* Mode manual */}
          {scanningMode === 'manual' && (
            <div className="mb-4">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Masukkan kode produk secara manual"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pastel-purple-500 focus:border-pastel-purple-500"
                autoFocus
              />
            </div>
          )}

          {/* Mode kamera */}
          {scanningMode === 'camera' && (
            <div ref={scannerRef} className="w-full flex justify-center">
              <div className="text-center">
                <div className="animate-pulse mb-4">
                  <svg className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm">Arahkan kamera ke barcode produk</p>
              </div>
            </div>
          )}

          {/* Tombol untuk mode manual */}
          {scanningMode === 'manual' && (
            <div className="flex space-x-3">
              <button
                onClick={handleManualScan}
                className="flex-1 px-4 py-2 bg-pastel-purple-600 text-white rounded-md hover:bg-pastel-purple-700"
              >
                Gunakan Kode
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Batal
              </button>
            </div>
          )}

          {scanningMode === 'camera' && (
            <div className="text-center">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Batal
              </button>
            </div>
          )}

          {/* Panduan instalasi */}
          {scanningMode === 'camera' && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                npm install html5-qrcode
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;