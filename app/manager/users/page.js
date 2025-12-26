'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserTheme } from '@/components/UserThemeContext';
import { useSession } from 'next-auth/react';
import { useUserForm } from '@/lib/hooks/useUserForm';
import { useUserTable } from '@/lib/hooks/useUserTable';
import UserModal from '@/components/admin/UserModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import TransferUserModal from '@/components/TransferUserModal';
import { AlertTriangle, CheckCircle, Edit, Trash2, MoveRight } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Breadcrumb from '@/components/Breadcrumb';

export default function ManagerAllUsersManagement() {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const { data: session } = useSession();
  const canManageUsers = session?.user?.role === 'MANAGER';

  // Fetch all users with their associated stores using the manager-specific API endpoint
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
    roleFilter,
    statusFilter,
    handleRoleFilter,
    handleStatusFilter,
    clearFilters,
    hasActiveFilters
  } = useUserTable('', '/api/manager/users-with-stores');

  // When creating/editing a user, it will use the original manager API endpoint
  const {
    showModal,
    editingUser,
    formData,
    handleInputChange,
    openModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave: originalHandleSave,
    error: formError,
    setError: setFormError,
  } = useUserForm(fetchUsers, { isManagerContext: true });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [stores, setStores] = useState([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [userToTransfer, setUserToTransfer] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores');
        if (!response.ok) {
          throw new Error('Gagal mengambil data toko');
        }
        const data = await response.json();
        setStores(data);
      } catch (error) {
        console.error(error);
      }
    };

    if (canManageUsers) {
      fetchStores();
    }
  }, [canManageUsers]);

  const handleSelectRow = (id) => {
    // Jangan izinkan memilih akun sendiri (jika itu adalah akun manager)
    if (session?.user?.id === id) return;

    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Pilih semua baris kecuali akun sendiri
      const allRowIds = users
        .filter(u => u.id !== session?.user?.id)
        .map(u => u.id);
      setSelectedRows(allRowIds);
    } else {
      // Hapus semua pilihan kecuali akun sendiri
      setSelectedRows([]);
    }
  };

  const handleSave = async () => {
    await originalHandleSave();
    setSuccessMessage(editingUser ? 'User berhasil diperbarui.' : 'User berhasil dibuat.');
  };

  const handleDelete = (ids) => {
    if (!canManageUsers) return;

    // Filter out the current user's ID from the deletion list
    const userIdsToDelete = ids.filter(id => id !== session?.user?.id);

    // If no IDs remain after filtering, don't show the modal
    if (userIdsToDelete.length === 0) {
      setTableError('Anda tidak dapat menghapus akun sendiri.');
      return;
    }

    setItemsToDelete(userIdsToDelete);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (itemsToDelete.length === 0 || !canManageUsers) return;
    setIsDeleting(true);
    setTableError('');

    try {
      const response = await fetch(`/api/manager/users`, {
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

  // Fungsi untuk memindahkan pengguna ke toko lain
  const handleTransferUser = async (transferData) => {
    setIsTransferring(true);
    setTableError('');

    try {
      const response = await fetch('/api/manager/transfer-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal memindahkan pengguna');
      }

      setSuccessMessage(result.message || 'Pengguna berhasil ditambahkan ke toko baru.');
      setShowTransferModal(false);
      setUserToTransfer(null);
      fetchUsers(); // Refresh data
    } catch (err) {
      setTableError(err.message);
    } finally {
      setIsTransferring(false);
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

  const columns = [
    {
      key: 'no',
      title: 'No.',
      render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1,
    },
    { key: 'employeeNumber', title: 'Kode Karyawan', sortable: true },
    { key: 'name', title: 'Nama', sortable: true },
    { key: 'username', title: 'Username', sortable: true },
    {
      key: 'role',
      title: 'Role Global',
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
      key: 'stores',
      title: 'Toko Terkait',
      render: (value, row) => (
        <div className="max-w-xs">
          {row.stores && row.stores.length > 0 ? (
            <div className="space-y-1">
              {row.stores.map((store, index) => (
                <div key={index} className="text-xs">
                  <span className="font-medium">{store.name}</span>
                  <span className="ml-2 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[0.6rem]">
                    {store.roleInStore}
                  </span>
                  <span className="ml-1 text-gray-500 dark:text-gray-400">
                    ({store.status})
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-400 italic">Tidak ada toko</span>
          )}
        </div>
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
  ];

  const openTransferModal = (user) => {
    setUserToTransfer(user);
    setShowTransferModal(true);
  };

  const renderRowActions = (row) => {
    const isCurrentUser = session?.user?.id === row.id;
    const canEdit = !isCurrentUser && canManageUsers;
    const canDelete = !isCurrentUser && canManageUsers && row.role !== 'MANAGER';

    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => canEdit ? openModalForEdit(row) : undefined}
          className={`${canEdit ? 'p-1 text-blue-500 hover:text-blue-700 cursor-pointer' : 'p-1 text-gray-400 cursor-not-allowed'}`}
          title={canEdit ? "Edit" : "Tidak dapat mengedit akun sendiri"}
          disabled={!canEdit}
        >
          <Edit size={18} />
        </button>
        {row.role !== 'MANAGER' && (
          <button
            onClick={() => openTransferModal(row)}
            className="p-1 text-green-500 hover:text-green-700"
            title="Pindahkan ke Toko Lain"
          >
            <MoveRight size={18} />
          </button>
        )}
        <button
          onClick={() => canDelete ? handleDelete([row.id]) : undefined}
          className={`${canDelete ? 'p-1 text-red-500 hover:text-red-700 cursor-pointer' : 'p-1 text-gray-400 cursor-not-allowed'}`}
          title={canDelete ? "Hapus" : "Tidak dapat menghapus akun sendiri"}
          disabled={!canDelete}
        >
          <Trash2 size={18} />
        </button>
      </div>
    );
  };

  const paginationData = {
    currentPage,
    totalPages,
    totalItems: totalUsers,
    onPageChange: setCurrentPage,
  };

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
            { title: 'Manajemen Pengguna', href: '/manager/users' },
        ]}
        darkMode={darkMode}
      />
      <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Manajemen Semua Pengguna
      </h1>
      
      <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
        <DataTable
          data={users.map(user => ({...user, isCurrentUser: session?.user?.id === user.id}))}
          columns={columns}
          loading={loading}
          onAdd={canManageUsers ? openModalForCreate : undefined}
          onSearch={setSearchTerm}
          darkMode={darkMode}
          showAdd={canManageUsers}
          pagination={paginationData}
          mobileColumns={['name', 'role', 'stores', 'status']}
          rowActions={renderRowActions}
          selectedRows={selectedRows}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          isAllSelected={users.length > 0 && users.filter(u => u.id !== session?.user?.id).every(u => selectedRows.includes(u.id))}
        />
      </div>

      {tableError && (
        <div className="fixed bottom-4 right-4 z-50 p-4 rounded-lg bg-red-500/10 text-red-400">
          <p>{tableError}</p>
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
            stores={stores}
          />
          <ConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            title={`Konfirmasi Hapus ${itemsToDelete.length} User`}
            message="Apakah Anda yakin ingin menghapus user yang dipilih? Tindakan ini akan menghapus pengguna secara permanen dan tidak dapat dibatalkan."
            isLoading={isDeleting}
          />
          <TransferUserModal
            isOpen={showTransferModal}
            onClose={() => {
              setShowTransferModal(false);
              setUserToTransfer(null);
            }}
            user={userToTransfer}
            stores={stores}
            onTransfer={handleTransferUser}
            loading={isTransferring}
          />
        </>
      )}
    </main>
  );
}
