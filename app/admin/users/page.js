'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserTheme } from '@/components/UserThemeContext';
import { useSession } from 'next-auth/react';
import { useUserForm } from '@/lib/hooks/useUserForm';
import { useUserTable } from '@/lib/hooks/useUserTable';
import UserModal from '@/components/admin/UserModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { AlertTriangle, CheckCircle, Plus, Edit, Trash2, Eye } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Breadcrumb from '@/components/Breadcrumb';

export default function UserManagement() {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const {
    users,
    loading,
    error: tableError,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalUsers,
    fetchUsers,
    setError: setTableError,
  } = useUserTable();

  const {
    showModal,
    editingUser,
    formData,
    setFormData,
    error: formError,
    setError: setFormError,
    handleInputChange,
    openModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave: originalHandleSave,
  } = useUserForm(fetchUsers);

  const [, setSuccess] = useState(''); // dummy state untuk memenuhi useEffect
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

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

  const handleSave = async () => {
    await originalHandleSave();
    // Success/error sudah ditangani di dalam originalHandleSave
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
      const response = await fetch(`/api/store-users`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: itemsToDelete }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menghapus user');

      setSuccess(`Berhasil menonaktifkan ${result.deletedCount} user dari toko.`);
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
    if (tableError) {
      const timer = setTimeout(() => setTableError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [tableError]);

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
      key: 'employeeNumber',
      title: 'Kode Karyawan',
      sortable: true
    },
    {
      key: 'code',
      title: 'Kode Pengguna',
      sortable: true
    },
    {
      key: 'name',
      title: 'Nama Lengkap',
      sortable: true
    },
    {
      key: 'username',
      title: 'Username',
      sortable: true
    },
    {
      key: 'role',
      title: 'Role',
      sortable: true,
      render: (value) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          ['ADMIN', 'MANAGER'].includes(value)
            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            : value === 'CASHIER'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            : value === 'ATTENDANT'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
        }`}>
          {value}
        </span>
      )
    },
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
      key: 'createdAt',
      title: 'Tanggal Dibuat',
      render: (value) => new Date(value).toLocaleDateString('id-ID'),
      sortable: true
    },
  ];

  const renderRowActions = (row) => {
    const isCurrentUser = row.id === session?.user?.id;
    const isInactive = row.status === 'TIDAK_AKTIF' || row.status === 'INACTIVE';
    const isAttendant = row.role === 'ATTENDANT';
    const disabledClass = isCurrentUser ? 'opacity-50 cursor-not-allowed' : '';
    const buttonTitle = isCurrentUser ? "Anda tidak dapat mengubah data sendiri" : "";

    // Jika user adalah pelayan, tambahkan tombol detail
    const renderDetailButton = () => (
      <Link href={`/admin/pelayan/${row.id}`} passHref>
        <button
          className={`p-1 text-gray-500 hover:text-gray-700 ${disabledClass}`}
          title={isCurrentUser ? buttonTitle : "Lihat Detail"}
          disabled={isCurrentUser}
        >
          <Eye size={18} />
        </button>
      </Link>
    );

    // Jika status user adalah TIDAK_AKTIF atau INACTIVE, tampilkan tombol Aktifkan
    if (isInactive) {
      return (
        <>
          {isAttendant && renderDetailButton()}
          <button
            onClick={async () => {
              if (isCurrentUser) {
                setTableError('Anda tidak dapat mengaktifkan akun sendiri');
                return;
              }

              try {
                const response = await fetch(`/api/store-users/${row.id}/activate`, {
                  method: 'PATCH'
                });

                if (response.ok) {
                  const result = await response.json();
                  fetchUsers(); // Refresh data
                } else {
                  const error = await response.json();
                  setTableError(error.error || 'Gagal mengaktifkan user');
                }
              } catch (error) {
                setTableError('Terjadi kesalahan saat mengaktifkan user');
              }
            }}
            className={`p-1 text-green-500 hover:text-green-700 ${disabledClass}`}
            title={isCurrentUser ? buttonTitle : "Aktifkan User"}
            disabled={isCurrentUser}
          >
            <CheckCircle size={18} />
          </button>
        </>
      );
    }

    // Jika user aktif, tampilkan tombol edit dan hapus
    return (
      <>
        {isAttendant && renderDetailButton()}
        <button
          onClick={() => !isCurrentUser && openModalForEdit(row)}
          className={`p-1 text-blue-500 hover:text-blue-700 mr-2 ${disabledClass}`}
          title={isCurrentUser ? buttonTitle : "Edit"}
          disabled={isCurrentUser}
        >
          <Edit size={18} />
        </button>
        <button
          onClick={() => !isCurrentUser && handleDelete([row.id])}
          className={`p-1 text-red-500 hover:text-red-700 ${disabledClass}`}
          title={isCurrentUser ? buttonTitle : "Hapus"}
          disabled={isCurrentUser}
        >
          <Trash2 size={18} />
        </button>
      </>
    );
  };

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
    <ProtectedRoute requiredRole="ADMIN">
      <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <Breadcrumb
          items={[{ title: 'Manajemen User', href: '/admin/users' }]}
          darkMode={darkMode}
        />

        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Manajemen User
        </h1>

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <DataTable
            data={users}
            columns={columns}
            loading={loading}
            selectedRows={selectedRows}
            onSelectAll={handleSelectAll}
            onSelectRow={handleSelectRow}
            onAdd={isAdmin ? openModalForCreate : undefined}
            onSearch={setSearchTerm}
            onItemsPerPageChange={setItemsPerPage}
            darkMode={darkMode}
            actions={isAdmin}
            showToolbar={true}
            showAdd={isAdmin}
            showExport={false}
            showItemsPerPage={true}
            pagination={paginationData}
            mobileColumns={['employeeNumber', 'code', 'name', 'role', 'status']}
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

        {isAdmin && (
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
            />
            <ConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => setShowDeleteModal(false)}
              onConfirm={handleConfirmDelete}
              title={`Konfirmasi Nonaktifkan ${itemsToDelete.length} User`}
              message={`Apakah Anda yakin ingin menonaktifkan user yang dipilih dari toko ini? Tindakan ini tidak dapat dibatalkan.`}
              isLoading={isDeleting}
            />
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}