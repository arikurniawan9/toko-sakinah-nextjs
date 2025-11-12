'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useDarkMode } from '@/components/DarkModeContext';
import { useSession } from 'next-auth/react';
import { useCategoryForm } from '@/lib/hooks/useCategoryForm';
import CategoryCard from '@/components/kategori/CategoryCard';
import CategoryModal from '@/components/kategori/CategoryModal';
import Pagination from '@/components/produk/Pagination';
import ConfirmationModal from '@/components/ConfirmationModal';
import { AlertTriangle, CheckCircle, Plus, Search, Loader2 } from 'lucide-react';

// Skeleton component for loading state
const CardSkeleton = ({ darkMode }) => (
  <div className={`rounded-xl shadow-md p-6 animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
    <div className="flex items-start justify-between">
      <div className={`w-12 h-12 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-600'}`}></div>
      <div className={`h-6 w-20 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-600'}`}></div>
    </div>
    <div className="mt-4">
      <div className={`h-6 w-3/4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-600'}`}></div>
      <div className={`h-4 w-1/2 rounded mt-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-600'}`}></div>
    </div>
  </div>
);

export default function CategoryManagementPage() {
  const { darkMode } = useDarkMode();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url = `/api/kategori?page=${pagination.page}&limit=${pagination.limit}&search=${searchTerm}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal mengambil data');
      setCategories(data.categories);
      setPagination(prev => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  
  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setPagination(p => ({ ...p, page: 1 })); // Reset to page 1 on search
      fetchCategories();
    }, 500); // 500ms delay
    return () => clearTimeout(handler);
  }, [searchTerm]);


  const {
    showModal,
    editingCategory,
    formData,
    setFormData, // Expose setFormData to handle icon change
    error: formError,
    setError: setFormError,
    handleInputChange,
    openModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave: originalHandleSave,
  } = useCategoryForm(fetchCategories);

  // Wrapper to clear success message on save
  const handleSave = async () => {
    setSuccess(''); // Clear previous success message
    const result = await originalHandleSave();
    if (result.success) {
      setSuccess('Kategori berhasil disimpan!');
    }
  };

  // New handler for IconPicker
  const handleIconChange = (iconName) => {
    setFormData(prev => ({ ...prev, icon: iconName }));
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (id) => {
    if (!isAdmin) return;
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !isAdmin) return;
    setIsDeleting(true);
    setSuccess('');
    setError('');

    try {
      const response = await fetch(`/api/kategori?id=${itemToDelete}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menghapus kategori');
      
      setSuccess('Kategori berhasil dihapus.');
      // Refresh data
      setPagination(p => ({ ...p, page: 1 }));
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };
  
  // Clear messages after a delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className={`flex-1 p-4 sm:p-6 lg:p-8 min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-950'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Manajemen Kategori
            </h1>
            <p className={`mt-1 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Kelola semua kategori produk Anda dengan tampilan kartu yang modern.
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:max-w-md">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Cari kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700 text-white focus:ring-cyan-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-cyan-500'} focus:outline-none focus:ring-2`}
              />
            </div>
            <button
              onClick={openModalForCreate}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Tambah Kategori</span>
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-center p-4 mb-4 rounded-lg bg-red-500/10 text-red-400">
              <AlertTriangle className="h-5 w-5 mr-3" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center p-4 mb-4 rounded-lg bg-green-500/10 text-green-400">
              <CheckCircle className="h-5 w-5 mr-3" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Grid Content */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(pagination.limit)].map((_, i) => <CardSkeleton key={i} darkMode={darkMode} />)}
            </div>
          ) : categories.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categories.map(category => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={openModalForEdit}
                    onDelete={handleDelete}
                    darkMode={darkMode}
                  />
                ))}
              </div>
              {pagination.totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    setCurrentPage={(page) => setPagination(p => ({ ...p, page }))}
                    itemsPerPage={pagination.limit}
                    totalItems={pagination.total}
                    darkMode={darkMode}
                  />
                </div>
              )}
            </>
          ) : (
            <div className={`text-center py-16 px-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Tidak Ada Kategori Ditemukan</h3>
              <p className={`mt-2 text-md ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Coba kata kunci lain atau buat kategori baru.
              </p>
            </div>
          )}
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
              handleIconChange={handleIconChange} // Pass the new handler
              editingCategory={editingCategory}
              error={formError}
              setFormError={setFormError}
              darkMode={darkMode}
            />
            <ConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => setShowDeleteModal(false)}
              onConfirm={handleConfirmDelete}
              title="Konfirmasi Hapus"
              message={`Apakah Anda yakin ingin menghapus kategori ini? Semua produk terkait harus dipindahkan terlebih dahulu.`}
              isLoading={isDeleting}
            />
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
