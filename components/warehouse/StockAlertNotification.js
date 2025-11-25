// components/warehouse/StockAlertNotification.js
import { useEffect, useState } from 'react';
import { useNotification } from '@/components/notifications/NotificationProvider';

const StockAlertNotification = ({ userId }) => {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/warehouse/stock');
        const data = await response.json();

        if (response.ok) {
          // Ambil produk dengan stok < 10 (stok rendah)
          const lowStockItems = data.warehouseProducts.filter(item => (item.quantity - item.reserved) < 10);
          setLowStockProducts(lowStockItems);
          
          // Tampilkan notifikasi toast untuk produk dengan stok sangat rendah (< 5)
          const criticalStockItems = lowStockItems.filter(item => (item.quantity - item.reserved) < 5);
          
          if (criticalStockItems.length > 0) {
            // Cek apakah sudah pernah menampilkan notifikasi untuk produk ini dalam sesi ini
            const newCriticalItems = criticalStockItems.filter(item => 
              !dismissedAlerts.has(item.id)
            );
            
            if (newCriticalItems.length > 0) {
              const productNames = newCriticalItems.slice(0, 3).map(item => item.product.name).join(', ');
              const additionalCount = newCriticalItems.length > 3 ? ` dan ${newCriticalItems.length - 3} produk lainnya` : '';
              
              showNotification(
                `Stok kritis untuk ${productNames}${additionalCount}. Segera lakukan restocking!`, 
                'error',
                { autoClose: 10000 }
              );
              
              // Tandai item-item ini sebagai sudah diingatkan
              const newDismissed = new Set(dismissedAlerts);
              newCriticalItems.forEach(item => newDismissed.add(item.id));
              setDismissedAlerts(newDismissed);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching low stock products:', error);
      } finally {
        setLoading(false);
      }
    };

    // Ambil data stok rendah secara berkala (setiap 5 menit)
    fetchLowStockProducts();
    const interval = setInterval(fetchLowStockProducts, 5 * 60 * 1000); // 5 menit

    return () => clearInterval(interval);
  }, [userId, showNotification, dismissedAlerts]);

  // Ambil produk dengan stok sangat rendah (< 5) untuk ditampilkan sebagai alert penting
  const criticalStockProducts = lowStockProducts.filter(item => (item.quantity - item.reserved) < 5);
  const lowStockProductsOnly = lowStockProducts.filter(item => 
    (item.quantity - item.reserved) >= 5 && (item.quantity - item.reserved) < 10
  );

  if (loading || (criticalStockProducts.length === 0 && lowStockProductsOnly.length === 0)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {criticalStockProducts.length > 0 && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg max-w-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold">peringatan Kritis!</p>
              <p className="text-sm">
                {criticalStockProducts.length} produk dengan stok sangat rendah
              </p>
              <div className="mt-2 max-h-32 overflow-y-auto">
                <ul className="text-xs space-y-1">
                  {criticalStockProducts.slice(0, 5).map((item) => (
                    <li key={item.id} className="truncate">
                      {item.product.name}: {item.quantity - item.reserved} tersisa
                    </li>
                  ))}
                  {criticalStockProducts.length > 5 && (
                    <li>dan {criticalStockProducts.length - 5} lainnya...</li>
                  )}
                </ul>
              </div>
            </div>
            <button 
              onClick={() => {
                const newDismissed = new Set(dismissedAlerts);
                criticalStockProducts.forEach(item => newDismissed.add(item.id));
                setDismissedAlerts(newDismissed);
              }}
              className="text-red-700 hover:text-red-900 text-lg"
            >
              &times;
            </button>
          </div>
        </div>
      )}
      
      {lowStockProductsOnly.length > 0 && criticalStockProducts.length === 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-lg max-w-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold">peringatan Stok Rendah</p>
              <p className="text-sm">
                {lowStockProductsOnly.length} produk perlu diperhatikan
              </p>
              <div className="mt-2 max-h-24 overflow-y-auto">
                <ul className="text-xs space-y-1">
                  {lowStockProductsOnly.slice(0, 3).map((item) => (
                    <li key={item.id} className="truncate">
                      {item.product.name}: {item.quantity - item.reserved} tersisa
                    </li>
                  ))}
                  {lowStockProductsOnly.length > 3 && (
                    <li>dan {lowStockProductsOnly.length - 3} lainnya...</li>
                  )}
                </ul>
              </div>
            </div>
            <button 
              onClick={() => {
                const newDismissed = new Set(dismissedAlerts);
                lowStockProductsOnly.forEach(item => newDismissed.add(item.id));
                setDismissedAlerts(newDismissed);
              }}
              className="text-yellow-700 hover:text-yellow-900 text-lg"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAlertNotification;