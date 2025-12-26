'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserTheme } from '@/components/UserThemeContext';
import { useSession } from 'next-auth/react';
import { useUserForm } from '@/lib/hooks/useUserForm';
import { useUserTable } from '@/lib/hooks/useUserTable';
import UserModal from '@/components/admin/UserModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { AlertTriangle, Plus, Edit, Trash2, Eye, CheckCircle } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';

// Custom hook to fetch only attendants
const usePelayanTable = () => {
  const { users, ...rest } = useUserTable('ATTENDANT');
  return { attendants: users, ...rest };
};

export default function PelayanManagement() {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const currentStoreId = session?.user?.storeId;
  const currentStoreName = session?.user?.storeAccess?.name; // Corrected: Access store name from storeAccess

  const {
    attendants,
    loading,
    error: tableError,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalUsers: totalAttendants,
    fetchUsers: fetchAttendants,
    setError: setTableError,
  } = usePelayanTable();

  const {
    showModal,
    editingUser: editingAttendant,
    formData,
    setFormData,
    error: formError,
    setError: setFormError,
    handleInputChange,
    openModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave: originalHandleSave,
  } = useUserForm(fetchAttendants, {
    defaultRole: 'ATTENDANT',
    currentStoreId: currentStoreId, // Pass currentStoreId to the form hook
    isAttendantForm: true, // Indicate that this is for attendant creation
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allRowIds = attendants.map(u => u.id);
      setSelectedRows(allRowIds);
    } else {
      setSelectedRows([]);
    }
  };

  const handleSave = async () => {
    await originalHandleSave();
  };

  const handleDelete = (ids) => {
    if (!isAdmin) {
      setTableError('Hanya admin yang dapat menonaktifkan pelayan');
      return;
    }
    setItemsToDelete(ids);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (itemsToDelete.length === 0 || !isAdmin) return;
    setIsDeleting(true);
    setTableError('');

    try {
      const response = await fetch(`/api/store-users`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: itemsToDelete }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menonaktifkan pelayan');

      // Beri feedback bahwa pelayan berhasil dinonaktifkan
      const message = itemsToDelete.length > 1
        ? `Berhasil menonaktifkan ${itemsToDelete.length} pelayan`
        : `Berhasil menonaktifkan 1 pelayan`;

      setSuccessMessage(message);
      setSelectedRows([]);
      fetchAttendants(); // Refresh data
    } catch (err) {
      setTableError(err.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setItemsToDelete([]);
    }
  };

    useEffect(() => {
    if (tableError) {
      const timer = setTimeout(() => setTableError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [tableError]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

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
  ];

  const renderRowActions = (row) => {
    // Jika status user adalah TIDAK_AKTIF atau INACTIVE, tampilkan tombol Aktifkan
    const isInactive = row.status === 'TIDAK_AKTIF' || row.status === 'INACTIVE';

    if (isInactive) {
      return (
        <>
          <Link href={`/admin/pelayan/${row.id}`} passHref>
            <button
              className="p-1 text-gray-500 hover:text-gray-700 mr-2"
              title="Lihat Detail"
            >
              <Eye size={18} />
            </button>
          </Link>
          <button
            onClick={async () => {
              try {
                const response = await fetch(`/api/store-users/${row.id}/activate`, {
                  method: 'PATCH'
                });

                if (response.ok) {
                  const result = await response.json();
                  // Tampilkan pesan sukses
                  // Di sini Anda bisa menambahkan toast notification jika diinginkan
                  fetchAttendants(); // Refresh data
                } else {
                  const error = await response.json();
                  setTableError(error.error || 'Gagal mengaktifkan pelayan');
                }
              } catch (error) {
                setTableError('Terjadi kesalahan saat mengaktifkan pelayan');
              }
            }}
            className="p-1 text-green-500 hover:text-green-700 mr-2"
            title="Aktifkan Pelayan"
          >
            <CheckCircle size={18} />
          </button>
        </>
      );
    }

    return (
      <>
        <Link href={`/admin/pelayan/${row.id}`} passHref>
          <button
            className="p-1 text-gray-500 hover:text-gray-700 mr-2"
            title="Lihat Detail"
          >
            <Eye size={18} />
          </button>
        </Link>
        <button
          onClick={() => openModalForEdit(row, true)}
          className="p-1 text-blue-500 hover:text-blue-700 mr-2"
          title="Edit"
        >
          <Edit size={18} />
        </button>
        <button
          onClick={() => handleDelete([row.id])}
          className="p-1 text-red-500 hover:text-red-700"
          title="Hapus"
        >
          <Trash2 size={18} />
        </button>
      </>
    );
  };

  const paginationData = {
    currentPage,
    totalPages,
    totalItems: totalAttendants,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, totalAttendants),
    onPageChange: setCurrentPage,
    itemsPerPage: itemsPerPage
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <Breadcrumb
          items={[{ title: 'Manajemen Pelayan', href: '/admin/pelayan' }]}
          darkMode={darkMode}
        />

        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Manajemen Pelayan
        </h1>

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <DataTable
            data={attendants}
            columns={columns}
            loading={loading}
            selectedRows={selectedRows}
            onSelectAll={handleSelectAll}
            onSelectRow={handleSelectRow}
            onAdd={isAdmin ? () => openModalForCreate({ role: 'ATTENDANT', storeId: currentStoreId }) : undefined}
            onSearch={setSearchTerm}
            onItemsPerPageChange={setItemsPerPage}
            darkMode={darkMode}
            actions={isAdmin}
            showToolbar={true}
            showAdd={isAdmin}
            showExport={false}
            showItemsPerPage={true}
            pagination={paginationData}
            mobileColumns={['employeeNumber', 'name', 'status']}
            rowActions={renderRowActions}
            onDeleteMultiple={() => handleDelete(selectedRows)}
            selectedRowsCount={selectedRows.length}
          />
        </div>

        {successMessage && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center p-4 rounded-lg bg-green-500/10 text-green-400 shadow-lg">
            <CheckCircle className="h-5 w-5 mr-3" />
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
        )}
        {(tableError || formError) && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center p-4 rounded-lg bg-red-500/10 text-red-400 shadow-lg">
            <AlertTriangle className="h-5 w-5 mr-3" />
            <p className="text-sm font-medium">{tableError || formError}</p>
          </div>
        )}

        {isAdmin && (
          <>
            <UserModal
              showModal={showModal}
              closeModal={closeModal}
              handleSave={handleSave}
              formData={formData}
              handleInputChange={handleInputChange}
              editingUser={editingAttendant}
              error={formError}
              setFormError={setFormError}
              darkMode={darkMode}
              isAttendantForm={true}
              currentStoreName={currentStoreName}
            />
            <ConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => setShowDeleteModal(false)}
              onConfirm={handleConfirmDelete}
              title={`Konfirmasi Nonaktifkan ${itemsToDelete.length} Pelayan`}
              message={`Apakah Anda yakin ingin menonaktifkan pelayan yang dipilih dari toko ini? Pelayan tidak akan dapat login ke toko ini sampai diaktifkan kembali. Tindakan ini tidak dapat dibatalkan.`}
              isLoading={isDeleting}
            />
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
