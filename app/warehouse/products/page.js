'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Download, Upload, Trash2, Folder, Edit, Eye } from 'lucide-react';
import { useKeyboardShortcut } from '../../../lib/hooks/useKeyboardShortcut';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useUserTheme } from '../../../components/UserThemeContext';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import Tooltip from '../../../components/Tooltip';

import { useWarehouseProductTable } from '../../../lib/hooks/useWarehouseProductTable';
import { useWarehouseProductForm } from '../../../lib/hooks/useWarehouseProductForm'; // Import new hook
import { useTableSelection } from '../../../lib/hooks/useTableSelection';
import { useCachedCategories, useCachedSuppliers } from '../../../lib/hooks/useCachedData'; // Import data hooks

import DataTable from '../../../components/DataTable';
import ProductModal from '../../../components/produk/ProductModal'; // Import modal
import ConfirmationModal from '../../../components/ConfirmationModal';
import Breadcrumb from '../../../components/Breadcrumb';
import ExportFormatSelector from '../../../components/export/ExportFormatSelector';
import ProductDetailModal from '../../../components/produk/ProductDetailModal'; // Import ProductDetailModal

// Basic Add Stock Modal (Can be moved to its own file if it grows in complexity)
function AddStockModal({ isOpen, onClose, product, darkMode, onSave }) {
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !product) return null;

  const handleSave = async () => {
    if (quantityToAdd <= 0) {
      toast.error("Jumlah stok harus lebih dari 0.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/warehouse/products/${product.id}/add-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: quantityToAdd }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menambahkan stok.');
      }

      toast.success(`Berhasil menambahkan ${quantityToAdd} stok untuk ${product.name}`);
      onSave(); // Callback to refresh table
      onClose();
    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[101] overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className={`relative inline-block align-bottom ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${darkMode ? 'border-gray-700' : 'border-gray-200'} border`}>
          <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${darkMode ? 'bg-gray-800' : ''}`}>
            <h3 className={`text-lg leading-6 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Tambah Stok: {product.name}
            </h3>
            <div className="mt-2">
              <label htmlFor="quantityToAdd" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Jumlah yang Ditambahkan</label>
              <input
                type="number"
                id="quantityToAdd"
                value={quantityToAdd}
                onChange={(e) => setQuantityToAdd(parseInt(e.target.value) || 0)}
                min="1"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200 bg-white text-gray-900'}`}
                disabled={loading}
              />
            </div>
          </div>
          <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${darkMode ? 'bg-gray-600 text-white hover:bg-gray-500 border-gray-500' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`}
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function WarehouseProductsPage() {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const { data: session } = useSession();
  const isWarehouse = session?.user?.role === 'WAREHOUSE';

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState(null);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedProductForStockUpdate, setSelectedProductForStockUpdate] = useState(null);


  const {
    products,
    loading,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    pagination,
    fetchProducts,
  } = useWarehouseProductTable();
  
  // Form and Modal hook
  const {
    showModal,
    editingProduct,
    formData,
    openModalForCreate,
    openModalForEdit,
    closeModal,
    handleSave,
    handleInputChange
  } = useWarehouseProductForm(fetchProducts);

  // Cached data for forms
  const { categories, loading: categoriesLoading, error: categoriesError } = useCachedCategories();
  const { suppliers, loading: suppliersLoading, error: suppliersError } = useCachedSuppliers();

  const isInitialDataLoading = categoriesLoading || suppliersLoading;

  // Keyboard shortcuts
  useKeyboardShortcut({
    'alt+n': () => isWarehouse && openModalForCreate(), // Tambah produk baru
    'alt+i': () => {
      // Memicu fungsi import dengan mengklik input file tersembunyi
      const hiddenFileInput = document.getElementById('hidden-import-file-input');
      if (hiddenFileInput) {
        hiddenFileInput.click();
      } else {
        // Jika elemen tidak ditemukan, buat elemen sementara
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls,.csv';
        input.style.display = 'none';
        input.onchange = (e) => handleImport(e);
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
      }
    }, // Import
    'alt+e': () => isWarehouse && handleExport(), // Export
    'alt+d': () => {
      // Download template produk gudang
      const link = document.createElement('a');
      link.href = '/templates/contoh-import-produk-gudang.csv';
      link.download = 'contoh-import-produk-gudang.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, // Download template
    'ctrl+k': (e) => {
      if (e) {
        e.preventDefault();
        // Fokus ke search input di DataTable
        const searchInput = document.querySelector('input[placeholder="Cari produk..."]') ||
                          document.querySelector('input[placeholder*="Cari"]') ||
                          document.querySelector('input[type="search"]');
        if (searchInput && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
          searchInput.focus();
        }
      }
    }, // Fokus ke search
    'alt+s': (e) => {
      if (e) e.preventDefault();
      if (showModal) {
        handleSave();
      }
    }, // Simpan jika modal terbuka
    'escape': () => {
      if (showModal) closeModal();
      if (showDetailModal) setShowDetailModal(false);
      if (showAddStockModal) setShowAddStockModal(false);
      if (showDeleteModal) setShowDeleteModal(false);
      if (showExportFormatModal) setShowExportFormatModal(false);
      if (showImportConfirmModal) setShowImportConfirmModal(false);
    } // Tutup modal dengan ESC
  });

  const { selectedRows, handleSelectAll, handleSelectRow, clearSelection, setSelectedRows } = useTableSelection(products);

  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showExportFormatModal, setShowExportFormatModal] = useState(false);
  const [showImportConfirmModal, setShowImportConfirmModal] = useState(false);
  const [duplicateProducts, setDuplicateProducts] = useState([]);
  const [fileToImport, setFileToImport] = useState(null);

  const handleDelete = (id) => {
    if (!isWarehouse) return;
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteMultiple = () => {
    if (!isWarehouse || selectedRows.length === 0) return;
    setItemToDelete(selectedRows);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !isWarehouse) return;
    setIsDeleting(true);

    const isMultiple = Array.isArray(itemToDelete);
    let url = '/api/warehouse/products';
    let options = {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    };

    if (isMultiple) {
      options.body = JSON.stringify({ ids: itemToDelete });
    } else {
      url += `/${itemToDelete}`;
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus produk gudang');
      }

      fetchProducts();
      if (isMultiple) {
        clearSelection();
        toast.success(`Berhasil menghapus ${itemToDelete.length} produk gudang`);
      } else {
        setSelectedRows(prev => prev.filter(rowId => rowId !== itemToDelete));
        toast.success('Produk gudang berhasil dihapus');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat menghapus: ' + err.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleImport = async (e) => {
    if (!isWarehouse) return;

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls') && !file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Silakan pilih file Excel (.xlsx, .xls) atau CSV (.csv)');
      e.target.value = '';
      return;
    }

    setFileToImport(file); // Store the file in state

    const formData = new FormData();
    formData.append('file', file);

    await processImport(formData, e);
  };

  const processImport = async (formData, event = null) => {
    setImportLoading(true);
    toast.info('Mengirim file untuk diimpor...');

    try {
      const response = await fetch('/api/warehouse/products/import', { method: 'POST', body: formData });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal memproses file import');
      }

      if (result.needConfirmation && result.duplicateProducts) {
        setDuplicateProducts(result.duplicateProducts);
        setShowImportConfirmModal(true); // Show duplicate confirmation
      } else {
        fetchProducts();
        toast.success(result.message || `Berhasil mengimpor ${result.importedCount || 0} produk gudang`);
        if (result.errors && result.errors.length > 0) {
          console.warn('Import errors:', result.errors);
          toast.warn(`Beberapa produk gudang gagal diimpor: ${result.errors.length} error(s)`);
        }
        // Clear all import related states on success
        resetImportState();
        if (event && event.target) {
            event.target.value = '';
        }
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat import: ' + err.message);
      resetImportState();
    } finally {
      setImportLoading(false);
      // Don't reset file input here if confirmation is needed
      if (!showImportConfirmModal && event && event.target) {
        event.target.value = '';
      }
    }
  };


  const handleImportWithConfirmation = async (force) => {
    if (!fileToImport) {
        toast.error("File import tidak ditemukan. Silakan coba lagi.");
        return;
    }

    setShowImportConfirmModal(false);
    const formData = new FormData();
    formData.append('file', fileToImport);
    formData.append('force', String(force));

    setImportLoading(true);
    toast.info(force ? 'Mengimpor dan menimpa produk yang sudah ada...' : 'Mengimpor dan menambahkan stok produk yang sudah ada...');

    try {
      const response = await fetch('/api/warehouse/products/import', { method: 'POST', body: formData });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal memproses file import');
      }

      fetchProducts();
      toast.success(result.message || `Berhasil mengimpor ${result.importedCount || 0} produk gudang`);
      if (result.errors && result.errors.length > 0) {
        console.warn('Import errors:', result.errors);
        toast.warn(`Beberapa produk gudang gagal diimpor: ${result.errors.length} error(s)`);
      }
      // Clear all import related states on success
      resetImportState();
    } catch (err) {
      toast.error('Terjadi kesalahan saat import: ' + err.message);
    } finally {
      setImportLoading(false);
    }
  };


  const resetImportState = () => {
    setFileToImport(null);
    setDuplicateProducts([]);
    setShowImportConfirmModal(false);
  };

  const openExportFormatSelector = () => {
    setShowExportFormatModal(true);
  };

  const handleExportWithFormat = async (format) => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/warehouse/products/export');
      if (!response.ok) throw new Error('Gagal mengambil data untuk export');
      const data = await response.json();

      const exportData = data.data;

      if (format === 'excel') {
        try {
          const { utils, writeFile } = await import('xlsx');
          const worksheet = utils.json_to_sheet(exportData);

          const colWidths = [
            { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
            { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
            { wch: 15 }, { wch: 15 }
          ];
          worksheet['!cols'] = colWidths;

          const workbook = utils.book_new();
          utils.book_append_sheet(workbook, worksheet, 'Produk Gudang');

          const fileName = `produk-gudang-${new Date().toISOString().slice(0, 10)}.xlsx`;
          writeFile(workbook, fileName);
        } catch (error) {
          console.error('Error saat ekspor ke Excel:', error);
          toast.error('Gagal ekspor ke Excel, silakan coba format lain');
          return;
        }
      } else {
        let csvContent = 'Nama Produk,Kode Produk,Stok,Harga Beli,Kategori,Supplier,Deskripsi,Tanggal Dibuat,Tanggal Diubah\n';
        exportData.forEach(row => {
          const csvRow = [
            `"${row['Nama Produk'].replace(/"/g, '""')}"`, `"${row['Kode Produk'].replace(/"/g, '""')}"`,
            row['Stok'], row['Harga Beli'], `"${row['Kategori']}"`, `"${row['Supplier']}"`,
            `"${row['Deskripsi'].replace(/"/g, '""')}"`, `"${row['Tanggal Dibuat']}"`,
            `"${row['Tanggal Diubah']}"`
          ].join(',');
          csvContent += csvRow + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `produk-gudang-${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success(`Data produk gudang berhasil diekspor dalam format ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Terjadi kesalahan saat export: ' + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExport = () => {
    openExportFormatSelector();
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const columns = [
    { key: 'productCode', title: 'Kode Produk', sortable: true },
    { key: 'name', title: 'Nama Produk', sortable: true },
    {
      key: 'stock',
      title: 'Stok',
      render: (value) => value?.toLocaleString('id-ID') || 0,
      sortable: true
    },
    {
      key: 'purchasePrice',
      title: 'Harga Beli',
      render: (value) => `Rp ${(value || 0).toLocaleString('id-ID')}`,
      sortable: true
    },
    {
      key: 'retailPrice',
      title: 'Harga Umum',
      render: (value) => `Rp ${(value || 0).toLocaleString('id-ID')}`,
      sortable: true
    },
    // Kategori and Supplier columns removed as per user request
    // { key: 'category.name', title: 'Kategori', render: (value, row) => row.category?.name || '-', sortable: true },
    // { key: 'supplier.name', title: 'Supplier', render: (value, row) => row.supplier?.name || '-', sortable: true }
  ];

  // Connect the Edit button to the modal
  const handleEdit = (product) => {
    if (!isWarehouse) return;
    openModalForEdit(product);
  };

  const handleViewDetails = (product) => {
    // Placeholder for opening product detail modal
    console.log('View details for:', product);
    setSelectedProductForDetail(product);
    setShowDetailModal(true);
  };

  const handleOpenAddStockModal = (product) => {
    // Placeholder for opening add stock modal
    console.log('Add stock for:', product);
    setSelectedProductForStockUpdate(product);
    setShowAddStockModal(true);
  };

  const enhancedProducts = products.map(product => ({
    ...product,
    onEdit: isWarehouse ? () => handleEdit(product) : undefined,
    onDelete: isWarehouse ? () => handleDelete(product.id) : undefined,
    onViewDetails: () => handleViewDetails(product), // Add view details action
    onAddStock: () => handleOpenAddStockModal(product) // Add add stock action
  }));

  const rowActions = (row) => (
    <div className="flex space-x-2">
      <button onClick={() => handleViewDetails(row)} className={`p-1.5 rounded-md ${darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-200'}`} title="Detail Produk"><Eye className="h-4 w-4" /></button>
      <button onClick={() => handleOpenAddStockModal(row)} className={`p-1.5 rounded-md ${darkMode ? 'text-green-400 hover:bg-gray-700' : 'text-green-600 hover:bg-gray-200'}`} title="Tambah Stok"><Plus className="h-4 w-4" /></button>
      <button onClick={() => handleEdit(row)} className={`p-1.5 rounded-md ${darkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-yellow-600 hover:bg-gray-200'}`} title="Edit"><Edit className="h-4 w-4" /></button>
      <button onClick={() => handleDelete(row.id)} className={`p-1.5 rounded-md ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-200'}`} title="Hapus"><Trash2 className="h-4 w-4" /></button>
    </div>
  );

  const paginationData = {
    currentPage: pagination.currentPage || 1,
    totalPages: pagination.totalPages || 1,
    totalItems: pagination.total || 0,
    startIndex: pagination.startIndex || 1,
    endIndex: pagination.endIndex || 0,
    onPageChange: setCurrentPage,
    itemsPerPage: itemsPerPage
  };

  return (
    <ProtectedRoute requiredRole="WAREHOUSE">
      <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900 text-gray-100' : ''}`}>
        <Breadcrumb items={[{ title: 'Produk Gudang', href: '/warehouse/products' }]} darkMode={darkMode} />
        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Manajemen Produk Gudang</h1>

        {/* Hidden file input for import shortcut */}
        <input
          id="hidden-import-file-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={(e) => handleImport(e)}
        />

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-theme-purple-700' : 'bg-white border-gray-200'} border`}>
          <DataTable
            data={enhancedProducts}
            columns={columns}
            loading={loading || categoriesLoading || suppliersLoading}
            darkMode={darkMode}
            pagination={paginationData}
            mobileColumns={['name', 'stock', 'purchasePrice']}
            rowActions={rowActions}
            emptyMessage="Tidak ada produk gudang ditemukan"
            selectable={true}
            onSelectAll={handleSelectAll}
            onSelectRow={handleSelectRow}
            selectedRows={selectedRows}
            showSearch={true}
            onSearch={setSearchTerm}
            showToolbar={true}
            showAdd={isWarehouse}
            onAdd={openModalForCreate}
            showExport={true}
            onExport={handleExport}
            showImport={isWarehouse}
            onImport={(e) => handleImport(e)}
            onItemsPerPageChange={setItemsPerPage}
            itemsPerPage={itemsPerPage}
            onDeleteMultiple={handleDeleteMultiple}
            selectedRowsCount={selectedRows.length}
            importLoading={importLoading}
            exportLoading={exportLoading}
            showTemplate={true}
            onTemplateDownload={() => {
              const link = document.createElement('a');
              link.href = '/templates/contoh-import-produk-gudang.csv';
              link.download = 'contoh-import-produk-gudang.csv';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          />
        </div>

        {/* Add/Edit Product Modal */}
        {isWarehouse && (
          <ProductModal
            showModal={showModal}
            closeModal={closeModal}
            editingProduct={editingProduct}
            formData={formData}
            handleInputChange={handleInputChange}
            handleTierChange={() => {}} 
            addTier={() => {}}
            removeTier={() => {}}
            handleSave={handleSave}
            darkMode={darkMode}
            categories={categories}
            suppliers={suppliers}
          />
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Konfirmasi Hapus Produk"
          message={isDeleting
            ? "Menghapus produk..."
            : "Apakah Anda yakin ingin menghapus produk ini? Tindakan ini akan menghapus produk dan semua data terkait termasuk stok. Tindakan ini tidak dapat dibatalkan."
          }
          isLoading={isDeleting}
        />

        {/* Import Confirmation Modal */}
        {showImportConfirmModal && (
          <ConfirmationModal
            isOpen={showImportConfirmModal}
            onClose={() => {
              setShowImportConfirmModal(false);
              setDuplicateProducts([]);
              setFileToImport(null);
            }}
            onConfirm={() => handleImportWithConfirmation(true)}
            onConfirmSecondary={() => handleImportWithConfirmation(false)}
            title="Konfirmasi Import Produk"
            message={`Terdapat ${duplicateProducts.length} produk yang sudah ada di sistem. Apakah Anda ingin menimpa data produk yang sudah ada beserta menambahkan stoknya?`}
            hasSecondaryAction={true}
            secondaryActionText="Tambahkan stok saja"
            primaryActionText="Timpa semua"
          />
        )}

        {/* Export Format Selector Modal */}
        {showExportFormatModal && (
          <ExportFormatSelector
            isOpen={showExportFormatModal}
            onClose={() => setShowExportFormatModal(false)}
            onConfirm={handleExportWithFormat}
            title="Pilih Format Ekspor"
            description="Pilih format file yang ingin Anda gunakan untuk mengekspor data produk gudang"
          />
        )}

        {/* Product Detail Modal */}
        {selectedProductForDetail && (
            <ProductDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                product={selectedProductForDetail}
                darkMode={darkMode}
            />
        )}

        {/* Add Stock Modal */}
        {selectedProductForStockUpdate && (
            <AddStockModal
                isOpen={showAddStockModal}
                onClose={() => setShowAddStockModal(false)}
                product={selectedProductForStockUpdate}
                darkMode={darkMode}
                onSave={fetchProducts} // Refresh the product list after stock update
            />
        )}

        {/* Keyboard Shortcuts Guide */}
        <div className={`mt-4 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="flex flex-wrap gap-3">
            <span>Tambah: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>Alt+N</kbd></span>
            <span>Import: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>Alt+I</kbd></span>
            <span>Export: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>Alt+E</kbd></span>
            <span>Template: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>Alt+D</kbd></span>
            <span>Cari: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>Ctrl+K</kbd></span>
            <span>Simpan: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>Alt+S</kbd></span>
            <span>Tutup: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>ESC</kbd></span>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}