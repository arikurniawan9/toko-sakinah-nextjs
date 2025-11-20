'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ROLES } from '@/lib/constants';

export default function WarehousePurchasePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchaseData, setPurchaseData] = useState({
    supplierId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    items: [],
  });
  const [newItem, setNewItem] = useState({
    productId: '',
    quantity: 1,
    purchasePrice: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER && session.user.role !== ROLES.ADMIN)) {
      router.push('/unauthorized');
      return;
    }
    
    fetchInitialData();
  }, [status, session, router]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [suppliersRes, productsRes] = await Promise.all([
        fetch('/api/warehouse/suppliers'),
        fetch('/api/warehouse/products'),
      ]);

      const suppliersData = await suppliersRes.json();
      const productsData = await productsRes.json();

      if (suppliersRes.ok) {
        setSuppliers(suppliersData.suppliers);
      } else {
        console.error('Failed to fetch suppliers:', suppliersData.error);
        setSuppliers([]);
      }

      if (productsRes.ok) {
        setProducts(productsData.products);
      } else {
        console.error('Failed to fetch products:', productsData.error);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching initial data for warehouse purchase:', error);
      setSuppliers([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };


  if (status === 'loading' || loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (status !== 'authenticated' || (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER && session.user.role !== ROLES.ADMIN)) {
    router.push('/unauthorized');
    return null;
  }

  const handleAddItem = () => {
    if (newItem.productId && newItem.quantity > 0 && newItem.purchasePrice > 0) {
      setPurchaseData({
        ...purchaseData,
        items: [...purchaseData.items, { ...newItem, id: Date.now() }], // Gunakan timestamp sebagai ID sementara
      });
      setNewItem({ productId: '', quantity: 1, purchasePrice: 0 });
    }
  };

  const handleRemoveItem = (id) => {
    setPurchaseData({
      ...purchaseData,
      items: purchaseData.items.filter(item => item.id !== id),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/warehouse/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...purchaseData,
          userId: session.user.id,
          totalAmount: purchaseData.items.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0),
        }),
      });

      if (response.ok) {
        alert('Pembelian berhasil disimpan');
        router.push('/warehouse');
      } else {
        const error = await response.json();
        alert(error.message || 'Gagal menyimpan pembelian');
      }
    } catch (error) {
      alert('Terjadi kesalahan saat menyimpan pembelian');
      console.error('Error submitting purchase:', error);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Buat Pembelian Baru</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Memasukkan stok barang dari supplier ke gudang pusat.</p>
      </div>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Pilih Supplier *
              </label>
              <select
                id="supplierId"
                value={purchaseData.supplierId}
                onChange={(e) => setPurchaseData({...purchaseData, supplierId: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Pilih Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Tanggal Pembelian *
              </label>
              <input
                type="date"
                id="purchaseDate"
                value={purchaseData.purchaseDate}
                onChange={(e) => setPurchaseData({...purchaseData, purchaseDate: e.target.value})}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div className="mb-8 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tambahkan Produk</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label htmlFor="productId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Produk
                </label>
                <select
                  id="productId"
                  value={newItem.productId}
                  onChange={(e) => setNewItem({...newItem, productId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Pilih Produk</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jumlah
                </label>
                <input
                  type="number"
                  id="quantity"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Harga Beli
                </label>
                <input
                  type="number"
                  id="purchasePrice"
                  value={newItem.purchasePrice}
                  onChange={(e) => setNewItem({...newItem, purchasePrice: parseInt(e.target.value) || 0})}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200"
                >
                  Tambah
                </button>
              </div>
            </div>

            {purchaseData.items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Produk</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jumlah</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Harga Beli</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subtotal</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {purchaseData.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-200">{products.find(p => p.id === item.productId)?.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-200">{item.quantity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-200">Rp {item.purchasePrice.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-200">Rp {(item.quantity * item.purchasePrice).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <td colSpan="3" className="px-6 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-200">Total</td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-gray-200">
                        Rp {purchaseData.items.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0).toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={purchaseData.items.length === 0}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Simpan Pembelian
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}