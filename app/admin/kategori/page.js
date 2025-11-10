'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useDarkMode } from '@/components/DarkModeContext';
import { useSession } from 'next-auth/react';
import { useCategoryTable } from '@/lib/hooks/useCategoryTable';
import { useCategoryForm } from '@/lib/hooks/useCategoryForm';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import CategoryTable from '@/components/kategori/CategoryTable';
import CategoryModal from '@/components/kategori/CategoryModal';
import CategoryToolbar from '@/components/kategori/CategoryToolbar';
import CategoryDetailModal from '@/components/kategori/CategoryDetailModal'; // Import new modal
import Pagination from '@/components/produk/Pagination';
import ConfirmationModal from '@/components/ConfirmationModal';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function CategoryManagementPage() {
  const { darkMode } = useDarkMode();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  // Page-level success message state
  const [pageSuccessMessage, setPageSuccessMessage] = useState('');

  const {
    categories,
    loading,
    error: tableError,
    setError: setTableError,
    searchTerm,
    setSearchTerm,
    pagination,
    setPagination,
    fetchCategories,
  } = useCategoryTable();

  const {
    showModal,
    editingCategory,
    formData,
    error: formError, // Correctly destructure and rename
    setError: setFormError, // Correctly destructure and rename
    success: formSuccessMessage, // Correctly destructure and rename
    setSuccess: setFormSuccessMessage, // Correctly destructure and rename
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
  const [exportLoading, setExportLoading] = useState(false);

  // State for CategoryDetailModal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCategoryForDetail, setSelectedCategoryForDetail] = useState(null);

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

    const idsToDelete = Array.isArray(itemToDelete) ? itemToDelete : [itemToDelete];
    const url = '/api/kategori';
    const options = {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: idsToDelete }),
    };

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menghapus kategori');
      
      await fetchCategories();
      setPageSuccessMessage(`Berhasil menghapus ${idsToDelete.length} kategori.`); // Use page-level state
      if (Array.isArray(itemToDelete)) clearSelection();
    } catch (err) {
      setTableError(err.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      // Fetch all categories without pagination for export
      const response = await fetch('/api/kategori?limit=0');
      if (!response.ok) throw new Error('Gagal mengambil data untuk export');
      const data = await response.json();

      let csvContent = 'Nama,Deskripsi,Tanggal Dibuat,Tanggal Diubah\n';
      data.categories.forEach(category => {
        const name = `"${(category.name || '').replace(/"/g, '""')}"`;
        const description = `"${(category.description || '').replace(/"/g, '""')}"`;
        const createdAt = `"${new Date(category.createdAt).toLocaleString('id-ID')}"`;
        const updatedAt = `"${new Date(category.updatedAt).toLocaleString('id-ID')}"`;
        csvContent += `${name},${description},${createdAt},${updatedAt}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `kategori-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setPageSuccessMessage('Data kategori berhasil diekspor.'); // Use page-level state
    } catch (err) {
      setTableError('Gagal mengekspor data: ' + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  // Handler to open CategoryDetailModal
  const handleViewDetails = (category) => {
    setSelectedCategoryForDetail(category);
    setShowDetailModal(true);
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className={`flex-1 p-4 sm:p-6 lg:p-8 min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Manajemen Kategori
            </h1>
            <p className={`mt-1 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Kelola semua kategori produk Anda di satu tempat.
            </p>
          </div>

          <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} border overflow-hidden`}>
            <div className="p-4 sm:p-6">
              <CategoryToolbar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                itemsPerPage={pagination.limit}
                setItemsPerPage={(value) => setPagination(p => ({ ...p, limit: value, page: 1 }))}
                onAddNew={openModalForCreate}
                onDeleteMultiple={handleDeleteMultiple}
                selectedRowsCount={selectedRows.length}
                onExport={handleExport}
                exportLoading={exportLoading}
                isAdmin={isAdmin}
              />

              {tableError && (
                <div className="flex items-center p-4 my-4 rounded-lg bg-red-500/10 text-red-400">
                  <AlertTriangle className="h-5 w-5 mr-3" />
                  <p className="text-sm font-medium">{tableError}</p>
                </div>
              )}
              {pageSuccessMessage && ( // Use page-level state
                <div className="flex items-center p-4 my-4 rounded-lg bg-green-500/10 text-green-400">
                  <CheckCircle className="h-5 w-5 mr-3" />
                  <p className="text-sm font-medium">{pageSuccessMessage}</p>
                </div>
              )}

              <CategoryTable
                categories={categories}
                loading={loading}
                selectedRows={selectedRows}
                handleSelectAll={handleSelectAll}
                handleSelectRow={handleSelectRow}
                handleEdit={openModalForEdit}
                handleDelete={handleDelete}
                onViewDetails={handleViewDetails} // Pass new handler
                isAdmin={isAdmin}
              />
            </div>
            
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
            {/* New CategoryDetailModal */}
            <CategoryDetailModal
              isOpen={showDetailModal}
              onClose={() => setShowDetailModal(false)}
              category={selectedCategoryForDetail}
            />
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
