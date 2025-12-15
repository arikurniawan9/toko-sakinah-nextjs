'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserTheme } from '@/components/UserThemeContext';
import { useSession } from 'next-auth/react';
import { useUserForm } from '@/lib/hooks/useUserForm';
import { useUserTable } from '@/lib/hooks/useUserTable';
import UserModal from '@/components/admin/UserModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { AlertTriangle, CheckCircle, Edit, Trash2 } from 'lucide-react';
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
  } = useUserForm(fetchUsers, '', '/api/manager/users');

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
      const allRowIds = users.map(u => u.id);
      setSelectedRows(allRowIds);
    } else {
      setSelectedRows([]);
    }
  };

  const handleSave = async () => {
    await originalHandleSave();
    setSuccessMessage(editingUser ? 'User berhasil diperbarui.' : 'User berhasil dibuat.');
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

  const renderRowActions = (row) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => openModalForEdit(row)}
        className="p-1 text-blue-500 hover:text-blue-700"
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
    </div>
  );

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
          data={users}
          columns={columns}
          loading={loading}
          onAdd={canManageUsers ? openModalForCreate : undefined}
          onSearch={setSearchTerm}
          darkMode={darkMode}
          showAdd={canManageUsers}
          pagination={paginationData}
          mobileColumns={['name', 'role', 'stores', 'status']}
          rowActions={renderRowActions}
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
          />
          <ConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            title={`Konfirmasi Hapus ${itemsToDelete.length} User`}
            message="Apakah Anda yakin ingin menghapus user yang dipilih? Tindakan ini akan menghapus pengguna secara permanen dan tidak dapat dibatalkan."
            isLoading={isDeleting}
          />
        </>
      )}
    </main>
  );
}
