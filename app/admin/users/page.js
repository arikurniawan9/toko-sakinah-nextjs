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
import { AlertTriangle, CheckCircle, Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Breadcrumb from '@/components/Breadcrumb';
import Tooltip from '@/components/Tooltip';
import { ROLES } from '@/lib/constants'; // Import ROLES

export default function UserManagement() {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

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

  // Tidak perlu filter sisi klien karena sudah difilter di sisi server
  const filteredUsers = users;

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, searchTerm]);

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
    totalItems: filteredUsers.length, // Gunakan jumlah user yang sudah difilter
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, filteredUsers.length), // Gunakan jumlah user yang sudah difilter
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
          {/* Toolbar with Add Button */}
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative flex-grow">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari nama, username, kode..."
                    className={`w-full pl-10 pr-4 py-2 border rounded-md shadow-sm ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-theme-purple-500`}
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <label htmlFor="itemsPerPage" className="sr-only">Items per page</label>
                  <select
                    id="itemsPerPage"
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-theme-purple-500`}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center justify-start md:justify-end flex-wrap gap-2">
                  {selectedRows.length > 0 && (
                    <Tooltip content={`Hapus ${selectedRows.length} user terpilih`}>
                      <button
                        onClick={() => handleDelete(selectedRows)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="ml-2 hidden sm:inline">{selectedRows.length}</span>
                      </button>
                    </Tooltip>
                  )}
                  <Tooltip content="Tambah User">
                    <button
                      onClick={openModalForCreate}
                      className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>

          <DataTable
            data={filteredUsers} // Gunakan user yang sudah difilter
            columns={columns}
            loading={loading}
            selectedRows={selectedRows}
            onSelectAll={handleSelectAll}
            onSelectRow={handleSelectRow}
            onAdd={isAdmin ? openModalForCreate : undefined}
            onSearch={setSearchTerm} // Keep search function for the search input outside DataTable
            onItemsPerPageChange={setItemsPerPage}
            darkMode={darkMode}
            actions={isAdmin}
            showToolbar={false} // Disable default toolbar because we have custom filter toolbar
            showAdd={false} // Disable add button in DataTable since we show it in our custom toolbar
            showExport={false}
            showItemsPerPage={false} // Disable items per page in DataTable since we handle it in our custom toolbar
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
              allowedRoles={[ROLES.ADMIN, ROLES.CASHIER]} // Only allow Admin and Cashier roles
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