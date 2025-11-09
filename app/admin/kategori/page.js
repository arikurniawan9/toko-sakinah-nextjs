'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import { useDarkMode } from '@/components/DarkModeContext';
import { useSession } from 'next-auth/react';
import { useCategoryTable } from '@/lib/hooks/useCategoryTable';
import { useCategoryForm } from '@/lib/hooks/useCategoryForm';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import CategoryTable from '@/components/kategori/CategoryTable';
import CategoryModal from '@/components/kategori/CategoryModal';
import CategoryToolbar from '@/components/kategori/CategoryToolbar';
import Pagination from '@/components/produk/Pagination';
import ConfirmationModal from '@/components/ConfirmationModal';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function CategoryManagementPage() {
  const { darkMode } = useDarkMode();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const {
    categories,
    loading,
    error: tableError,
    searchTerm,
    setSearchTerm,
    pagination,
    setPagination,
    fetchCategories,
    setError: setTableError,
  } = useCategoryTable();

  const {
    showModal,
    editingCategory,
    formData,
    formError,
    setFormError,
    successMessage,
    setSuccessMessage,
    handleInputChange,
    openModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave,
  } = useCategoryForm(fetchCategories);

  const { selectedRows, handleSelectAll, handleSelectRow, clearSelection } = useTableSelection(categories);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    const url = '/api/kategori';
    const options = {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: isMultiple ? itemToDelete : [itemToDelete] }),
    };

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal menghapus kategori');
      }

      await fetchCategories();
      const successMsg = `Berhasil menghapus ${isMultiple ? itemToDelete.length : 1} kategori.`;
      setSuccessMessage(successMsg);
      if (isMultiple) {
        clearSelection();
      }
    } catch (err) {
      setTableError(err.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <Sidebar>
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Manajemen Kategori
              </h1>
              <p className={`mt-1 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Kelola semua kategori produk Anda di satu tempat.
              </p>
            </div>

            {/* Main Content Card */}
            <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} border overflow-hidden`}>
              <div className="p-4 sm:p-6">
                {/* Toolbar */}
                <CategoryToolbar
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  onAddNew={openModalForCreate}
                  onDeleteMultiple={handleDeleteMultiple}
                  selectedRowsCount={selectedRows.length}
                  isAdmin={isAdmin}
                />

                {/* Alerts */}
                {tableError && (
                  <div className="flex items-center p-4 my-4 rounded-lg bg-red-500/10 text-red-400">
                    <AlertTriangle className="h-5 w-5 mr-3" />
                    <p className="text-sm font-medium">{tableError}</p>
                  </div>
                )}
                {successMessage && (
                  <div className="flex items-center p-4 my-4 rounded-lg bg-green-500/10 text-green-400">
                    <CheckCircle className="h-5 w-5 mr-3" />
                    <p className="text-sm font-medium">{successMessage}</p>
                  </div>
                )}

                {/* Table */}
                <CategoryTable
                  categories={categories}
                  loading={loading}
                  selectedRows={selectedRows}
                  handleSelectAll={handleSelectAll}
                  handleSelectRow={handleSelectRow}
                  handleEdit={openModalForEdit}
                  handleDelete={handleDelete}
                  isAdmin={isAdmin}
                />
              </div>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  setCurrentPage={(page) => setPagination(p => ({ ...p, page }))}
                  itemsPerPage={pagination.limit}
                  totalItems={pagination.total}
                />
              )}
            </div>
          </div>

          {/* Modals */}
          {isAdmin && (
            <>
              <CategoryModal
                showModal={showModal}
                closeModal={closeModal}
                handleSave={handleSave}
                formData={formData}
                handleInputChange={handleInputChange}
                editingCategory={editingCategory}
                error={formError}
                setFormError={setFormError}
              />
              <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                title="Konfirmasi Hapus"
                message={`Apakah Anda yakin ingin menghapus ${Array.isArray(itemToDelete) ? itemToDelete.length : 1} kategori terpilih?`}
                isLoading={isDeleting}
              />
            </>
          )}
        </main>
      </Sidebar>
    </ProtectedRoute>
  );
}