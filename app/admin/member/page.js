// app/admin/member/page.js
'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useDarkMode } from '../../../components/DarkModeContext';

import { useMemberTable } from '../../../lib/hooks/useMemberTable';
import { useMemberForm } from '../../../lib/hooks/useMemberForm';
import { useTableSelection } from '../../../lib/hooks/useTableSelection';

import MemberModal from '../../../components/member/MemberModal';
import ConfirmationModal from '../../../components/ConfirmationModal';
import DataTable from '../../../components/DataTable';
import Breadcrumb from '../../../components/Breadcrumb';

export default function MemberManagement() {
  const { darkMode } = useDarkMode();

  const {
    members,
    loading,
    error: tableError,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalMembers,
    fetchMembers,
    setError: setTableError,
  } = useMemberTable();

  const {
    showModal,
    editingMember,
    formData,
    error: formError,
    success: formSuccess,
    handleInputChange,
    openModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave,
    setError: setFormError,
    setSuccess: setFormSuccess,
  } = useMemberForm(fetchMembers);

  const { selectedRows, handleSelectAll, handleSelectRow, clearSelection, setSelectedRows } = useTableSelection(members);

  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // Can be a single ID (string) or multiple IDs (array)
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (id) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteMultiple = () => {
    if (selectedRows.length === 0) return;
    setItemToDelete(selectedRows);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    const isMultiple = Array.isArray(itemToDelete);
    let url = '/api/member';
    let options = {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    };

    if (isMultiple) {
      options.body = JSON.stringify({ ids: itemToDelete });
    } else {
      url += `?id=${itemToDelete}`;
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menghapus member');
      }

      fetchMembers();
      if (isMultiple) {
        clearSelection();
        setFormSuccess(`Berhasil menghapus ${itemToDelete.length} member`);
      } else {
        setSelectedRows(prev => prev.filter(rowId => rowId !== itemToDelete));
        setFormSuccess('Member berhasil dihapus');
      }

      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err) {
      setTableError('Terjadi kesalahan saat menghapus: ' + err.message);
      setTimeout(() => setTableError(''), 5000);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/member');
      if (!response.ok) throw new Error('Gagal mengambil data untuk export');
      const data = await response.json();

      let csvContent = 'Nama,Telepon,Alamat,Tipe Keanggotaan,Diskon,Tanggal Dibuat,Tanggal Diubah\n';
      data.members.forEach(member => {
        const name = `"${member.name.split('"').join('""')}"`;
        const phone = `"${member.phone ? member.phone.split('"').join('""') : ''}"`;
        const address = `"${member.address ? member.address.split('"').join('""') : ''}"`;
        const membershipType = `"${member.membershipType}"`;
        const discount = `"${member.discount}"`;
        const createdAt = `"${new Date(member.createdAt).toLocaleString()}"`;
        const updatedAt = `"${new Date(member.updatedAt).toLocaleString()}"`;
        csvContent += `${name},${phone},${address},${membershipType},${discount},${createdAt},${updatedAt}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'member.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        document.body.removeChild(link);
      }
      setFormSuccess('Data member berhasil diekspor');
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err) {
      setTableError('Terjadi kesalahan saat mengekspor member: ' + err.message);
      setTimeout(() => setTableError(''), 5000);
    } finally {
      setExportLoading(false);
    }
  };

  // Reset to first page when itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Define columns for DataTable
  const columns = [
    {
      key: 'name',
      title: 'Nama',
      sortable: true
    },
    {
      key: 'phone',
      title: 'Telepon',
      render: (value) => value || '-',
      sortable: true
    },
    {
      key: 'address',
      title: 'Alamat',
      render: (value) => value || '-',
      sortable: true
    },
    {
      key: 'membershipType',
      title: 'Tipe Keanggotaan',
      sortable: true
    },
    {
      key: 'discount',
      title: 'Diskon (%)',
      render: (value) => `${value}%`,
      sortable: true
    },
    {
      key: 'createdAt',
      title: 'Tanggal Dibuat',
      render: (value) => new Date(value).toLocaleDateString('id-ID'),
      sortable: true
    }
  ];

  // Enhanced data with action handlers
  const enhancedMembers = members.map(member => ({
    ...member,
    onViewDetails: (m) => {
      // Redirect ke halaman detail member
      window.location.href = `/admin/member/${m.id}`;
    },
    onEdit: () => openModalForEdit(member),
    onDelete: () => handleDelete(member.id)
  }));

  // Pagination data for DataTable
  const paginationData = {
    currentPage,
    totalPages,
    totalItems: totalMembers,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, totalMembers),
    onPageChange: setCurrentPage,
    itemsPerPage: itemsPerPage
  };

  const error = tableError || formError;

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb
          items={[{ title: 'Member', href: '/admin/member' }]}
          darkMode={darkMode}
        />

        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Manajemen Member
        </h1>

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <DataTable
            data={enhancedMembers}
            columns={columns}
            loading={loading}
            selectedRows={selectedRows}
            onSelectAll={handleSelectAll}
            onSelectRow={handleSelectRow}
            onAdd={openModalForCreate}
            onSearch={setSearchTerm}
            onExport={handleExport}
            onItemsPerPageChange={setItemsPerPage}
            onDeleteMultiple={handleDeleteMultiple}
            selectedRowsCount={selectedRows.length}
            darkMode={darkMode}
            actions={true}
            showToolbar={true}
            showAdd={true}
            showExport={true}
            showItemsPerPage={true}
            pagination={paginationData}
            mobileColumns={['name', 'phone', 'membershipType', 'discount']} // Show key information on mobile
          />
        </div>

        <MemberModal
          showModal={showModal}
          closeModal={closeModal}
          handleSave={handleSave}
          formData={formData}
          handleInputChange={handleInputChange}
          editingMember={editingMember}
          error={formError}
          setFormError={setFormError}
          darkMode={darkMode}
        />

        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          title="Konfirmasi Hapus"
          message={`Apakah Anda yakin ingin menghapus ${
            Array.isArray(itemToDelete) ? itemToDelete.length + ' member' : 'member ini'
          }?`}
          darkMode={darkMode}
          isLoading={isDeleting}
        />
      </main>
    </ProtectedRoute>
  );
}
