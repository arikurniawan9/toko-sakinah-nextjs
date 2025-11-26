'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserTheme } from '../../../components/UserThemeContext';
import { useSession } from 'next-auth/react';
import { useCategoryForm } from '@/lib/hooks/useCategoryForm';
import { useCategoryTable } from '@/lib/hooks/useCategoryTable';
import CategoryModal from '@/components/kategori/CategoryModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import CategoryProductsModal from '@/components/kategori/CategoryProductsModal';
import { AlertTriangle, CheckCircle, Plus, Search, Edit, Trash2, Eye, FileText, Download } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Breadcrumb from '@/components/Breadcrumb';
import * as XLSX from 'xlsx';
import ImportModal from '@/components/ImportModal'; // ADDED: Import ImportModal
import { exportCategoryPDF } from '@/utils/exportCategoryPDF';
import { generateCategoryImportTemplate } from '@/utils/categoryImportTemplate';
import { z } from 'zod';

export default function CategoryManagementPage() {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const {
    categories,
    loading,
    error: tableError,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCategories,
    fetchCategories,
    setError: setTableError,
  } = useCategoryTable();

  const {
    showModal,
    editingCategory,
    formData,
    setFormData,
    error: formError,
    setError: setFormError,
    handleInputChange,
    openModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave: originalHandleSave,
  } = useCategoryForm(fetchCategories);

  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false); // ADDED: State for import modal
  const [showCategoryProductsModal, setShowCategoryProductsModal] = useState(false); // State for category products modal
  const [selectedCategory, setSelectedCategory] = useState(null); // Selected category for products modal
  const [categoryProducts, setCategoryProducts] = useState([]); // Products for the selected category
  const [loadingProducts, setLoadingProducts] = useState(false); // Loading state for products

  const handleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allRowIds = categories.map(c => c.id);
      setSelectedRows(allRowIds);
    } else {
      setSelectedRows([]);
    }
  };

  const handleSave = async () => {
    setSuccess('');
    const result = await originalHandleSave();
    if (result.success) {
      setSuccess('Kategori berhasil disimpan!');
      fetchCategories(); // Refresh data on save
    }
  };

  const handleIconChange = (iconName) => {
    setFormData(prev => ({ ...prev, icon: iconName }));
  };

  const handleDelete = (ids) => {
    if (!isAdmin) return;
    setItemsToDelete(ids);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (itemsToDelete.length === 0 || !isAdmin) return;
    setIsDeleting(true);
    setSuccess('');
    setTableError('');

    try {
      const response = await fetch(`/api/kategori`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: itemsToDelete }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menghapus kategori');

      setSuccess(`Berhasil menghapus ${result.deletedCount} kategori.`);
      setSelectedRows([]);
      fetchCategories(); // Refresh data
    } catch (err) {
      setTableError(err.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setItemsToDelete([]);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/kategori?export=true');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengambil data untuk ekspor');
      }

      const categoriesToExport = data.categories.map((cat, index) => ({
        'No.': index + 1,
        'Nama Kategori': cat.name,
        'Deskripsi': cat.description || '-',
        'Ikon': cat.icon || '-',
        'Jumlah Produk': cat._count.products, // Access _count.products for the count
        'Dibuat Pada': new Date(cat.createdAt).toLocaleDateString('id-ID'),
        'Diperbarui Pada': new Date(cat.updatedAt).toLocaleDateString('id-ID'),
      }));

      const ws = XLSX.utils.json_to_sheet(categoriesToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Kategori');
      XLSX.writeFile(wb, 'kategori_data.xlsx');
      setSuccess('Data kategori berhasil diekspor.');
    } catch (err) {
      setTableError(err.message);
    }
  };

  const handleImport = () => setShowImportModal(true); // ADDED: handleImport function

  // Fungsi untuk menampilkan produk dalam kategori
  const handleViewCategoryProducts = async (category) => {
    setSelectedCategory(category);
    setLoadingProducts(true);

    try {
      const response = await fetch(`/api/products?categoryId=${category.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengambil produk dalam kategori');
      }

      setCategoryProducts(data.products || []);
      setShowCategoryProductsModal(true);
    } catch (error) {
      setTableError(error.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fungsi untuk export PDF
  const handleExportPDF = async () => {
    try {
      await exportCategoryPDF(darkMode);
      setSuccess('Laporan PDF berhasil dibuat!');
    } catch (error) {
      setTableError(error.message || 'Gagal membuat laporan PDF');
    }
  };
  
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
    if (tableError) {
      const timer = setTimeout(() => setTableError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success, tableError]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const columns = [
    {
      key: 'no',
      title: 'No.',
      render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    {
      key: 'name',
      title: 'Nama',
      sortable: true
    },
    {
      key: 'description',
      title: 'Deskripsi',
      render: (value) => value || '-',
      sortable: true
    },
    {
      key: 'jumlahProduk',
      title: 'Jumlah Produk',
      sortable: true,
      render: (value, row) => row._count?.products || 0,
    },
    {
      key: 'createdAt',
      title: 'Tanggal Dibuat',
      render: (value) => new Date(value).toLocaleDateString('id-ID'),
      sortable: true
    },
  ];

  const renderRowActions = (row) => (
    <>
      <button
        onClick={() => handleViewCategoryProducts(row)}
        className="p-1 text-green-500 hover:text-green-700 mr-2"
        title="Lihat Produk dalam Kategori"
      >
        <Eye size={18} />
      </button>
      <button onClick={() => openModalForEdit(row)} className="p-1 text-blue-500 hover:text-blue-700 mr-2">
        <Edit size={18} />
      </button>
      <button onClick={() => handleDelete([row.id])} className="p-1 text-red-500 hover:text-red-700">
        <Trash2 size={18} />
      </button>
    </>
  );

  const paginationData = {
    currentPage,
    totalPages,
    totalItems: totalCategories,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, totalCategories),
    onPageChange: setCurrentPage,
    itemsPerPage: itemsPerPage
  };

  const error = tableError || formError;

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <Breadcrumb
          items={[{ title: 'Kategori', href: '/admin/kategori' }]}
          darkMode={darkMode}
        />

        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Manajemen Kategori
        </h1>

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <DataTable
            data={categories}
            columns={columns}
            loading={loading}
            selectedRows={selectedRows}
            onSelectAll={handleSelectAll}
            onSelectRow={handleSelectRow}
            onAdd={isAdmin ? openModalForCreate : undefined}
            onSearch={setSearchTerm}
            onExport={handleExport} // Pass handleExport
            onExportPDF={handleExportPDF} // Pass handleExportPDF
            onItemsPerPageChange={setItemsPerPage}
            darkMode={darkMode}
            actions={isAdmin}
            showToolbar={true}
            showAdd={isAdmin}
            showExport={true} // Show export button
            showExportPDF={true} // Show export PDF button
            showItemsPerPage={true}
            pagination={paginationData}
            mobileColumns={['name', 'description']}
            rowActions={renderRowActions}
            onDeleteMultiple={() => handleDelete(selectedRows)}
            selectedRowsCount={selectedRows.length}
            onImport={handleImport} // ADDED: Pass handleImport
            showImport={isAdmin} // ADDED: Show import button
          />
        </div>

        {error && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center p-4 rounded-lg bg-red-500/10 text-red-400 shadow-lg">
            <AlertTriangle className="h-5 w-5 mr-3" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center p-4 rounded-lg bg-green-500/10 text-green-400 shadow-lg">
            <CheckCircle className="h-5 w-5 mr-3" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        {isAdmin && (
          <>
            <CategoryModal
              showModal={showModal}
              closeModal={closeModal}
              handleSave={handleSave}
              formData={formData}
              handleInputChange={handleInputChange}
              handleIconChange={handleIconChange}
              editingCategory={editingCategory}
              error={formError}
              setFormError={setFormError}
              darkMode={darkMode}
            />
            <ConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => setShowDeleteModal(false)}
              onConfirm={handleConfirmDelete}
              title={`Konfirmasi Hapus ${itemsToDelete.length} Kategori`}
              message={`Apakah Anda yakin ingin menghapus kategori yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
              isLoading={isDeleting}
            />
            {/* ADDED: ImportModal Placeholder */}
            {showImportModal && (
              <ImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImportSuccess={() => {
                  fetchCategories();
                  setShowImportModal(false);
                  setSuccess('Import kategori berhasil!');
                }}
                darkMode={darkMode}
                importEndpoint="/api/kategori/import"
                checkDuplicatesEndpoint="/api/kategori/check-duplicates"
                templateGenerator={generateCategoryImportTemplate}
                entityName="Kategori"
                schema={z.object({
                  name: z.string().min(1, { message: 'Nama kategori wajib diisi' }),
                  description: z.string().optional().nullable(),
                })}
                columnMapping={{
                  'Nama Kategori': 'name',
                  'Deskripsi': 'description'
                }}
                generateTemplateLabel="Unduh Template Kategori"
              />
            )}

            {/* Modal untuk menampilkan produk dalam kategori */}
            <CategoryProductsModal
              isOpen={showCategoryProductsModal}
              onClose={() => setShowCategoryProductsModal(false)}
              category={selectedCategory}
              products={categoryProducts}
              darkMode={darkMode}
            />
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}