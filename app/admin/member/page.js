// app/admin/member/page.js
'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useDarkMode } from '../../../components/DarkModeContext';

import { useMemberTable } from '../../../lib/hooks/useMemberTable';
import { useMemberForm } from '../../../lib/hooks/useMemberForm';
import { useTableSelection } from '../../../lib/hooks/useTableSelection';

import MemberTable from '../../../components/member/MemberTable';
import MemberModal from '../../../components/member/MemberModal';
import MemberToolbar from '../../../components/member/MemberToolbar';
import Pagination from '../../../components/produk/Pagination'; // Reusing existing Pagination
import ConfirmationModal from '../../../components/ConfirmationModal'; // Reusing existing ConfirmationModal

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

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls') && !file.name.toLowerCase().endsWith('.csv')) {
      setTableError('Silakan pilih file Excel (.xlsx, .xls) atau CSV (.csv)');
      setTimeout(() => setTableError(''), 5000);
      e.target.value = ''; // Reset file input
      return;
    }

    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setFormSuccess(`Memproses file ${file.name}...`);
      
      // Send file to server for processing
      const response = await fetch('/api/member/import', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengimport member');
      }
      
      // Refresh data
      fetchMembers();
      
      setFormSuccess(result.message || `Berhasil mengimport ${result.importedCount || 0} member`);
      e.target.value = ''; // Reset file input
      setTimeout(() => setFormSuccess(''), 5000);
    } catch (err) {
      setTableError('Terjadi kesalahan saat import: ' + err.message);
      e.target.value = ''; // Reset file input
      setTimeout(() => setTableError(''), 7000);
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Manajemen Member
        </h1>

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <div className="p-4 sm:p-6">
            <MemberToolbar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
              onAddNew={openModalForCreate}
              onDeleteMultiple={handleDeleteMultiple}
              selectedRowsCount={selectedRows.length}
              onExport={handleExport}
              onImport={handleImport}
              importLoading={importLoading}
              exportLoading={exportLoading}
              darkMode={darkMode}
            />

            {tableError && (
              <div className={`my-4 p-4 ${darkMode ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'} rounded-md`}>
                {tableError}
              </div>
            )}
            {formError && (
              <div className={`my-4 p-4 ${darkMode ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'} rounded-md`}>
                {formError}
              </div>
            )}
            {(formSuccess || (formSuccess === '' && !formError)) && ( // Display formSuccess if it exists or if it's empty and no formError
              <div className={`my-4 p-4 ${darkMode ? 'bg-green-900/30 border-green-700 text-green-200' : 'bg-green-50 border-green-200 text-green-700'} rounded-md`}>
                {formSuccess}
              </div>
            )}

            <MemberTable
              key={members.length}
              members={members}
              loading={loading}
              darkMode={darkMode}
              selectedRows={selectedRows}
              handleSelectAll={handleSelectAll}
              handleSelectRow={handleSelectRow}
              handleEdit={openModalForEdit}
              handleDelete={handleDelete}
            />
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalProducts={totalMembers} // Renamed from totalProducts to totalMembers
            darkMode={darkMode}
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
