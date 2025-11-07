// app/admin/produk/page.js
'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Sidebar from '../../../components/Sidebar';
import { useDarkMode } from '../../../components/DarkModeContext';

import { useProductTable } from '../../../lib/hooks/useProductTable';
import { useProductForm } from '../../../lib/hooks/useProductForm';
import { useTableSelection } from '../../../lib/hooks/useTableSelection';

import ProductTable from '../../../components/produk/ProductTable';
import ProductModal from '../../../components/produk/ProductModal';
import Toolbar from '../../../components/produk/Toolbar';
import Pagination from '../../../components/produk/Pagination';

export default function ProductManagement() {
  const { darkMode } = useDarkMode();

  const {
    products,
    loading,
    error: tableError,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalProducts,
    fetchProducts,
    setError: setTableError,
  } = useProductTable();

  const {
    showModal,
    editingProduct,
    formData,
    error: formError,
    success,
    handleInputChange,
    openModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave,
    setError: setFormError,
    setSuccess,
  } = useProductForm(fetchProducts);

  const { selectedRows, handleSelectAll, handleSelectRow, clearSelection, setSelectedRows } = useTableSelection(products);

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch categories and suppliers once
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catResponse, supResponse] = await Promise.all([
          fetch('/api/kategori'),
          fetch('/api/supplier'),
        ]);
        const catData = await catResponse.json();
        const supData = await supResponse.json();
        setCategories(catData.categories || []);
        setSuppliers(supData.suppliers || []);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setTableError('Gagal memuat data pendukung (kategori/supplier).');
      }
    };
    fetchInitialData();
  }, [setTableError]);

  const handleDelete = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      try {
        const response = await fetch(`/api/produk?id=${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Gagal menghapus produk');
        }
        fetchProducts();
        setSelectedRows(prev => prev.filter(rowId => rowId !== id));
        setSuccess('Produk berhasil dihapus');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setTableError('Terjadi kesalahan saat menghapus produk: ' + err.message);
        setTimeout(() => setTableError(''), 5000);
      }
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedRows.length === 0) return;
    if (confirm(`Apakah Anda yakin ingin menghapus ${selectedRows.length} produk?`)) {
      try {
        const response = await fetch('/api/produk', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedRows })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Gagal menghapus produk');
        }
        fetchProducts();
        clearSelection();
        setSuccess(`Berhasil menghapus ${selectedRows.length} produk`);
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setTableError('Terjadi kesalahan saat menghapus produk: ' + err.message);
        setTimeout(() => setTableError(''), 5000);
      }
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/produk');
      if (!response.ok) throw new Error('Gagal mengambil data untuk export');
      const data = await response.json();

      let csvContent = 'Nama,Kode,Harga,Stok,Kategori,Supplier,Deskripsi,Tanggal Dibuat,Tanggal Diubah\n';
      data.products.forEach(product => {
        const category = categories.find(cat => cat.id === product.categoryId);
        const supplier = suppliers.find(supp => supp.id === product.supplierId);
        const row = [
          `"${product.name.replace(/"/g, '""')}"`,
          `"${product.code.replace(/"/g, '""')}"`,
          product.price,
          product.stock,
          `"${category?.name || ''}"`,
          `"${supplier?.name || ''}"`,
          `"${product.description ? product.description.replace(/"/g, '""') : ''}"`,
          `"${new Date(product.createdAt).toLocaleDateString('id-ID')}"`,
          `"${new Date(product.updatedAt).toLocaleDateString('id-ID')}"`
        ].join(',');
        csvContent += row + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `produk-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess('Data produk berhasil diekspor');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setTableError('Terjadi kesalahan saat export: ' + err.message);
      setTimeout(() => setTableError(''), 5000);
    } finally {
      setExportLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls') && !file.name.toLowerCase().endsWith('.csv')) {
      setTableError('Silakan pilih file Excel (.xlsx, .xls) atau CSV (.csv)');
      setTimeout(() => setTableError(''), 5000);
      e.target.value = '';
      return;
    }

    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      setSuccess(`Memproses file ${file.name}...`);
      const response = await fetch('/api/produk/import', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal mengimport produk');
      fetchProducts();
      setSuccess(result.message || `Berhasil mengimport ${result.importedCount || 0} produk`);
      e.target.value = '';
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setTableError('Terjadi kesalahan saat import: ' + err.message);
      e.target.value = '';
      setTimeout(() => setTableError(''), 7000);
    } finally {
      setImportLoading(false);
    }
  };

  const error = tableError || formError;

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <Sidebar>
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Manajemen Produk
          </h1>

          <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
            <div className="p-4 sm:p-6">
              <Toolbar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(value) => {
                  setItemsPerPage(value);
                  setCurrentPage(1);
                }}
                onAddNew={openModalForCreate}
                onDeleteMultiple={handleDeleteMultiple}
                selectedRowsCount={selectedRows.length}
                onExport={handleExport}
                onImport={handleImport}
                importLoading={importLoading}
                exportLoading={exportLoading}
                darkMode={darkMode}
              />

              {error && (
                <div className={`my-4 p-4 ${darkMode ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'} rounded-md`}>
                  {error}
                </div>
              )}
              {success && (
                <div className={`my-4 p-4 ${darkMode ? 'bg-green-900/30 border-green-700 text-green-200' : 'bg-green-50 border-green-200 text-green-700'} rounded-md`}>
                  {success}
                </div>
              )}

              <ProductTable
                products={products}
                loading={loading}
                darkMode={darkMode}
                selectedRows={selectedRows}
                handleSelectAll={handleSelectAll}
                handleSelectRow={handleSelectRow}
                onEdit={openModalForEdit}
                onDelete={handleDelete}
              />
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalProducts={totalProducts}
              darkMode={darkMode}
            />
          </div>

          <ProductModal
            showModal={showModal}
            closeModal={closeModal}
            editingProduct={editingProduct}
            formData={formData}
            handleInputChange={handleInputChange}
            handleSave={handleSave}
            darkMode={darkMode}
            categories={categories}
            suppliers={suppliers}
          />
        </main>
      </Sidebar>
    </ProtectedRoute>
  );
}