// components/kasir/transaksi/LowStockModal.js
import { AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

const LowStockModal = ({ items, isOpen, onClose, darkMode }) => {
  if (!isOpen || !items || items.length === 0) {
    return null;
  }

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

  // Filter produk dengan stok rendah (kurang dari 5)
  const lowStockItems = items.filter(item => item.stock < 5);

  if (lowStockItems.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className={`relative rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className={`p-6 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <AlertTriangle className={`h-6 w-6 mr-2 ${
                darkMode ? 'text-yellow-400' : 'text-yellow-600'
              }`} />
              <h3 className={`text-xl font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Peringatan Stok Rendah
              </h3>
            </div>
            <button
              onClick={onClose}
              className={`p-1 rounded-full ${
                darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <p className={`${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Produk berikut memiliki stok yang rendah:
            </p>
            
            <div className="space-y-3">
              {lowStockItems.map((item, index) => (
                <div 
                  key={item.productId || index} 
                  className={`p-4 rounded-lg border flex items-center justify-between ${
                    item.stock === 0 
                      ? (darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-300') 
                      : (darkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-300')
                  }`}
                >
                  <div>
                    <p className={`font-medium ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {item.name}
                    </p>
                    <p className={`text-sm ${
                      item.stock === 0 
                        ? (darkMode ? 'text-red-400' : 'text-red-600')
                        : (darkMode ? 'text-yellow-400' : 'text-yellow-600')
                    }`}>
                      Stok tersedia: {item.stock} buah
                    </p>
                  </div>
                  <div className={`text-lg font-bold px-3 py-1 rounded-full ${
                    item.stock === 0 
                      ? (darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800')
                      : (darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800')
                  }`}>
                    {item.stock}
                  </div>
                </div>
              ))}
            </div>
            
            <div className={`p-4 rounded-lg ${
              darkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-300'
            }`}>
              <p className={`${
                darkMode ? 'text-blue-300' : 'text-blue-700'
              } text-sm`}>
                <strong>Rekomendasi:</strong> Segera lakukan restocking untuk produk-produk di atas 
                agar tidak mengganggu proses penjualan.
              </p>
            </div>
          </div>
        </div>
        
        <div className={`p-6 border-t ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LowStockModal;