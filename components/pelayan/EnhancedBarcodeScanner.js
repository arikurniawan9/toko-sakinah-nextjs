'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';
import { X, CameraOff, RotateCcw, Camera as CameraIcon, WifiOff, RefreshCw } from 'lucide-react';
import CameraPermissionModal from './CameraPermissionModal';

const EnhancedBarcodeScanner = ({ onScan, onClose, onError }) => {
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [cameraOptions, setCameraOptions] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState('environment'); // default to back camera
  const [isOnline, setIsOnline] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const html5QrCodeRef = useRef(null);
  const retryAttempts = useRef(0);
  const maxRetries = 3;

  // Fungsi untuk mengecek koneksi internet
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get available cameras
  const getAvailableCameras = useCallback(async () => {
    if (!navigator.onLine) {
      setOfflineMode(true);
      setError('Mode offline: Tidak dapat mengakses kamera karena tidak ada koneksi internet.');
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      // Format camera options
      const formattedOptions = videoDevices.map((device, index) => ({
        id: device.deviceId,
        label: device.label || `Kamera ${index + 1}`,
        facingMode: device.label.toLowerCase().includes('back') ? 'environment' :
                   device.label.toLowerCase().includes('front') ? 'user' : 'environment'
      }));

      setCameraOptions(formattedOptions);

      // Set default camera (prefer back camera)
      const backCamera = formattedOptions.find(cam => cam.facingMode === 'environment');
      const frontCamera = formattedOptions.find(cam => cam.facingMode === 'user');

      if (backCamera) {
        setSelectedCamera(backCamera.id);
        setCurrentFacingMode('environment');
      } else if (frontCamera) {
        setSelectedCamera(frontCamera.id);
        setCurrentFacingMode('user');
      } else if (formattedOptions.length > 0) {
        setSelectedCamera(formattedOptions[0].id);
      }
    } catch (err) {
      console.error('Error getting camera options:', err);
      if (err.name === 'NotAllowedError' || err.message.includes('denied')) {
        setError('Izin kamera ditolak. Harap izinkan akses kamera di pengaturan browser Anda.');
        onError && onError('Izin kamera ditolak');
        // Tampilkan modal izin kamera hanya jika belum ditampilkan
        if (!showPermissionModal) {
          setShowPermissionModal(true);
        }
      } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
        setError('Kamera tidak ditemukan atau tidak dapat diakses. Coba ganti kamera lain jika tersedia.');
        onError && onError('Kamera tidak ditemukan');
      } else if (err.name === 'NotSupportedError') {
        setError('Fitur kamera tidak didukung di browser ini. Coba gunakan browser modern seperti Chrome atau Firefox.');
        onError && onError('Fitur kamera tidak didukung');
      } else {
        // Fallback to default configuration
        setCameraOptions([{ id: 'default', label: 'Kamera Default', facingMode: 'environment' }]);
        setSelectedCamera('default');
        setCurrentFacingMode('environment');
      }
    }
  }, [onError, showPermissionModal]);

  // Initialize scanner
  const initializeScanner = useCallback(async () => {
    if (!scannerRef.current || !selectedCamera || offlineMode) return;

    try {
      if (html5QrCodeRef.current) {
        // Stop existing scanner if running
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      }

      html5QrCodeRef.current = new Html5Qrcode(scannerRef.current.id, {
        formatsToSupport: [
          Html5QrcodeScanner.SUPPORTED_FORMATS.QR_CODE,
          Html5QrcodeScanner.SUPPORTED_FORMATS.CODE_128,
          Html5QrcodeScanner.SUPPORTED_FORMATS.CODE_39,
          Html5QrcodeScanner.SUPPORTED_FORMATS.EAN_13,
          Html5QrcodeScanner.SUPPORTED_FORMATS.EAN_8,
          Html5QrcodeScanner.SUPPORTED_FORMATS.UPC_A,
          Html5QrcodeScanner.SUPPORTED_FORMATS.UPC_E,
          Html5QrcodeScanner.SUPPORTED_FORMATS.CODABAR
        ],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      });

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        aspectRatio: 1.777777778, // 16:9 aspect ratio for better mobile display
        videoConstraints: {
          deviceId: selectedCamera,
          facingMode: currentFacingMode
        }
      };

      const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        onScan(decodedText, decodedResult);
        // Jangan hentikan scanner setelah scan berhasil, biarkan terus scan
        // handleStop();
      };

      const qrCodeErrorCallback = (errorMessage) => {
        // Hanya log error jika perlu untuk debugging
        // console.log(errorMessage);
      };

      await html5QrCodeRef.current.start(
        selectedCamera,
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Error initializing scanner:', err);
      retryAttempts.current += 1;

      if (retryAttempts.current <= maxRetries) {
        // Coba ulang setelah delay
        setTimeout(() => {
          initializeScanner();
        }, 1000 * retryAttempts.current); // Delay bertambah setiap percobaan
      } else {
        if (err.name === 'NotAllowedError' || err.message.includes('denied')) {
          setError('Izin kamera ditolak. Harap izinkan akses kamera di pengaturan browser Anda.');
          onError && onError('Izin kamera ditolak');
        } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
          setError('Kamera tidak ditemukan atau tidak dapat diakses. Coba ganti kamera lain jika tersedia.');
          onError && onError('Kamera tidak ditemukan');
        } else if (err.name === 'NotSupportedError') {
          setError('Fitur kamera tidak didukung di browser ini. Coba gunakan browser modern seperti Chrome atau Firefox.');
          onError && onError('Fitur kamera tidak didukung');
        } else if (err.name === 'NotAllowedError') {
          setError('Akses kamera ditolak oleh browser atau sistem operasi.');
          onError && onError('Akses kamera ditolak');
        } else {
          setError(`Tidak dapat memulai kamera. Error: ${err.message || err.name}`);
          onError && onError(`Tidak dapat memulai kamera: ${err.message || err.name}`);
        }
      }
    }
  }, [selectedCamera, currentFacingMode, onScan, onError, offlineMode]);

  // Handle camera change
  const handleCameraChange = useCallback((deviceId) => {
    const camera = cameraOptions.find(cam => cam.id === deviceId);
    if (camera) {
      setSelectedCamera(deviceId);
      setCurrentFacingMode(camera.facingMode);
    }
  }, [cameraOptions]);

  // Toggle camera (front/back)
  const toggleCamera = useCallback(() => {
    if (cameraOptions.length <= 1) return;

    const currentIndex = cameraOptions.findIndex(cam => cam.id === selectedCamera);
    const nextIndex = (currentIndex + 1) % cameraOptions.length;
    const nextCamera = cameraOptions[nextIndex];

    setSelectedCamera(nextCamera.id);
    setCurrentFacingMode(nextCamera.facingMode);
  }, [cameraOptions, selectedCamera]);

  // Stop scanner
  const handleStop = useCallback(async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Gagal menghentikan scanner.", err);
      }
    }
    onClose();
  }, [onClose]);

  // Retry initialization
  const handleRetry = useCallback(() => {
    setError('');
    setShowPermissionModal(false);
    retryAttempts.current = 0;
    getAvailableCameras();
  }, [getAvailableCameras]);

  // Initialize on mount and when selectedCamera changes
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      setRequestingPermission(true);

      try {
        // Langsung coba akses kamera tanpa mengecek izin terlebih dahulu
        if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia !== 'undefined') {
          // Coba langsung akses kamera
          await getAvailableCameras();
        } else {
          throw new Error('navigator.mediaDevices API tidak didukung di browser ini');
        }
      } catch (err) {
        console.error('Error during camera initialization:', err);
        if (err.name === 'NotAllowedError' || err.message.includes('denied')) {
          setError('Izin kamera ditolak. Harap izinkan akses kamera di pengaturan browser Anda.');
          onError && onError('Izin kamera ditolak');
          // Tampilkan modal izin kamera
          setShowPermissionModal(true);
        } else {
          setError(`Tidak dapat mengakses kamera. Error: ${err.message || err.name}`);
          onError && onError(`Tidak dapat mengakses kamera: ${err.message || err.name}`);
        }
      } finally {
        setRequestingPermission(false);
        setIsLoading(false);
      }
    };

    initialize();
  }, [getAvailableCameras, onError]);

  useEffect(() => {
    if (selectedCamera && !requestingPermission && !error) {
      setIsLoading(true);
      initializeScanner();
    }

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => {
          console.error("Gagal menghentikan scanner saat unmount.", err);
        });
      }
    };
  }, [selectedCamera, initializeScanner, requestingPermission, error]);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-[1000] p-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md flex flex-col h-[90vh] max-h-[90vh]">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scan Barcode</h3>
              {!isOnline && (
                <div className="ml-2 flex items-center text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {cameraOptions.length > 1 && (
                <button
                  onClick={toggleCamera}
                  className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  title="Ganti Kamera"
                >
                  <RotateCcw size={18} />
                </button>
              )}
              <button
                onClick={handleStop}
                className="p-2 rounded-full text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 relative p-2" style={{ minHeight: '300px' }}>
            <div
              id="scanner-container"
              ref={scannerRef}
              className="w-full h-full rounded-lg overflow-hidden bg-black flex items-center justify-center"
            >
              {requestingPermission && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-10">
                  <div className="animate-pulse mb-4">
                    <CameraIcon className="h-12 w-12 mx-auto text-gray-400" />
                  </div>
                  <p className="text-white text-sm text-center px-4">
                    Mohon izinkan akses kamera untuk melanjutkan pemindaian
                  </p>
                  <div className="mt-4 w-8 h-8 border-2 border-t-purple-500 border-r-purple-500 border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {isLoading && !requestingPermission && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                  <p className="text-white text-sm">Menyiapkan kamera...</p>
                </div>
              )}

              {!isLoading && !requestingPermission && error && !showPermissionModal && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-10">
                  <div className="flex flex-col items-center justify-center h-full p-4">
                    <CameraOff className="h-12 w-12 mx-auto text-red-500 mb-4" />
                    <p className="text-red-500 font-medium text-center mb-2">Gagal Mengakses Kamera</p>
                    <p className="text-white text-sm mb-4 text-center">{error}</p>

                    <div className="flex space-x-2">
                      <button
                        onClick={handleRetry}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Coba Lagi
                      </button>
                      <button
                        onClick={handleStop}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* QR Box overlay */}
              {!isLoading && !requestingPermission && !error && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    <div className="border-2 border-transparent">
                      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-green-500 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-green-500 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-green-500 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-green-500 rounded-br-lg"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
                Arahkan kamera ke barcode produk. Pastikan cahaya cukup dan barcode tidak rusak.
              </p>

              {cameraOptions.length > 1 && (
                <div className="w-full mt-2">
                  <select
                    value={selectedCamera}
                    onChange={(e) => handleCameraChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  >
                    {cameraOptions.map((camera) => (
                      <option key={camera.id} value={camera.id}>
                        {camera.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CameraPermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onRetry={() => {
          setShowPermissionModal(false);
          handleRetry();
        }}
      />
    </>
  );
};

export default EnhancedBarcodeScanner;