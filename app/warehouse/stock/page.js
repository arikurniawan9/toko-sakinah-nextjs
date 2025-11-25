'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ROLES } from '@/lib/constants';
import WarehouseProductModal from '@/components/warehouse/WarehouseProductModal';
import { useNotification } from '@/components/notifications/NotificationProvider';

export default function WarehouseStockPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [warehouseProducts, setWarehouseProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState('create');
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER)) {
      router.push('/unauthorized');
      return;
    }

    fetchData();
  }, [status, session, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [warehouseRes, productsRes] = await Promise.all([
        fetch('/api/warehouse/stock'),
        fetch('/api/products') // Ambil semua produk untuk keperluan modal
      ]);

      const warehouseData = await warehouseRes.json();
      const productsData = await productsRes.json();

      if (warehouseRes.ok) {
        setWarehouseProducts(warehouseData.warehouseProducts);
      } else {
        console.error('Failed to fetch warehouse stock:', warehouseData.error);
        setWarehouseProducts([]);
        showNotification('Gagal memuat data stok gudang', 'error');
      }

      if (productsRes.ok) {
        setAllProducts(productsData.products);
      } else {
        console.error('Failed to fetch products:', productsData.error);
        setAllProducts([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setWarehouseProducts([]);
      setAllProducts([]);
      showNotification('Terjadi kesalahan saat memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data setelah perubahan
  const handleSave = () => {
    fetchData();
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setModalAction('create');
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setModalAction('edit');
    setModalOpen(true);
  };

  const openViewModal = (product) => {
    setEditingProduct(product);
    setModalAction('view');
    setModalOpen(true);
  };

  // Filter produk berdasarkan pencarian dan filter
  const filteredProducts = warehouseProducts.filter(product => {
    const matchesSearch =
      product.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.product.productCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !filterCategory ||
      (product.product.category?.name?.toLowerCase().includes(filterCategory.toLowerCase()));

    const matchesLowStock = !filterLowStock || (product.quantity - product.reserved) < 10;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // Fungsi ekspor ke CSV
  const exportToCSV = () => {
    if (filteredProducts.length === 0) {
      showNotification('Tidak ada data untuk diekspor', 'warning');
      return;
    }

    const headers = ['Kode Produk', 'Nama Produk', 'Kategori', 'Stok Tersedia', 'Stok Terpesan', 'Stok Total', 'Harga Beli'];
    const csvContent = [
      headers.join(','),
      ...filteredProducts.map(item => [
        `"${item.product.productCode}"`,
        `"${item.product.name}"`,
        `"${item.product.category?.name || '-'}"`,
        item.quantity - item.reserved,
        item.reserved,
        item.quantity,
        item.product.purchasePrice || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `stok_gudang_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Data berhasil diekspor ke CSV', 'success');
  };

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (status !== 'authenticated' || (session.user.role !== ROLES.WAREHOUSE && session.user.role !== ROLES.MANAGER)) {
    router.push('/unauthorized');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Stok Gudang</h1>
          <div className="text-right">
            <p className="text-sm text-gray-600">Selamat datang,</p>
            <p className="font-medium">{session.user.name}</p>
            <p className="text-xs text-gray-500">{session.user.role}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Daftar Produk di Gudang</h2>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                  onClick={() => router.push('/warehouse/purchase')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200 text-sm whitespace-nowrap"
                >
                  + Buat Pembelian
                </button>
                <button
                  onClick={openCreateModal}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-200 text-sm whitespace-nowrap"
                >
                  + Tambah Produk ke Gudang
                </button>
                <button
                  onClick={() => router.push('/warehouse/distribution')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition duration-200 text-sm whitespace-nowrap"
                >
                  + Distribusi ke Toko
                </button>
              </div>
            </div>

            {/* Filter dan Pencarian */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Cari Produk</label>
                <input
                  type="text"
                  id="search"
                  placeholder="Cari berdasarkan nama atau kode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  id="category"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Semua Kategori</option>
                  {Array.from(new Set(warehouseProducts
                    .filter(wp => wp.product.category?.name)
                    .map(wp => wp.product.category.name)))
                    .map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filterLowStock}
                    onChange={(e) => setFilterLowStock(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Stok Rendah</span>
                </label>
              </div>

              <div className="flex items-end">
                <button
                  onClick={exportToCSV}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition duration-200 text-sm"
                >
                  Ekspor CSV
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Memuat data stok gudang...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Produk</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Produk</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Tersedia</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Terpesan</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Total</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Beli</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          {warehouseProducts.length === 0 ? 'Belum ada produk di gudang.' : 'Tidak ada produk yang sesuai dengan filter.'}
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((item) => {
                        const availableStock = item.quantity - item.reserved;
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.product.productCode}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{item.product.category?.name || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm ${
                                availableStock < 10 ? 'text-red-600 font-semibold' : 'text-gray-900'
                              }`}>
                                {availableStock}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{item.reserved}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{item.quantity}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">Rp {item.product.purchasePrice?.toLocaleString() || '0'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openViewModal(item)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Detail
                                </button>
                                <button
                                  onClick={() => openEditModal(item)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {warehouseProducts.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Belum ada produk di gudang.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Produk</h3>
            <p className="text-3xl font-bold text-blue-600">{warehouseProducts.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Stok Tersedia</h3>
            <p className="text-3xl font-bold text-green-600">
              {warehouseProducts.reduce((sum, wp) => sum + (wp.quantity - wp.reserved), 0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Stok Terpesan</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {warehouseProducts.reduce((sum, wp) => sum + wp.reserved, 0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Stok Total</h3>
            <p className="text-3xl font-bold text-purple-600">
              {warehouseProducts.reduce((sum, wp) => sum + wp.quantity, 0)}
            </p>
          </div>
        </div>
      </main>

      {/* Modal untuk CRUD produk gudang */}
      <WarehouseProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        product={editingProduct}
        action={modalAction}
        products={allProducts}
      />
    </div>
  );
}