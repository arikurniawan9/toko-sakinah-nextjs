// app/admin/supplier/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useDarkMode } from '@/components/DarkModeContext';
import { useSession } from 'next-auth/react';
import { useSupplierForm } from '@/lib/hooks/useSupplierForm';
import { useTableSelection } from '@/lib/hooks/useTableSelection'; // Reintroduce for table view
import SupplierCard from '@/components/supplier/SupplierCard';
import SupplierTable from '@/components/supplier/SupplierTable'; // Reintroduce for table view
import SupplierModal from '@/components/supplier/SupplierModal';
import SupplierToolbar from '@/components/supplier/SupplierToolbar'; // Import the new toolbar
import Pagination from '@/components/produk/Pagination';
import ConfirmationModal from '@/components/ConfirmationModal';
import { AlertTriangle, CheckCircle } from 'lucide-react';

// Skeleton component for loading state
const CardSkeleton = ({ darkMode }) => (
  <div className={`rounded-xl shadow-md p-6 animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
    <div className="flex items-start justify-between">
      <div className={`w-12 h-12 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-600'}`}></div>
      <div className={`h-6 w-20 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-600'}`}></div>
    </div>
    <div className="mt-4">
      <div className={`h-6 w-3/4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-600'}`}></div>
      <div className={`h-4 w-1/2 rounded mt-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-600'}`}></div>
    </div>
    <div className={`h-4 w-full rounded mt-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-600'}`}></div>
    <div className={`h-4 w-2/3 rounded mt-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-600'}`}></div>
  </div>
);

export default function SupplierManagementPage() {
  const { darkMode } = useDarkMode();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [view, setView] = useState('grid'); // 'grid' or 'table'

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url = `/api/supplier?page=${pagination.page}&limit=${pagination.limit}&search=${searchTerm}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal mengambil data');
      setSuppliers(data.suppliers);
      setPagination(prev => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);
  
  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setPagination(p => ({ ...p, page: 1 })); // Reset to page 1 on search
      fetchSuppliers();
    }, 500); // 500ms delay
    return () => clearTimeout(handler);
  }, [searchTerm]);


  const {
    showModal,
    editingSupplier,
    formData,
    setFormData,
    error: formError,
    setError: setFormError,
    handleInputChange,
    openModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave: originalHandleSave,
  } = useSupplierForm(fetchSuppliers);

  // Wrapper to clear success message on save
  const handleSave = async () => {
    setSuccess(''); // Clear previous success message
    const result = await originalHandleSave();
    if (result.success) {
      setSuccess('Supplier berhasil disimpan!');
    }
  };

  const { selectedRows, handleSelectAll, handleSelectRow, clearSelection } = useTableSelection(suppliers); // Reintroduce

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // Can be a single ID (string) or multiple IDs (array)
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State for import/export loading states
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const handleDelete = (id) => {
    if (!isAdmin) return;
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  // Fungsi untuk export data supplier
  const handleExport = async () => {
    if (exportLoading) return;
    
    setExportLoading(true);
    setError('');
    setSuccess('');

    try {
      // Fetch all suppliers for export
      const response = await fetch(`/api/supplier?page=1&limit=${pagination.total}`);
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data supplier untuk ekspor');
      }

      const data = await response.json();
      
      // Buat file CSV dari data supplier
      const csvContent = convertToCSV(data.suppliers);
      
      // Buat blob dan trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `supplier_export_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess('Data supplier berhasil diekspor!');
    } catch (err) {
      setError(err.message || 'Gagal mengekspor data supplier');
    } finally {
      setExportLoading(false);
    }
  };

  // Fungsi untuk convert data ke format CSV
  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        // Escape values that contain commas, quotes, or newlines
        const value = row[header] || '';
        return typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(','))
    ].join('\n');
    
    return csvContent;
  };

  // Fungsi untuk import data supplier
  const handleImport = async (event) => {
    if (importLoading) return;
    
    const file = event.target.files[0];
    if (!file) return;
    
    // Validasi tipe file
    const validTypes = ['text/csv', 'application/vnd.ms-excel', '.csv'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      setError('Hanya file CSV yang diperbolehkan untuk diimpor');
      return;
    }
    
    setImportLoading(true);
    setError('');
    setSuccess('');

    try {
      const text = await file.text();
      const suppliers = parseCSV(text);
      
      // Validasi data sebelum dikirim
      if (!suppliers || suppliers.length === 0) {
        throw new Error('Tidak ada data supplier yang valid ditemukan dalam file');
      }

      // Kirim data ke API
      const response = await fetch('/api/supplier/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suppliers }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Terjadi kesalahan saat mengimpor data');
      }

      setSuccess(`Berhasil mengimpor ${suppliers.length} supplier. Harap refresh halaman untuk melihat data terbaru.`);
      
      // Refresh data
      fetchSuppliers();
    } catch (err) {
      setError(err.message || 'Gagal mengimpor data supplier');
    } finally {
      setImportLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Fungsi untuk parse CSV
  const parseCSV = (csvText) => {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(header => header.trim());
    const suppliers = [];
    
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].trim();
      if (currentLine === '') continue;
      
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < currentLine.length; j++) {
        const char = currentLine[j];
        
        if (char === '"') {
          if (inQuotes && j + 1 < currentLine.length && currentLine[j + 1] === '"') {
            // Handle double quotes inside quoted field
            current += '"';
            j++; // Skip next quote
          } else {
            // Toggle quotes state
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      values.push(current.trim());
      
      // Buat objek supplier dari values dan headers
      const supplier = {};
      headers.forEach((header, index) => {
        supplier[header] = values[index] || '';
      });
      
      suppliers.push(supplier);
    }
    
    return suppliers;
  };

  const handleDeleteMultiple = () => { // Reintroduce
    if (!isAdmin || selectedRows.length === 0) return;
    setItemToDelete(selectedRows);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !isAdmin) return;
    setIsDeleting(true);
    setSuccess('');
    setError('');

    const idsToDelete = Array.isArray(itemToDelete) ? itemToDelete : [itemToDelete];
    const url = '/api/supplier';
    const options = {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: idsToDelete }),
    };

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menghapus supplier');
      
      setSuccess(`Berhasil menghapus ${idsToDelete.length} supplier.`);
      // Refresh data
      setPagination(p => ({ ...p, page: 1 }));
      fetchSuppliers();
      clearSelection(); // Clear selection after deletion
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
              Manajemen Supplier
            </h1>
            <p className={`mt-1 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Kelola semua supplier produk Anda.
            </p>
          </div>

          {/* Toolbar */}
              <SupplierToolbar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onAddNew={openModalForCreate}
                onDeleteMultiple={handleDeleteMultiple}
                selectedRowsCount={selectedRows.length}
                onExport={handleExport}
                onImport={handleImport}
                importLoading={importLoading}
                exportLoading={exportLoading}
                view={view}
                setView={setView}
                darkMode={darkMode}
              />

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

          {/* Content based on view */}
          {loading ? (
            view === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(pagination.limit)].map((_, i) => <CardSkeleton key={i} darkMode={darkMode} />)}
              </div>
            ) : (
              <div className="animate-pulse">
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} h-12 rounded mb-4`}></div>
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} h-96 rounded`}></div>
              </div>
            )
          ) : suppliers.length > 0 ? (
            <>
              {view === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {suppliers.map(supplier => (
                    <SupplierCard
                      key={supplier.id}
                      supplier={supplier}
                      onEdit={openModalForEdit}
                      onDelete={handleDelete}
                      darkMode={darkMode}
                    />
                  ))}
                </div>
              ) : (
                <SupplierTable
                  suppliers={suppliers}
                  loading={loading}
                  darkMode={darkMode}
                  selectedRows={selectedRows}
                  handleSelectAll={handleSelectAll}
                  handleSelectRow={handleSelectRow}
                  onEdit={openModalForEdit}
                  onDelete={handleDelete}
                />
              )}
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
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Tidak Ada Supplier Ditemukan</h3>
              <p className={`mt-2 text-md ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Coba kata kunci lain atau buat supplier baru.
              </p>
            </div>
          )}
        </div>

        {/* Modals */}
        {isAdmin && (
          <>
            <SupplierModal
              showModal={showModal}
              closeModal={closeModal}
              handleSave={handleSave}
              formData={formData}
              handleInputChange={handleInputChange}
              editingSupplier={editingSupplier}
              error={formError}
              setFormError={setFormError}
              darkMode={darkMode}
            />
            <ConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => setShowDeleteModal(false)}
              onConfirm={handleConfirmDelete}
              title="Konfirmasi Hapus"
              message={`Apakah Anda yakin ingin menghapus ${ 
                Array.isArray(itemToDelete) ? itemToDelete.length + ' supplier terpilih' : 'supplier ini'
              }? Semua produk terkait harus dipindahkan terlebih dahulu.`}
              isLoading={isDeleting}
            />
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
