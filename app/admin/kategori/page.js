'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Sidebar from '../../../components/Sidebar';
import { useDarkMode } from '../../../components/DarkModeContext';
import { useSession } from 'next-auth/react'; // Import useSession

import { useCategoryTable } from '../../../lib/hooks/useCategoryTable';
import { useCategoryForm } from '../../../lib/hooks/useCategoryForm';
import { useTableSelection } from '../../../lib/hooks/useTableSelection';

import CategoryTable from '../../../components/kategori/CategoryTable';
import CategoryModal from '../../../components/kategori/CategoryModal';
import CategoryToolbar from '../../../components/kategori/CategoryToolbar';
import Pagination from '../../../components/produk/Pagination';
import ConfirmationModal from '../../../components/ConfirmationModal';

export default function CategoryManagement() {
  const { darkMode } = useDarkMode();
  const { data: session } = useSession(); // Get session data
  const isAdmin = session?.user?.role === 'ADMIN'; // Determine if user is admin

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

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    <ProtectedRoute requiredRole="ADMIN"> {/* This ProtectedRoute will ensure only ADMIN can access this page directly, but CASHIER can access via sidebar */}
      <Sidebar>
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Manajemen Kategori
          </h1>

          <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
            <div className="p-4 sm:p-6">
              {isAdmin && ( // Only show toolbar for admin
                <CategoryToolbar
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  onAddNew={openModalForCreate}
                  onDeleteMultiple={handleDeleteMultiple}
                  handleExport={handleExport}
                  selectedRowsCount={selectedRows.length}
                  clearSelection={clearSelection}
                  darkMode={darkMode}
                />
              )}
              {!isAdmin && ( // Show search/filter for cashier
                <div className="mb-4 flex justify-between items-center">
                  <input
                    type="text"
                    placeholder="Cari kategori..."
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
                key={categories.length}
                categories={categories}
                loading={loading}
                darkMode={darkMode}
                selectedRows={selectedRows}
                handleSelectAll={isAdmin ? handleSelectAll : undefined} // Disable selection for cashier
                handleSelectRow={isAdmin ? handleSelectRow : undefined} // Disable selection for cashier
                handleEdit={isAdmin ? openModalForEdit : undefined} // Disable edit for cashier
                handleDelete={isAdmin ? handleDelete : undefined} // Disable delete for cashier
                showActions={isAdmin} // Hide action column for cashier
              />
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalProducts={totalCategories}
              darkMode={darkMode}
            />
          </div>

          {isAdmin && ( // Only show modal for admin
            <CategoryModal
              showModal={showModal}
              closeModal={closeModal}
              handleSave={handleSave}
              formData={formData}
              handleInputChange={handleInputChange}
              editingCategory={editingCategory}
              error={formError}
              setFormError={setFormError}
              darkMode={darkMode}
            />
          )}

          {isAdmin && ( // Only show confirmation modal for admin
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
          )}
        </main>
      </Sidebar>
    </ProtectedRoute>
  );
}
