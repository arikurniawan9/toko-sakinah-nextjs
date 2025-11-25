'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserTheme } from '@/components/UserThemeContext';
import { useSession } from 'next-auth/react';
import { usePelayanForm } from '@/lib/hooks/usePelayanForm';
import { usePelayanTable } from '@/lib/hooks/usePelayanTable';
import PelayanModal from '@/components/pelayan/PelayanModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { AlertTriangle, CheckCircle, Plus, Edit, Trash2, Eye } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Breadcrumb from '@/components/Breadcrumb';

export default function AttendantManagement() {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

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
    totalAttendants,
    fetchAttendants,
    setError: setTableError,
  } = usePelayanTable();

  const {
    showModal,
    editingAttendant,
    formData,
    setFormData,
    error: formError,
    setError: setFormError,
    handleInputChange,
    openModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave: originalHandleSave,
  } = usePelayanForm(fetchAttendants);

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
      const allRowIds = attendants.map(c => c.id);
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
      const response = await fetch(`/api/pelayan`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: itemsToDelete }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menghapus pelayan');

      setSuccess(`Berhasil menghapus ${result.deletedCount} pelayan.`);
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
      title: 'Kode Pelayan',
      sortable: true
    },
    {
      key: 'name',
      title: 'Nama',
      sortable: true
    },
    {
      key: 'username',
      title: 'Username',
      sortable: true
    },
    {
      key: 'phone',
      title: 'Telepon',
      render: (value) => value || '-',
      sortable: true
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          value === 'AKTIF'
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
    <>
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
          items={[{ title: 'Pelayan', href: '/admin/pelayan' }]}
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
            mobileColumns={['code', 'name', 'status']}
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
            <PelayanModal
              showModal={showModal}
              closeModal={closeModal}
              handleSave={handleSave}
              formData={formData}
              handleInputChange={handleInputChange}
              editingAttendant={editingAttendant}
              error={formError}
              setFormError={setFormError}
              darkMode={darkMode}
            />
            <ConfirmationModal
              isOpen={showDeleteModal}
              onClose={() => setShowDeleteModal(false)}
              onConfirm={handleConfirmDelete}
              title={`Konfirmasi Hapus ${itemsToDelete.length} Pelayan`}
              message={`Apakah Anda yakin ingin menghapus pelayan yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
              isLoading={isDeleting}
            />
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
