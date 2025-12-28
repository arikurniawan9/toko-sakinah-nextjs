'use client';

import { useState, useEffect } from 'react';
import { useKeyboardShortcut } from '../../../lib/hooks/useKeyboardShortcut';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserTheme } from '@/components/UserThemeContext';
import { useSession } from 'next-auth/react';
import { useUserForm } from '@/lib/hooks/useUserForm';
import { useWarehouseUserTable } from '@/lib/hooks/useWarehouseUserTable';
import UserModal from '@/components/admin/UserModal';
import Link from 'next/link';
import ConfirmationModal from '@/components/ConfirmationModal';
import { AlertTriangle, CheckCircle, Plus, Edit, Trash2, Search, Eye } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Breadcrumb from '@/components/Breadcrumb';

export default function WarehouseUserManagement() {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const { data: session } = useSession();
  const canManageUsers = session?.user?.role === 'WAREHOUSE' || session?.user?.role === 'MANAGER';

  const {
    users,
    loading,
    error: tableError,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalUsers,
    fetchUsers,
    setError: setTableError,
  } = useWarehouseUserTable(); // Get all warehouse users

  const {
    showModal,
    editingUser,
    formData,
    setFormData,
    handleInputChange,
    openModalForEdit: originalOpenModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave: originalHandleSave,
    error: formError,
    setError: setFormError,
  } = useUserForm(fetchUsers, { isWarehouseContext: true }); // Warehouse context without default role

  // Keyboard shortcuts
  useKeyboardShortcut({
    'alt+n': () => canManageUsers && openModalForCreate(), // Tambah user baru
    'alt+i': () => canManageUsers && console.log('Import user'), // Import (belum diimplementasikan di halaman ini)
    'alt+e': () => canManageUsers && console.log('Export user'), // Export (belum diimplementasikan di halaman ini)
    'alt+d': () => {
      // Download template user (belum diimplementasikan di halaman ini)
      console.log('Download template user');
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

  // Override openModalForEdit to handle warehouse context
  const openModalForEdit = (user, isAttendantForm = false) => {
    // Use warehouse store ID for editing
    const storeIdToUse = warehouseStore && warehouseStore[0] ? warehouseStore[0].id : user.storeId || '';

    // Prepare updated user data with warehouse store ID
    const updatedUser = {
      ...user,
      storeId: storeIdToUse
    };

    // Call the original function with updated user data
    originalOpenModalForEdit(updatedUser, isAttendantForm);
  };

  // Override handleSave to ensure it uses warehouse store ID
  const handleSave = async () => {
    // Update formData with warehouse store ID before saving
    const updatedFormData = {
      ...formData,
      storeId: warehouseStore && warehouseStore[0] ? warehouseStore[0].id : formData.storeId
    };

    // Update the formData state with the new storeId
    setFormData(updatedFormData);

    // Call original save function
    await originalHandleSave();
    setSuccessMessage(editingUser ? 'User berhasil diperbarui.' : 'User berhasil dibuat.');
  };

  // Get warehouse store for the modal
  const [warehouseStore, setWarehouseStore] = useState(null);
  useEffect(() => {
    const fetchWarehouseStore = async () => {
      try {
        const response = await fetch('/api/warehouse/store');
        if (response.ok) {
          const data = await response.json();
          if (data.store) {
            setWarehouseStore([data.store]); // Pass as array since UserModal expects an array
          }
        }
      } catch (error) {
        console.error('Error fetching warehouse store:', error);
      }
    };
    fetchWarehouseStore();
  }, []);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  // ESC key to close modals
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (showModal) closeModal();
        if (showDeleteModal) setShowDeleteModal(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showModal, showDeleteModal, closeModal]);

  const handleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allRowIds = users.map(u => u.id);
      setSelectedRows(allRowIds);
    } else {
      setSelectedRows([]);
    }
  };

  const handleDelete = (ids) => {
    if (!canManageUsers) return;
    setItemsToDelete(ids);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (itemsToDelete.length === 0 || !canManageUsers) return;
    setIsDeleting(true);
    setTableError('');

    try {
      const response = await fetch(`/api/warehouse/users`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: itemsToDelete }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menghapus user');

      setSuccessMessage(`Berhasil menghapus ${result.deletedCount} user.`);
      setSelectedRows([]);
      fetchUsers(); // Refresh data
    } catch (err) {
      setTableError(err.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setItemsToDelete([]);
    }
  };
  
    useEffect(() => {
    if (tableError || successMessage) {
      const timer = setTimeout(() => {
        setTableError('');
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [tableError, successMessage]);


  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const columns = [
    {
      key: 'no',
      title: 'No.',
      render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    { key: 'employeeNumber', title: 'Kode Karyawan', sortable: true },
    { key: 'name', title: 'Nama Lengkap', sortable: true },
    { key: 'username', title: 'Username', sortable: true },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          value === 'AKTIF' || value === 'ACTIVE'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'role',
      title: 'Role',
      render: (value) => {
        switch(value) {
          case 'CASHIER':
            return 'Kasir';
          case 'ATTENDANT':
            return 'Pelayan';
          default:
            return value;
        }
      },
      sortable: true
    },
  ];

  const renderRowActions = (row) => (
    <>
      <Link href={`/warehouse/users/${row.id}`} className="p-1 text-green-500 hover:text-green-700 mr-2" title="Lihat Detail">
        <Eye size={18} />
      </Link>
      <button
        onClick={() => openModalForEdit(row)}
        className="p-1 text-blue-500 hover:text-blue-700 mr-2"
        title="Edit"
      >
        <Edit size={18} />
      </button>
      <button
        onClick={() => handleDelete([row.id])}
        className="p-1 text-red-500 hover:text-red-500"
        title="Hapus"
      >
        <Trash2 size={18} />
      </button>
    </>
  );

  const paginationData = {
    currentPage,
    totalPages,
    totalItems: totalUsers,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, totalUsers),
    onPageChange: setCurrentPage,
    itemsPerPage: itemsPerPage
  };

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { title: 'Dashboard Gudang', href: '/warehouse' },
          { title: 'Manajemen User', href: '/warehouse/users' }
        ]}
        darkMode={darkMode}
      />

      <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Manajemen User Gudang
      </h1>
      
      <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
        <DataTable
          data={users}
          columns={columns}
          loading={loading}
          selectedRows={selectedRows}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onAdd={canManageUsers ?
            () => {
              if (warehouseStore && warehouseStore[0]) {
                openModalForCreate({ storeId: warehouseStore[0].id });
              } else {
                // If warehouse store is not loaded yet, fetch it first
                const fetchAndOpen = async () => {
                  try {
                    const response = await fetch('/api/warehouse/store');
                    if (response.ok) {
                      const data = await response.json();
                      if (data.store) {
                        openModalForCreate({ storeId: data.store.id });
                      }
                    }
                  } catch (error) {
                    console.error('Error fetching warehouse store:', error);
                    openModalForCreate(); // Open without store ID as fallback
                  }
                };
                fetchAndOpen();
              }
            }
          : undefined}
          onSearch={setSearchTerm}
          onItemsPerPageChange={setItemsPerPage}
          darkMode={darkMode}
          actions={canManageUsers}
          showAdd={canManageUsers}
          pagination={paginationData}
          mobileColumns={['employeeNumber', 'name', 'role']}
          rowActions={renderRowActions}
          onDeleteMultiple={() => handleDelete(selectedRows)}
          selectedRowsCount={selectedRows.length}
        />
      </div>

      {(tableError || formError) && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center p-4 rounded-lg bg-red-500/10 text-red-400 shadow-lg">
          <AlertTriangle className="h-5 w-5 mr-3" />
          <p className="text-sm font-medium">{tableError || formError}</p>
        </div>
      )}
      
      {successMessage && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center p-4 rounded-lg bg-green-500/10 text-green-400 shadow-lg">
              <CheckCircle className="h-5 w-5 mr-3" />
              <p className="text-sm font-medium">{successMessage}</p>
          </div>
      )}

      {canManageUsers && (
        <>
          <UserModal
            showModal={showModal}
            closeModal={closeModal}
            handleSave={handleSave}
            formData={formData}
            handleInputChange={handleInputChange}
            editingUser={editingUser}
            error={formError}
            setFormError={setFormError}
            darkMode={darkMode}
            allowedRoles={['CASHIER', 'ATTENDANT']} // Allow creating CASHIER and ATTENDANT users only
            stores={warehouseStore || []} // Pass warehouse store to the modal
          />
          <ConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            title={`Konfirmasi Hapus ${itemsToDelete.length} User`}
            message="Apakah Anda yakin ingin menghapus user yang dipilih? Tindakan ini tidak dapat dibatalkan."
            isLoading={isDeleting}
          />
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
  );
}
