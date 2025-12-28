'use client';

import { useState, useEffect, useCallback } from 'react';
import { useKeyboardShortcut } from '../../../lib/hooks/useKeyboardShortcut';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserTheme } from '../../../components/UserThemeContext';
import { useSession } from 'next-auth/react';
import { useSupplierForm } from '@/lib/hooks/useSupplierForm';
import { useSupplierTable } from '@/lib/hooks/useSupplierTable';
import SupplierModal from '@/components/supplier/SupplierModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import Toast from '@/components/Toast';
import { AlertTriangle, CheckCircle, Plus, Search, Edit, Trash2, Eye, FileText, Download } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Breadcrumb from '@/components/Breadcrumb';
import * as XLSX from 'xlsx';
import ImportModal from '@/components/ImportModal'; // ADDED: Import ImportModal
import { exportSupplierPDF } from '@/utils/exportSupplierPDF';
import { generateSupplierImportTemplate } from '@/utils/supplierImportTemplate';
import { z } from 'zod';

export default function SupplierManagementPage() {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const { data: session } = useSession();
  const canManageSuppliers = session?.user?.role === 'WAREHOUSE' || session?.user?.role === 'MANAGER';

  const {
    suppliers,
    loading,
    error: tableError,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalSuppliers,
    fetchSuppliers,
    setError: setTableError,
    triggerRefresh, // Destructure triggerRefresh
  } = useSupplierTable({ scope: 'warehouse' });

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
  } = useSupplierForm(fetchSuppliers, { scope: 'warehouse' });

  const [success, setSuccess] = useState('');
  const [errorState, setErrorState] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false); // ADDED: State for import modal
  const [showDetailModal, setShowDetailModal] = useState(false); // State for detail modal
  const [selectedSupplier, setSelectedSupplier] = useState(null); // Selected supplier for detail

  // ESC key to close modals
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (showModal) closeModal();
        if (showDeleteModal) setShowDeleteModal(false);
        if (showImportModal) setShowImportModal(false);
        if (showDetailModal) setShowDetailModal(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showModal, showDeleteModal, showImportModal, showDetailModal, closeModal]);

  // Keyboard shortcuts
  useKeyboardShortcut({
    'alt+n': () => canManageSuppliers && openModalForCreate(), // Tambah supplier baru
    'alt+i': () => canManageSuppliers && setShowImportModal(true), // Import
    'alt+e': () => canManageSuppliers && document.querySelector('button[title="Ekspor"]')?.click(), // Export
    'alt+d': () => {
      // Download template supplier
      const link = document.createElement('a');
      link.href = '/templates/contoh-import-supplier.csv';
      link.download = 'contoh-import-supplier.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, // Download template
    'alt+k': (e) => {
      if (e) e.preventDefault();
      document.querySelector('input[placeholder*="Cari"]')?.focus();
    }, // Fokus ke search
    'alt+s': (e) => {
      if (e) e.preventDefault();
      if (showModal) {
        handleSave();
      }
    }, // Simpan jika modal terbuka
  });

  const handleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allRowIds = suppliers.map(s => s.id);
      setSelectedRows(allRowIds);
    } else {
      setSelectedRows([]);
    }
  };

  const handleSave = async () => {
    const result = await originalHandleSave();
    if (result.success) {
      setSuccess('Supplier berhasil disimpan!');
      triggerRefresh(); // Refresh data on save
    }
  };

  const handleDelete = (ids) => {
    if (!canManageSuppliers) return;
    setItemsToDelete(ids);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (itemsToDelete.length === 0 || !canManageSuppliers) return;
    setIsDeleting(true);
    setSuccess('');
    setErrorState('');

    try {
      const response = await fetch(`/api/warehouse/supplier`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: itemsToDelete }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menghapus supplier');

      setSuccess(`Berhasil menghapus ${result.deletedCount} supplier.`);
      setSelectedRows([]);
      triggerRefresh(); // Refresh data
    } catch (err) {
      setErrorState(err.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setItemsToDelete([]);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/warehouse/supplier?export=true');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengambil data untuk ekspor');
      }

      const suppliersToExport = data.suppliers.map((sup, index) => ({
        'No.': index + 1,
        'Kode Supplier': sup.code,
        'Nama Supplier': sup.name,
        'Nama Kontak': sup.contactPerson || '-',
        'Telepon': sup.phone || '-',
        'Email': sup.email || '-',
        'Alamat': sup.address || '-',
        'Jumlah Produk': sup.productCount || 0, // Include product count
        'Dibuat Pada': new Date(sup.createdAt).toLocaleDateString('id-ID'),
        'Diperbarui Pada': new Date(sup.updatedAt).toLocaleDateString('id-ID'),
      }));

      const ws = XLSX.utils.json_to_sheet(suppliersToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Supplier');
      XLSX.writeFile(wb, 'supplier_data.xlsx');
      setSuccess('Data supplier berhasil diekspor.');
    } catch (err) {
      setErrorState(err.message);
    }
  };

  const handleImport = () => {
    setShowImportModal(true);
    setErrorState(''); // Clear any previous error when opening import modal
  }; // ADDED: handleImport function

  // Fungsi untuk export PDF
  const handleExportPDF = async () => {
    try {
      await exportSupplierPDF(suppliers, darkMode);
      setSuccess('Laporan PDF berhasil dibuat!');
    } catch (error) {
      setErrorState(error.message || 'Gagal membuat laporan PDF');
    }
  };

  useEffect(() => {
    if (success) {
      setTimeout(() => setSuccess(''), 5000);
    }
    if (tableError) {
      setTimeout(() => setTableError(''), 5000);
    }
  }, [success, tableError]);

  // Handle table errors with toast
  useEffect(() => {
    if (tableError) {
      setErrorState(tableError);
    }
  }, [tableError]);

  // Handle form errors with toast
  useEffect(() => {
    if (formError) {
      setErrorState(formError);
    }
  }, [formError]);

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
      key: 'code',
      title: 'Kode Supplier',
      sortable: true
    },
    {
      key: 'name',
      title: 'Nama Supplier',
      sortable: true
    },
    {
      key: 'contactPerson',
      title: 'Kontak',
      render: (value) => value || '-',
      sortable: true
    },
    {
      key: 'phone',
      title: 'Telepon',
      render: (value) => value || '-',
      sortable: true
    },
    {
      key: 'productCount',
      title: 'Jumlah Produk',
      sortable: true,
      render: (value) => value || 0,
    },
  ];

  const handleViewDetail = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailModal(true);
  };

  const renderRowActions = (row) => (
    <>
      <button onClick={() => openModalForEdit(row)} className="p-1 text-blue-500 hover:text-blue-700 mr-2">
        <Edit size={18} />
      </button>
      <button onClick={() => handleViewDetail(row)} className="p-1 text-green-500 hover:text-green-700 mr-2">
        <Eye size={18} />
      </button>
      <button onClick={() => handleDelete([row.id])} className="p-1 text-red-500 hover:text-red-700">
        <Trash2 size={18} />
      </button>
    </>
  );

  const paginationData = {
    currentPage,
    totalPages,
    totalItems: totalSuppliers,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, totalSuppliers),
    onPageChange: setCurrentPage,
    itemsPerPage: itemsPerPage
  };

  return (
    <ProtectedRoute requiredRole="WAREHOUSE">
      <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <Breadcrumb
          items={[
            { title: 'Dashboard Gudang', href: '/warehouse' },
            { title: 'Supplier', href: '/warehouse/supplier' }
          ]}
          darkMode={darkMode}
        />

        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Manajemen Supplier Gudang
        </h1>

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <DataTable
            data={suppliers}
            columns={columns}
            loading={loading}
            selectedRows={selectedRows}
            onSelectAll={handleSelectAll}
            onSelectRow={handleSelectRow}
            onAdd={canManageSuppliers ? openModalForCreate : undefined}
            onSearch={setSearchTerm}
            onExport={handleExport} // Pass handleExport
            onExportPDF={handleExportPDF} // Pass handleExportPDF
            onItemsPerPageChange={setItemsPerPage}
            darkMode={darkMode}
            actions={canManageSuppliers}
            showToolbar={true}
            showAdd={canManageSuppliers}
            showExport={true} // Show export button
            showExportPDF={true} // Show export PDF button
            showItemsPerPage={true}
            pagination={paginationData}
            mobileColumns={['code', 'name', 'contactPerson']}
            rowActions={renderRowActions}
            onDeleteMultiple={() => handleDelete(selectedRows)}
            selectedRowsCount={selectedRows.length}
            onImport={handleImport} // ADDED: Pass handleImport
            showImport={canManageSuppliers} // ADDED: Show import button
          />
        </div>

        {/* Toast notifications */}
        {errorState && (
          <Toast
            message={errorState}
            type="error"
            onClose={() => setErrorState('')}
          />
        )}
        {success && (
          <Toast
            message={success}
            type="success"
            onClose={() => setSuccess('')}
          />
        )}

        {canManageSuppliers && (
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
              title={`Konfirmasi Hapus ${itemsToDelete.length} Supplier`}
              message={`Apakah Anda yakin ingin menghapus supplier yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
              isLoading={isDeleting}
            />
            {/* ADDED: ImportModal Placeholder */}
            {showImportModal && (
              <ImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImportSuccess={() => {
                  triggerRefresh(); // Refresh data
                  setShowImportModal(false);
                  setSuccess('Import supplier berhasil!');
                }}
                darkMode={darkMode}
                importEndpoint="/api/warehouse/supplier/import"
                checkDuplicatesEndpoint="/api/warehouse/supplier/check-duplicates"
                templateGenerator={generateSupplierImportTemplate}
                entityName="Supplier"
                schema={z.object({
                  name: z.string().min(1, { message: 'Nama supplier wajib diisi' }),
                  contactPerson: z.string().optional().nullable(),
                  phone: z.string().max(13, { message: 'Nomor telepon maksimal 13 karakter' }).optional().nullable(),
                  email: z.string().email('Format email tidak valid').optional().nullable(),
                  address: z.string().optional().nullable(),
                })}
                columnMapping={{
                  'Kode Supplier': 'code',
                  'Nama Supplier': 'name',
                  'Nama Kontak': 'contactPerson',
                  'Telepon': 'phone',
                  'Email': 'email',
                  'Alamat': 'address'
                }}
                generateTemplateLabel="Unduh Template Supplier"
              />
            )}

            {/* Detail Modal for Supplier */}
            {showDetailModal && selectedSupplier && (
              <div className="fixed z-50 inset-0 overflow-y-auto">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
                  </div>

                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                  <div className={`inline-block align-bottom ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                  } rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${
                    darkMode ? 'border-gray-700' : 'border-pastel-purple-200'
                  } border`}>
                    <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                      <div className="sm:flex sm:items-start">
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                          <h3 className={`text-lg leading-6 font-medium ${
                            darkMode ? 'text-cyan-400' : 'text-cyan-800'
                          }`} id="modal-title">
                            Detail Supplier
                          </h3>
                          <div className="mt-4 w-full">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Kode Supplier</p>
                                <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedSupplier.code}</p>
                              </div>
                              <div>
                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nama Supplier</p>
                                <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedSupplier.name}</p>
                              </div>
                              <div>
                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nama Kontak</p>
                                <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedSupplier.contactPerson || '-'}</p>
                              </div>
                              <div>
                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Telepon</p>
                                <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedSupplier.phone || '-'}</p>
                              </div>
                              <div>
                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                                <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedSupplier.email || '-'}</p>
                              </div>
                              <div className="col-span-2">
                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Alamat</p>
                                <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedSupplier.address || '-'}</p>
                              </div>
                              <div>
                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Jumlah Produk</p>
                                <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedSupplier.productCount || 0}</p>
                              </div>
                              <div>
                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tanggal Dibuat</p>
                                <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{new Date(selectedSupplier.createdAt).toLocaleDateString('id-ID')}</p>
                              </div>
                              <div>
                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tanggal Diperbarui</p>
                                <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{new Date(selectedSupplier.updatedAt).toLocaleDateString('id-ID')}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${
                      darkMode ? 'bg-gray-700' : 'bg-pastel-purple-50'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setShowDetailModal(false)}
                        className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                          darkMode
                            ? 'bg-cyan-600 hover:bg-cyan-700'
                            : 'bg-cyan-600 hover:bg-cyan-700'
                        }`}
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {/* Keyboard Shortcuts Guide */}
        <div className={`mt-4 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="flex flex-wrap gap-3">
            <span>Tambah: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>Alt+N</kbd></span>
            <span>Import: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>Alt+I</kbd></span>
            <span>Export: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>Alt+E</kbd></span>
            <span>Template: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>Alt+D</kbd></span>
            <span>Cari: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>Alt+K</kbd></span>
            <span>Simpan: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>Alt+S</kbd></span>
            <span>Tutup: <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>ESC</kbd></span>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
