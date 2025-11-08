// app/admin/kategori/page.js
'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Sidebar from '../../../components/Sidebar';
import { useDarkMode } from '../../../components/DarkModeContext';

import { useCategoryTable } from '../../../lib/hooks/useCategoryTable';
import { useCategoryForm } from '../../../lib/hooks/useCategoryForm';
import { useTableSelection } from '../../../lib/hooks/useTableSelection';

import CategoryTable from '../../../components/kategori/CategoryTable';
import CategoryModal from '../../../components/kategori/CategoryModal';
import CategoryToolbar from '../../../components/kategori/CategoryToolbar';
import Pagination from '../../../components/produk/Pagination';
import ConfirmationModal from '../../../components/ConfirmationModal'; // Import ConfirmationModal

export default function CategoryManagement() {
  const { darkMode } = useDarkMode();

  const {
    categories,
    loading,
    error: tableError,
    searchTerm,
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
    error: formError,
    success,
    handleInputChange,
    openModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave,
    setError: setFormError,
    setSuccess,
  } = useCategoryForm(fetchCategories);

  const { selectedRows, handleSelectAll, handleSelectRow, clearSelection, setSelectedRows } = useTableSelection(categories);

  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // Can be a single ID (string) or multiple IDs (array)
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (id) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteMultiple = () => {
    if (selectedRows.length === 0) return;
    setItemToDelete(selectedRows);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    const isMultiple = Array.isArray(itemToDelete);
    let url = '/api/kategori';
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
        throw new Error(errorData.error || 'Gagal menghapus kategori');
      }
      
      fetchCategories();
      if (isMultiple) {
        clearSelection();
        setSuccess(`Berhasil menghapus ${itemToDelete.length} kategori`);
      } else {
        setSelectedRows(prev => prev.filter(rowId => rowId !== itemToDelete));
        setSuccess('Kategori berhasil dihapus');
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

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/kategori');
      if (!response.ok) throw new Error('Gagal mengambil data untuk export');
      const data = await response.json();

      let csvContent = 'Nama,Deskripsi,Tanggal Dibuat,Tanggal Diubah\n';
      data.categories.forEach(category => {
        const name = `"${category.name.split('"').join('""')}"`;
        const description = `"${category.description ? category.description.split('"').join('""') : ''}"`;
        const createdAt = `"${new Date(category.createdAt).toLocaleString()}"`;
        const updatedAt = `"${new Date(category.updatedAt).toLocaleString()}"`;
        csvContent += `${name},${description},${createdAt},${updatedAt}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'kategori.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setSuccess('Data kategori berhasil diekspor');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setTableError('Terjadi kesalahan saat mengekspor kategori: ' + err.message);
      setTimeout(() => setTableError(''), 5000);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <Sidebar>
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Manajemen Kategori
          </h1>

          <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
            <div className="p-4 sm:p-6">
              <CategoryToolbar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onAddNew={openModalForCreate} // Corrected prop name
                onDeleteMultiple={handleDeleteMultiple}
                handleExport={handleExport}
                selectedRowsCount={selectedRows.length} // Pass selectedRows.length
                clearSelection={clearSelection}
                darkMode={darkMode} // Pass darkMode prop
              />

              {tableError && (
                <div className={`my-4 p-4 ${darkMode ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'} rounded-md`}>
                  {tableError}
                </div>
              )}
              {success && (
                <div className={`my-4 p-4 ${darkMode ? 'bg-green-900/30 border-green-700 text-green-200' : 'bg-green-50 border-green-200 text-green-700'} rounded-md`}>
                  {success}
                </div>
              )}

              <CategoryTable
                key={categories.length} // Add key prop
                categories={categories}
                loading={loading} // Pass loading prop
                darkMode={darkMode} // Pass darkMode prop
                selectedRows={selectedRows}
                handleSelectAll={handleSelectAll}
                handleSelectRow={handleSelectRow}
                handleEdit={openModalForEdit}
                handleDelete={handleDelete}
              />
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalProducts={totalCategories} // Use totalCategories
              darkMode={darkMode} // Pass darkMode prop
            />
          </div>

          <CategoryModal
            showModal={showModal}
            closeModal={closeModal}
            handleSave={handleSave}
            formData={formData}
            handleInputChange={handleInputChange}
            editingCategory={editingCategory}
            error={formError}
            setFormError={setFormError}
            darkMode={darkMode} // Pass darkMode prop
          />

          <ConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            title="Konfirmasi Hapus"
            message={`Apakah Anda yakin ingin menghapus ${
              Array.isArray(itemToDelete) ? itemToDelete.length + ' kategori' : 'kategori ini'
            }?`}
            darkMode={darkMode}
            isLoading={isDeleting}
          />
        </main>
      </Sidebar>
    </ProtectedRoute>
  );
}
