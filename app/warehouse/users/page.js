'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserTheme } from '@/components/UserThemeContext';
import { useSession } from 'next-auth/react';
import { useUserForm } from '@/lib/hooks/useUserForm';
import { useWarehouseUserTable } from '@/lib/hooks/useWarehouseUserTable';
import UserModal from '@/components/admin/UserModal';
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // ESC key to close modals
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (showModal) closeModal();
        if (showDeleteModal) setShowDeleteModal(false);
        if (showDetailModal) setShowDetailModal(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showModal, showDeleteModal, showDetailModal, closeModal]);

  const handleViewDetail = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

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
      <button
        onClick={() => handleViewDetail(row)}
        className="p-1 text-green-500 hover:text-green-700 mr-2"
        title="Lihat Detail"
      >
        <Eye size={18} />
      </button>
      <button
        onClick={() => openModalForEdit(row)}
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

      {/* Detail Modal */}
      {showDetailModal && selectedUser && (
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
                      Detail User
                    </h3>
                    <div className="mt-4 w-full">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nama Lengkap</p>
                          <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.name}</p>
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Username</p>
                          <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.username}</p>
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Kode Karyawan</p>
                          <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.employeeNumber || '-'}</p>
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Kode Pengguna</p>
                          <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.code || '-'}</p>
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Role</p>
                          <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {selectedUser.role === 'CASHIER' ? 'Kasir' :
                             selectedUser.role === 'ATTENDANT' ? 'Pelayan' :
                             selectedUser.role}
                          </p>
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</p>
                          <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.status}</p>
                        </div>
                        <div className="col-span-2">
                          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Alamat</p>
                          <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.address || '-'}</p>
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No. Telepon</p>
                          <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.phone || '-'}</p>
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tanggal Dibuat</p>
                          <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{new Date(selectedUser.createdAt).toLocaleDateString('id-ID')}</p>
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
    </main>
  );
}
