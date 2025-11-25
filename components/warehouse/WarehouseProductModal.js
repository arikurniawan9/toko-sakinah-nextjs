'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '@/components/notifications/NotificationProvider';

const WarehouseProductModal = ({
  isOpen,
  onClose,
  onSave,
  product = null,
  action = 'create',
  products = [],
  categories = []
}) => {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 0,
    reserved: 0
  });
  const [availableProducts, setAvailableProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  // Ambil warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await fetch('/api/warehouse');
        const data = await res.json();
        if (res.ok) {
          setWarehouses(data.warehouses || []);
          if (data.warehouses && data.warehouses.length > 0) {
            setSelectedWarehouse(data.warehouses[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      }
    };

    if (isOpen) {
      fetchWarehouses();
    }
  }, [isOpen]);

  // Filter products yang belum ada di warehouse atau yang sedang diedit
  useEffect(() => {
    if (action === 'create') {
      // Hanya tampilkan produk yang belum ada di warehouse
      const productIdsInWarehouse = products.map(wp => wp.productId);
      const filteredProducts = products.filter(p => !productIdsInWarehouse.includes(p.id));
      setAvailableProducts(filteredProducts);
    } else {
      // Untuk edit, tampilkan semua produk termasuk yang sedang diedit
      setAvailableProducts(products);
    }
  }, [action, products]);

  useEffect(() => {
    if (product && action === 'edit') {
      setFormData({
        productId: product.productId,
        quantity: product.quantity,
        reserved: product.reserved
      });
      setSelectedWarehouse(product.warehouseId);
    } else if (action === 'create') {
      setFormData({
        productId: '',
        quantity: 0,
        reserved: 0
      });
    }
  }, [product, action]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = action === 'create' ? 'POST' : 'PUT';
      const url = action === 'create' ? `/api/warehouse/stock` : `/api/warehouse/stock/${product.id}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
          reserved: parseInt(formData.reserved),
          warehouseId: selectedWarehouse
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showNotification(
          action === 'create'
            ? 'Produk berhasil ditambahkan ke gudang'
            : 'Produk berhasil diperbarui di gudang',
          'success'
        );
        onSave();
        onClose();
      } else {
        showNotification(result.message || `Gagal ${action === 'create' ? 'menambahkan' : 'memperbarui'} produk`, 'error');
      }
    } catch (error) {
      showNotification(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus produk ini dari gudang?')) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/warehouse/stock/${product.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        showNotification('Produk berhasil dihapus dari gudang', 'success');
        onSave();
        onClose();
      } else {
        showNotification(result.message || 'Gagal menghapus produk', 'error');
      }
    } catch (error) {
      showNotification(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {action === 'create' ? 'Tambah Produk ke Gudang' :
             action === 'edit' ? 'Edit Produk di Gudang' :
             'Detail Produk di Gudang'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="warehouseId" className="block text-sm font-medium text-gray-700 mb-1">
                  Gudang *
                </label>
                <select
                  id="warehouseId"
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  required
                  disabled={action !== 'create'}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                    focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${action !== 'create' ? 'bg-gray-100' : ''}`}
                >
                  <option value="">Pilih Gudang</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-1">
                  Produk *
                </label>
                <select
                  id="productId"
                  value={formData.productId}
                  onChange={(e) => setFormData({...formData, productId: e.target.value})}
                  required
                  disabled={action !== 'create'}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                    focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${action !== 'create' ? 'bg-gray-100' : ''}`}
                >
                  <option value="">Pilih Produk</option>
                  {availableProducts.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name} ({prod.productCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Stok
                </label>
                <input
                  type="number"
                  id="quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                    focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="reserved" className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Terpesan
                </label>
                <input
                  type="number"
                  id="reserved"
                  value={formData.reserved}
                  onChange={(e) => setFormData({...formData, reserved: parseInt(e.target.value) || 0})}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                    focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {action === 'view' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">Informasi Tambahan:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Gudang:</span> {warehouses.find(wh => wh.id === product.warehouseId)?.name || 'N/A'}</div>
                  <div><span className="font-medium">Kategori:</span> {product.product.category?.name || '-'}</div>
                  <div><span className="font-medium">Stok Tersedia:</span> {product.quantity - product.reserved}</div>
                  <div><span className="font-medium">Dibuat:</span> {new Date(product.createdAt).toLocaleString()}</div>
                  <div><span className="font-medium">Diubah:</span> {new Date(product.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <div>
              {action !== 'create' && action !== 'view' && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  Hapus
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Batal
              </button>
              {action !== 'view' && (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : (action === 'create' ? 'Simpan' : 'Perbarui')}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WarehouseProductModal;