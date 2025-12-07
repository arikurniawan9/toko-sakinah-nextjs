'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserTheme } from '@/components/UserThemeContext';
import { useSession } from 'next-auth/react';
import { useUserForm } from '@/lib/hooks/useUserForm';
import { useUserTable } from '@/lib/hooks/useUserTable';
import UserModal from '@/components/admin/UserModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { AlertTriangle, CheckCircle, Edit, Trash2, RefreshCw } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Breadcrumb from '@/components/Breadcrumb';

export default function ManagerWarehouseUserManagement() {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const { data: session } = useSession();
  const canManageUsers = session?.user?.role === 'MANAGER';

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
  } = useUserTable('WAREHOUSE', '/api/manager/users'); // Filter for WAREHOUSE role, using the correct manager API

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
  } = useUserForm(fetchUsers, 'WAREHOUSE', '/api/manager/users'); // API endpoint for global users

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
  
  const handleReplaceUser = (user) => {
    console.log("Placeholder for replacing user:", user.name);
    // Here we would open a new modal to select/create a new user
    // and then call an API to handle the succession logic.
    alert(`Fitur "Ganti Pengguna" untuk ${user.name} belum diimplementasikan.`);
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
      key: 'createdAt',
      title: 'Tanggal Dibuat',
      render: (value) => new Date(value).toLocaleDateString('id-ID'),
      sortable: true
    },
  ];

  const renderRowActions = (row) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleReplaceUser(row)}
        className="p-1 text-green-500 hover:text-green-700"
        title="Ganti Pengguna"
      >
        <RefreshCw size={18} />
      </button>
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
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, totalUsers),
    onPageChange: setCurrentPage,
    itemsPerPage: itemsPerPage
  };

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
            { title: 'Manajemen Pengguna', href: '/manager/users' },
            { title: 'Akun Gudang', href: '/manager/warehouse-users' }
        ]}
        darkMode={darkMode}
      />

      <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Manajemen Akun Gudang
      </h1>
      
      <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
        <DataTable
          data={users}
          columns={columns}
          loading={loading}
          selectedRows={selectedRows}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onAdd={canManageUsers ? openModalForCreate : undefined}
          onSearch={setSearchTerm}
          onItemsPerPageChange={setItemsPerPage}
          darkMode={darkMode}
          actions={canManageUsers}
          showAdd={canManageUsers}
          pagination={paginationData}
          mobileColumns={['employeeNumber', 'name', 'status']}
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
            allowedRoles={['WAREHOUSE']} // Only allow creating WAREHOUSE users
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
    </main>
  );
}
