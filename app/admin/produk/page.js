// app/admin/produk/page.js
'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Download, Upload, Trash2, Folder, Edit, Eye, Hash } from 'lucide-react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useUserTheme } from '../../../components/UserThemeContext';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import Tooltip from '../../../components/Tooltip';

import { useProductTable } from '../../../lib/hooks/useProductTable';
import { useProductForm } from '../../../lib/hooks/useProductForm';
import { useTableSelection } from '../../../lib/hooks/useTableSelection';
import { useCachedCategories, useCachedSuppliers } from '../../../lib/hooks/useCachedData';

import DataTable from '../../../components/DataTable';
import ProductModal from '../../../components/produk/ProductModal';
import ProductDetailModal from '../../../components/produk/ProductDetailModal';
import ConfirmationModal from '../../../components/ConfirmationModal';
import Breadcrumb from '../../../components/Breadcrumb';
import ExportFormatSelector from '../../../components/export/ExportFormatSelector';
import PDFPreviewModal from '../../../components/export/PDFPreviewModal';
import { generateProductBarcodePDF } from '../../../components/admin/ProductBarcodePDFGenerator';
import AutoCompleteSearch from '../../../components/AutoCompleteSearch'; // Import AutoCompleteSearch

export default function ProductManagement() {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const [showPDFPreviewModal, setShowPDFPreviewModal] = useState(false);
  const [pdfPreviewData, setPdfPreviewData] = useState(null);

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
    categoryFilter,
    supplierFilter,
    minStock,
    maxStock,
    minPrice,
    maxPrice,
    handleCategoryFilter,
    handleSupplierFilter,
    handleMinStockFilter,
    handleMaxStockFilter,
    handleMinPriceFilter,
    handleMaxPriceFilter,
    clearFilters,
    hasActiveFilters
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
  const [showExportFormatModal, setShowExportFormatModal] = useState(false);
  const [showImportConfirmModal, setShowImportConfirmModal] = useState(false);
  const [duplicateProducts, setDuplicateProducts] = useState([]);
  const [fileToImport, setFileToImport] = useState(null);

  const { categories: cachedCategories, loading: categoriesLoading, error: categoriesError } = useCachedCategories();
  const { suppliers: cachedSuppliers, loading: suppliersLoading, error: suppliersError } = useCachedSuppliers();

  useEffect(() => {
    setCategories(cachedCategories);
  }, [cachedCategories]);

  useEffect(() => {
    setSuppliers(cachedSuppliers);
  }, [cachedSuppliers]);

  useEffect(() => {
    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      setTableError('Gagal memuat data kategori.');
    }
    if (suppliersError) {
      console.error('Error fetching suppliers:', suppliersError);
      setTableError('Gagal memuat data supplier.');
    }
  }, [categoriesError, suppliersError, setTableError]);

  // Search handlers for AutoCompleteSearch filters
  const searchCategories = async (query) => {
    if (!query) return [];
    const response = await fetch(`/api/kategori/search?q=${query}`);
    const data = await response.json();
    return data.categories || [];
  };

  const searchSuppliers = async (query) => {
    if (!query) return [];
    const response = await fetch(`/api/supplier/search?q=${query}`);
    const data = await response.json();
    return data.suppliers || [];
  };
  
  const handleCategoryFilterSelect = (category) => {
    handleCategoryFilter(category ? category.id : '');
  };
  
  const handleSupplierFilterSelect = (supplier) => {
    handleSupplierFilter(supplier ? supplier.id : '');
  };

  const handleDelete = (id) => {
    if (!isAdmin) return;
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteMultiple = () => {
    if (!isAdmin || selectedRows.length === 0) return;
    setItemToDelete(selectedRows);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !isAdmin) return;
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

  const handleImportWithConfirmation = async (force = true) => {
    if (!fileToImport) return;

    setShowImportConfirmModal(false);
    setImportLoading(true);

    const formData = new FormData();
    formData.append('file', fileToImport);
    formData.append('force', force.toString());

    try {
      toast.info(`Memproses file ${fileToImport.name}...`);
      const response = await fetch('/api/produk/import', { method: 'POST', body: formData });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengimport produk');
      } else {
        fetchProducts();
        toast.success(result.message || `Berhasil mengimport produk`);
        if (result.errors && result.errors.length > 0) {
          console.warn('Import errors:', result.errors);
          toast.warn(`Beberapa produk gagal diimpor: ${result.errors.length} error(s)`);
        }
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat import: ' + err.message);
    } finally {
      setImportLoading(false);
      setFileToImport(null);
      setDuplicateProducts([]);
    }
  };

  const handleViewDetails = (product) => {
    setSelectedProductForDetail(product);
    setShowDetailModal(true);
  };

  const openExportFormatSelector = () => {
    setShowExportFormatModal(true);
  };

  const handleExportWithFormat = async (format) => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/produk');
      if (!response.ok) throw new Error('Gagal mengambil data untuk export');
      const data = await response.json();

      const exportData = data.products.map(product => {
        const category = categories.find(cat => cat.id === product.categoryId);
        const supplier = suppliers.find(supp => supp.id === product.supplierId);

        return {
          'Nama': product.name,
          'Kode': product.productCode,
          'Stok': product.stock,
          'Kategori': category?.name || '',
          'Supplier': supplier?.name || '',
          'Deskripsi': product.description || '',
          'Tanggal Dibuat': new Date(product.createdAt).toLocaleDateString('id-ID'),
          'Tanggal Diubah': new Date(product.updatedAt).toLocaleDateString('id-ID'),
          'Harga Beli': product.purchasePrice || 0,
          'Harga Jual/Eceran': product.retailPrice || 0,
          'Harga Member Silver': product.silverPrice || 0,
          'Harga Member Gold': product.goldPrice || 0,
          'Harga Member Platinum (Partai)': product.platinumPrice || 0
        };
      });

      if (format === 'excel') {
        try {
          const { utils, writeFile } = await import('xlsx');
          const worksheet = utils.json_to_sheet(exportData);

          const colWidths = [
            { wch: 20 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 15 }, 
            { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, 
            { wch: 15 }, { wch: 15 }
          ];
          worksheet['!cols'] = colWidths;

          const workbook = utils.book_new();
          utils.book_append_sheet(workbook, worksheet, 'Produk');

          const fileName = `produk-${new Date().toISOString().slice(0, 10)}.xlsx`;
          writeFile(workbook, fileName);
        } catch (error) {
          console.error('Error saat ekspor ke Excel:', error);
          setTableError('Gagal ekspor ke Excel, silakan coba format lain');
          setTimeout(() => setTableError(''), 5000);
          return;
        }
      } else if (format === 'pdf') {
        setPdfPreviewData({
          data: exportData,
          title: 'Laporan Produk',
          darkMode: darkMode
        });
        setShowPDFPreviewModal(true);
      } else {
        let csvContent = 'Nama,Kode,Stok,Kategori,Supplier,Deskripsi,Tanggal Dibuat,Tanggal Diubah,Harga Beli,Harga Jual/Eceran,Harga Member Silver,Harga Member Gold,Harga Member Platinum (Partai)\n';
        exportData.forEach(row => {
          const csvRow = [
            `"${row['Nama'].replace(/"/g, '""')}"`, `"${row['Kode'].replace(/"/g, '""')}"`,
            row['Stok'], `"${row['Kategori']}"`, `"${row['Supplier']}"`,
            `"${row['Deskripsi'].replace(/"/g, '""')}"`, `"${row['Tanggal Dibuat']}"`,
            `"${row['Tanggal Diubah']}"`, row['Harga Beli'], row['Harga Jual/Eceran'],
            row['Harga Member Silver'], row['Harga Member Gold'], row['Harga Member Platinum (Partai)']
          ].join(',');
          csvContent += csvRow + '\n';
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
      }

      setSuccess(`Data produk berhasil diekspor dalam format ${format.toUpperCase()}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setTableError('Terjadi kesalahan saat export: ' + err.message);
      setTimeout(() => setTableError(''), 5000);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExport = () => {
    openExportFormatSelector();
  };

  const handlePrintBarcode = () => {
    try {
      const productsToPrint = selectedRows.length > 0
        ? products.filter(p => selectedRows.includes(p.id))
        : products;

      if (productsToPrint.length === 0) {
        toast.warn('Tidak ada produk untuk dicetak barcode-nya');
        return;
      }

      generateProductBarcodePDF(productsToPrint, {
        barcodeWidth: 38, barcodeHeight: 15, labelWidth: 50, labelHeight: 25,
        margin: 5, fontSize: 8, darkMode: darkMode,
        includeProductName: false, includeProductCode: true
      });

      toast.success(`Berhasil mencetak barcode untuk ${productsToPrint.length} produk`);
    } catch (error) {
      console.error('Error printing barcode:', error);
      toast.error('Gagal mencetak barcode: ' + error.message);
    }
  };

  const handleImport = async (e) => {
    if (!isAdmin) return;

    let file;
    if (e && e.target && e.target.files) {
      file = e.target.files[0];
      if (!file) return;
    } else if (e instanceof File) {
      file = e;
    } else {
      console.error('Invalid input for handleImport:', e);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls') && !file.name.toLowerCase().endsWith('.csv')) {
      setTableError('Silakan pilih file Excel (.xlsx, .xls) atau CSV (.csv)');
      setTimeout(() => setTableError(''), 5000);
      if (e && e.target) e.target.value = '';
      return;
    }

    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      toast.info(`Memproses file ${file.name}...`);
      const response = await fetch('/api/produk/import', { method: 'POST', body: formData });
      const result = await response.json();

      if (result.needConfirmation && result.duplicateProducts) {
        setDuplicateProducts(result.duplicateProducts);
        setFileToImport(file);
        setShowImportConfirmModal(true);
      } else if (!response.ok) {
        throw new Error(result.error || 'Gagal mengimport produk');
      } else {
        fetchProducts();
        toast.success(result.message || `Berhasil mengimport ${result.importedCount || 0} produk`);
        if (result.errors && result.errors.length > 0) {
          console.warn('Import errors:', result.errors);
          toast.warn(`Beberapa produk gagal diimpor: ${result.errors.length} error(s)`);
        }
        if (e && e.target) e.target.value = '';
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat import: ' + err.message);
      if (e && e.target) e.target.value = '';
    } finally {
      setImportLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const error = tableError || formError;

  const columns = [
    { key: 'productCode', title: 'Kode', sortable: true },
    { key: 'name', title: 'Nama', sortable: true },
    {
      key: 'retailPrice', title: 'Harga Jual/Eceran',
      render: (value, row) => `Rp ${row.retailPrice?.toLocaleString('id-ID') || 0}`,
      sortable: true
    },
    { key: 'stock', title: 'Stok', sortable: true }
  ];

  const enhancedProducts = products.map(product => ({
    ...product,
    onViewDetails: handleViewDetails,
    onEdit: isAdmin ? openModalForEdit : undefined,
    onDelete: isAdmin ? handleDelete : undefined
  }));

  const rowActions = (row) => (
    <div className="flex space-x-2">
      <button onClick={() => handleViewDetails(row)} className={`p-1.5 rounded-md ${darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-200'}`} title="Detail"><Eye className="h-4 w-4" /></button>
      {isAdmin && <button onClick={() => openModalForEdit(row)} className={`p-1.5 rounded-md ${darkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-yellow-600 hover:bg-gray-200'}`} title="Edit"><Edit className="h-4 w-4" /></button>}
      {isAdmin && <button onClick={() => handleDelete(row.id)} className={`p-1.5 rounded-md ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-200'}`} title="Hapus"><Trash2 className="h-4 w-4" /></button>}
    </div>
  );

  const paginationData = {
    currentPage, totalPages, totalItems: totalProducts,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, totalProducts),
    onPageChange: setCurrentPage,
    itemsPerPage: itemsPerPage
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900 text-gray-100' : ''}`}>
        <Breadcrumb items={[{ title: 'Produk', href: '/admin/produk' }]} darkMode={darkMode} />
        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Manajemen Produk</h1>

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-theme-purple-700' : 'bg-white border-gray-200'} border`}>
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-grow">
                <div className="relative flex-grow sm:w-64">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari produk..." className={`w-full pl-10 pr-4 py-2 border rounded-md shadow-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-theme-purple-500`} />
                </div>
                <div className="w-full sm:w-auto">
                  <label htmlFor="itemsPerPage" className="sr-only">Items per page</label>
                  <select id="itemsPerPage" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className={`w-full px-3 py-2 border rounded-md shadow-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-theme-purple-500`}>
                    <option value={10}>10/halaman</option>
                    <option value={20}>20/halaman</option>
                    <option value={50}>50/halaman</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-start md:justify-end flex-wrap gap-2">
                {selectedRows.length > 0 && (
                  <Tooltip content={`Hapus ${selectedRows.length} produk terpilih`}>
                    <button onClick={handleDeleteMultiple} className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"><Trash2 className="h-4 w-4" /><span className="ml-2">{selectedRows.length}</span></button>
                  </Tooltip>
                )}
                <Tooltip content="Import produk dari file">
                  <label className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${darkMode ? 'text-gray-200 bg-gray-800 hover:bg-gray-700' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}>
                    <Upload className="h-4 w-4" /><input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleImport} disabled={importLoading} />
                  </label>
                </Tooltip>
                <Tooltip content="Template Produk">
                  <a href="/templates/contoh-import-produk.csv" download="contoh-import-produk.csv" className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${darkMode ? 'text-gray-200 bg-gray-800 hover:bg-gray-700' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}><Folder className="h-4 w-4" /></a>
                </Tooltip>
                <Tooltip content="Cetak barcode produk">
                  <button onClick={handlePrintBarcode} className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${darkMode ? 'text-gray-200 bg-gray-800 hover:bg-gray-700' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}><Hash className="h-4 w-4" /></button>
                </Tooltip>
                <Tooltip content="Export data ke file">
                  <button onClick={handleExport} disabled={exportLoading} className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${darkMode ? 'text-gray-200 bg-gray-800 hover:bg-gray-700' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}>
                    {exportLoading ? <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <Download className="h-4 w-4" />}
                  </button>
                </Tooltip>
                {isAdmin && <Tooltip content="Tambah produk baru"><button onClick={openModalForCreate} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"><Plus className="h-4 w-4 mr-2" /><span>Baru</span></button></Tooltip>}
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Filter aktif: {searchTerm && `Pencarian: "${searchTerm}", `}
                  {categoryFilter && `Kategori: ${categoryFilter}, `}
                  {supplierFilter && `Supplier: ${supplierFilter}, `}
                  {minStock && `Min Stok: ${minStock}, `}
                  {maxStock && `Max Stok: ${maxStock}, `}
                  {minPrice && `Min Harga: ${minPrice}, `}
                  {maxPrice && `Max Harga: ${maxPrice}`}
                </div>
                <button onClick={clearFilters} className={`px-3 py-2 rounded-md text-sm font-medium ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>Reset Filter</button>
              </div>
            </div>
          )}

          <DataTable
            data={enhancedProducts}
            columns={columns}
            loading={loading}
            selectedRows={selectedRows}
            onSelectAll={isAdmin ? handleSelectAll : undefined}
            onSelectRow={isAdmin ? handleSelectRow : undefined}
            onAdd={isAdmin ? openModalForCreate : undefined}
            onSearch={setSearchTerm}
            onExport={handleExport}
            onImport={handleImport}
            onItemsPerPageChange={setItemsPerPage}
            onDeleteMultiple={handleDeleteMultiple}
            selectedRowsCount={selectedRows.length}
            darkMode={darkMode}
            actions={isAdmin}
            rowActions={rowActions}
            showToolbar={false}
            showAdd={isAdmin}
            showExport={true}
            showImport={true}
            showItemsPerPage={true}
            pagination={paginationData}
            mobileColumns={['productCode', 'name', 'price', 'stock']}
          />
        </div>

        {isAdmin && (
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

        {isAdmin && (
          <ConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            title="Konfirmasi Hapus"
            message={`Apakah Anda yakin ingin menghapus ${Array.isArray(itemToDelete) ? itemToDelete.length + ' produk' : 'produk ini'}?`}
            darkMode={darkMode}
            isLoading={isDeleting}
          />
        )}

        <ProductDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          product={selectedProductForDetail}
          darkMode={darkMode}
        />

        {showImportConfirmModal && (
          <div className="fixed z-[100] inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true"><div className={darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}></div></div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className={`inline-block align-bottom ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${darkMode ? 'border-gray-700' : 'border-gray-200'} border`}>
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${darkMode ? 'bg-red-900' : 'bg-red-100'} sm:mx-0 sm:h-10 sm:w-10`}>
                      <svg className={`${darkMode ? 'text-red-400' : 'text-red-600'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className={`text-lg leading-6 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Produk yang Sama Ditemukan</h3>
                      <div className="mt-2">
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Ditemukan {duplicateProducts.length} produk yang sudah ada di sistem. Apakah Anda ingin menimpa produk yang sudah ada?</p>
                        <div className="mt-4 max-h-40 overflow-y-auto"><ul className={`list-disc pl-5 space-y-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{duplicateProducts.map((product, index) => (<li key={index}><span className="font-medium">{product.productCode}</span> - {product.name}</li>))}</ul></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <button type="button" onClick={() => handleImportWithConfirmation(true)} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm">Timpa Produk</button>
                  <button type="button" onClick={() => { setShowImportConfirmModal(false); setFileToImport(null); setDuplicateProducts([]); }} className={`mt-3 w-full inline-flex justify-center rounded-md border px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${darkMode ? 'bg-gray-600 text-white hover:bg-gray-500 border-gray-500 focus:ring-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 focus:ring-gray-300'}`}>Batalkan</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ExportFormatSelector isOpen={showExportFormatModal} onClose={() => setShowExportFormatModal(false)} onExport={handleExportWithFormat} title="Produk" darkMode={darkMode} />
        <PDFPreviewModal isOpen={showPDFPreviewModal} onClose={() => setShowPDFPreviewModal(false)} data={pdfPreviewData?.data} title={pdfPreviewData?.title} darkMode={darkMode} />
      </main>
    </ProtectedRoute>
  );
}