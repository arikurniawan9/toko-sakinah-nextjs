// app/admin/produk/page.js
'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useDarkMode } from '../../../components/DarkModeContext';
import { useSession } from 'next-auth/react'; // Import useSession

import { useProductTable } from '../../../lib/hooks/useProductTable';
import { useProductForm } from '../../../lib/hooks/useProductForm';
import { useTableSelection } from '../../../lib/hooks/useTableSelection';

import ProductTable from '../../../components/produk/ProductTable';
import ProductModal from '../../../components/produk/ProductModal';
import ProductDetailModal from '../../../components/produk/ProductDetailModal';
import Toolbar from '../../../components/produk/Toolbar';
import ConfirmationModal from '../../../components/ConfirmationModal';
import Pagination from '../../../components/produk/Pagination';

export default function ProductManagement() {
  const { darkMode } = useDarkMode();
  const { data: session } = useSession(); // Get session data
  const isAdmin = session?.user?.role === 'ADMIN'; // Determine if user is admin

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
    handleTierChange,
    addTier,
    removeTier,
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

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);

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

  const handleDelete = (id) => {
    if (!isAdmin) return; // Prevent delete if not admin
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteMultiple = () => {
    if (!isAdmin || selectedRows.length === 0) return; // Prevent delete if not admin or no rows selected
    setItemToDelete(selectedRows);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !isAdmin) return; // Ensure admin role before confirming delete
    setIsDeleting(true);

    const isMultiple = Array.isArray(itemToDelete);
    let url = '/api/produk';
    let options = {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    };

    if (isMultiple) {
      options.body = JSON.stringify({ ids: itemToDelete });
    } else {
      url += `?id=${itemToDelete}`;
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus produk');
      }

      fetchProducts();
      if (isMultiple) {
        clearSelection();
        setSuccess(`Berhasil menghapus ${itemToDelete.length} produk`);
      } else {
        setSelectedRows(prev => prev.filter(rowId => rowId !== itemToDelete));
        setSuccess('Produk berhasil dihapus');
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setTableError('Terjadi kesalahan saat menghapus: ' + err.message);
      setTimeout(() => setTableError(''), 5000);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleViewDetails = (product) => {
    setSelectedProductForDetail(product);
    setShowDetailModal(true);
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/produk');
      if (!response.ok) throw new Error('Gagal mengambil data untuk export');
      const data = await response.json();

      let csvContent = 'Nama,Kode,Harga,Stok,Kategori,Supplier,Deskripsi,Tanggal Dibuat,Tanggal Diubah\n';
      data.products.forEach(product => {
        const basePrice = product.priceTiers?.sort((a, b) => a.minQty - b.minQty)[0]?.price || 0;
        const category = categories.find(cat => cat.id === product.categoryId);
        const supplier = suppliers.find(supp => supp.id === product.supplierId);
        const row = [
          `"${product.name.replace(/"/g, '""')}"`,
          `"${product.productCode.replace(/"/g, '""')}"`,
          basePrice,
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
    if (!isAdmin) return; // Prevent import if not admin
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
      <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900 text-gray-100' : ''}`}>
        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Manajemen Produk
        </h1>

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-pastel-purple-700' : 'bg-white border-gray-200'} border`}>
          <div className="p-4 sm:p-6">
            {isAdmin && ( // Only show full toolbar for admin
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
            )}
            {!isAdmin && ( // Show simplified toolbar for cashier
              <div className="mb-4 flex justify-between items-center">
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full md:w-1/3 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-pastel-purple-500 focus:border-pastel-purple-500 sm:text-sm ${
                    darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                  }`}
                />
                <button
                  onClick={handleExport}
                  disabled={exportLoading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    darkMode ? 'bg-pastel-purple-600 hover:bg-pastel-purple-700' : 'bg-pastel-purple-600 hover:bg-pastel-purple-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-purple-500`}
                >
                  {exportLoading ? 'Mengekspor...' : 'Export'}
                </button>
              </div>
            )}

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
              handleSelectAll={isAdmin ? handleSelectAll : undefined} // Disable selection for cashier
              handleSelectRow={isAdmin ? handleSelectRow : undefined} // Disable selection for cashier
              onEdit={isAdmin ? openModalForEdit : undefined} // Disable edit for cashier
              onDelete={isAdmin ? handleDelete : undefined} // Disable delete for cashier
              onViewDetails={handleViewDetails}
              showActions={isAdmin} // Hide action column for cashier
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

        {isAdmin && ( // Only show modal for admin
          <ProductModal
            showModal={showModal}
            closeModal={closeModal}
            editingProduct={editingProduct}
            formData={formData}
            handleInputChange={handleInputChange}
            handleTierChange={handleTierChange}
            addTier={addTier}
            removeTier={removeTier}
            handleSave={handleSave}
            darkMode={darkMode}
            categories={categories}
            suppliers={suppliers}
          />
        )}

        {isAdmin && ( // Only show confirmation modal for admin
          <ConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            title="Konfirmasi Hapus"
            message={`Apakah Anda yakin ingin menghapus ${
              Array.isArray(itemToDelete) ? itemToDelete.length + ' produk' : 'produk ini'
            }?`}
            darkMode={darkMode}
            isLoading={isDeleting}
          />
        )}

        {/* Product Detail Modal is always available for viewing */}
        <ProductDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          product={selectedProductForDetail}
          darkMode={darkMode}
        />
      </main>
    </ProtectedRoute>
  );
}