'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, CameraOff } from 'lucide-react';

const BarcodeScanner = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (!scannerRef.current) {
      return;
    }

    if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerRef.current.id);
    }
    const html5QrCode = html5QrCodeRef.current;
    
    setIsLoading(true);
    setError('');

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      videoConstraints: {
        facingMode: 'environment' // Prefer back camera
      }
    };

    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
      onScan(decodedText, decodedResult);
      handleStop();
    };

    const qrCodeErrorCallback = (errorMessage) => {
        //  Extensive logging can be enabled here if needed for debugging
        //  console.log(errorMessage);
    };
    
    html5QrCode.start(
        { facingMode: 'environment' },
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
    )
    .then(() => {
        setIsLoading(false);
    })
    .catch(err => {
      setError(`Tidak dapat memulai kamera. Pastikan Anda telah memberikan izin. Error: ${err.name}`);
      setIsLoading(false);
    });

    // Cleanup function to stop the scanner
    const handleStop = () => {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().catch(err => {
                console.error("Gagal menghentikan scanner.", err);
            });
        }
        onClose();
    };

    return () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().catch(err => {
                console.error("Gagal menghentikan scanner saat unmount.", err);
            });
        }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full relative">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scan Barcode</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 relative" style={{ height: '350px' }}>
          <div id="scanner-container" ref={scannerRef} className="w-full h-full rounded-lg overflow-hidden"></div>
          
          {(isLoading || error) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-800 bg-opacity-90">
              {isLoading && (
                <>
                  <div className="animate-pulse mb-4">
                    <CameraOff className="h-12 w-12 mx-auto text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Menyalakan kamera...</p>
                </>
              )}
              {error && (
                <div className="text-center">
                  <CameraOff className="h-12 w-12 mx-auto text-red-500 mb-4" />
                  <p className="text-red-500 font-medium">Gagal Mengakses Kamera</p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 px-4">{error}</p>
                   <button
                    onClick={onClose}
                    className="mt-6 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
         <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Arahkan kamera ke barcode produk. Pastikan cahaya cukup dan barcode tidak rusak.
            </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;