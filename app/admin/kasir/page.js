// app/admin/kasir/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Sidebar from '../../../components/Sidebar';
import { useDarkMode } from '../../../components/DarkModeContext';
import { Edit, Trash2, Plus, Download, Upload, X, Save, Search, Folder } from 'lucide-react';
import Tooltip from '../../../components/Tooltip';

export default function CashierManagement() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCashiers, setTotalCashiers] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingCashier, setEditingCashier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch cashiers from API
  const fetchCashiers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/kasir?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data kasir');
      }
      
      const data = await response.json();
      setCashiers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCashiers(data.pagination?.total || 0);
    } catch (err) {
      setError('Terjadi kesalahan saat mengambil data: ' + err.message);
      console.error('Error fetching cashiers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cashiers when dependencies change
  useEffect(() => {
    fetchCashiers();
  }, [currentPage, itemsPerPage, searchTerm]);

  // Handler for checkboxes
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(cashiers.map(cashier => cashier.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  // Handler for delete
  const handleDelete = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus kasir ini?')) {
      try {
        const response = await fetch(`/api/kasir?id=${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Gagal menghapus kasir');
        }

        // Refresh data
        fetchCashiers();
        setSelectedRows(selectedRows.filter(rowId => rowId !== id));
        setSuccess('Kasir berhasil dihapus');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Terjadi kesalahan saat menghapus kasir: ' + err.message);
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedRows.length === 0) return;
    
    if (confirm(`Apakah Anda yakin ingin menghapus ${selectedRows.length} kasir?`)) {
      try {
        const response = await fetch('/api/kasir', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids: selectedRows })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Gagal menghapus kasir');
        }

        // Refresh data
        fetchCashiers();
        setSelectedRows([]);
        setSuccess(`Berhasil menghapus ${selectedRows.length} kasir`);
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Terjadi kesalahan saat menghapus kasir: ' + err.message);
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  // Handler for form
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear error when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleEdit = (cashier) => {
    setEditingCashier(cashier);
    setFormData({
      name: cashier.name,
      username: cashier.username,
      password: '' // Don't pre-fill password
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.username.trim()) {
      setError('Nama dan username harus diisi');
      return;
    }

    try {
      const method = editingCashier ? 'PUT' : 'POST';
      const endpoint = '/api/kasir';
      
      const payload = {
        id: editingCashier?.id,
        name: formData.name.trim(),
        username: formData.username.trim(),
        role: 'CASHIER'
      };

      // Only include password if it's being set (for new user or password change)
      if (formData.password) {
        payload.password = formData.password.trim();
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (editingCashier ? 'Gagal mengupdate kasir' : 'Gagal menambahkan kasir'));
      }

      const result = await response.json();
      
      // Close modal and refresh data
      setShowModal(false);
      setEditingCashier(null);
      setFormData({ name: '', username: '', password: '' });
      
      fetchCashiers(); // Refresh data
      setSuccess(editingCashier ? 'Kasir berhasil diperbarui' : 'Kasir berhasil ditambahkan');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Terjadi kesalahan: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  // Export to Excel
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await fetch('/api/kasir');
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data untuk export');
      }
      
      const data = await response.json();
      
      // Create CSV content
      let csvContent = 'Nama,Username,Role,Tanggal Dibuat,Tanggal Diubah\n';
      
      data.users.forEach(user => {
        const row = [
          `"${user.name.replace(/"/g, '""')}"`,
          `"${user.username.replace(/"/g, '""')}"`,
          `"${user.role}"`,
          `"${new Date(user.createdAt).toLocaleDateString('id-ID')}"`,
          `"${new Date(user.updatedAt).toLocaleDateString('id-ID')}"`
        ].join(',');
        
        csvContent += row + '\n';
      });
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `kasir-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess('Data kasir berhasil diekspor');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Terjadi kesalahan saat export: ' + err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setExportLoading(false);
    }
  };

  // Import from Excel
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls') && !file.name.toLowerCase().endsWith('.csv')) {
      setError('Silakan pilih file Excel (.xlsx, .xls) atau CSV (.csv)');
      setTimeout(() => setError(''), 5000);
      e.target.value = ''; // Reset file input
      return;
    }

    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setSuccess(`Memproses file ${file.name}...`);
      
      // Send file to server for processing
      const response = await fetch('/api/kasir/import', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengimport kasir');
      }
      
      // Refresh data
      fetchCashiers();
      
      setSuccess(result.message || `Berhasil mengimport ${result.importedCount || 0} kasir`);
      e.target.value = ''; // Reset file input
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Terjadi kesalahan saat import: ' + err.message);
      e.target.value = ''; // Reset file input
      setTimeout(() => setError(''), 7000);
    } finally {
      setImportLoading(false);
    }
  };

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading && cashiers.length === 0) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <Sidebar>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h1 className={`${darkMode ? 'text-white' : 'text-gray-900'} text-2xl font-bold`}>Manajemen Kasir</h1>
            </div>
            <div className="animate-pulse">
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} h-12 rounded mb-4`}></div>
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} h-96 rounded`}></div>
            </div>
          </div>
        </Sidebar>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <Sidebar>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h1 className={`${darkMode ? 'text-white' : 'text-gray-900'} text-2xl font-bold`}>Manajemen Kasir</h1>
            <div className="flex flex-wrap gap-2">
              <Tooltip content="Export data ke Excel">
                <button
                  onClick={handleExport}
                  disabled={exportLoading}
                  className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    exportLoading 
                      ? 'bg-pastel-purple-400 cursor-not-allowed' 
                      : 'bg-pastel-purple-500 hover:bg-pastel-purple-600'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-purple-500 min-w-[100px]`}
                >
                  {exportLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-1" />
                      <span>Export</span>
                    </>
                  )}
                </button>
              </Tooltip>
              <div className="flex flex-wrap gap-2">
                <Tooltip content="Import data dari Excel">
                  <label className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    importLoading 
                      ? 'bg-pastel-purple-400 cursor-not-allowed' 
                      : 'bg-pastel-purple-600 hover:bg-pastel-purple-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-purple-500 cursor-pointer min-w-[100px]`}>
                    {importLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-1" />
                        <span>Import</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept=".xlsx,.xls,.csv" 
                      onChange={handleImport} 
                      className="hidden" 
                      disabled={importLoading}
                    />
                  </label>
                </Tooltip>
                <Tooltip content="Template Kasir">
                  <a 
                    href="/templates/template-kasir.xlsx" 
                    download="template-kasir.xlsx"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Folder className="h-4 w-4 mr-1" />
                    <span>Template</span>
                  </a>
                </Tooltip>
              </div>
              <Tooltip content="Tambah kasir baru">
                <button
                  onClick={() => {
                    setEditingCashier(null);
                    setFormData({ name: '', username: '', password: '' });
                    setShowModal(true);
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 min-w-[100px]"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span>Tambah</span>
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className={`mb-4 p-4 ${darkMode ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'} rounded-md flex items-center`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          
          {success && (
            <div className={`mb-4 p-4 ${darkMode ? 'bg-green-900/30 border-green-700 text-green-200' : 'bg-green-50 border border-green-200 text-green-700'} rounded-md flex items-center`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}

          {/* Search and filter controls */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pastel-purple-200'} shadow rounded-lg p-4 sm:p-6 mb-6 border`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="search" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Cari Kasir
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari berdasarkan nama atau username..."
                    className={`w-full px-3 py-2 pl-10 pr-10 border ${
                      darkMode 
                        ? 'border-gray-600 bg-gray-700 text-white' 
                        : 'border-pastel-purple-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-pastel-purple-500 focus:border-pastel-purple-500 sm:text-sm`}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <X className={`h-5 w-5 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`} />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="itemsPerPage" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Tampil Per Halaman
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className={`w-full px-3 py-2 border ${
                    darkMode 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-pastel-purple-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-pastel-purple-500 focus:border-pastel-purple-500 sm:text-sm`}
                >
                  <option className={`${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`} value={10}>10 per halaman</option>
                  <option className={`${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`} value={20}>20 per halaman</option>
                  <option className={`${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`} value={50}>50 per halaman</option>
                  <option className={`${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`} value={100}>100 per halaman</option>
                </select>
              </div>
              <div className="flex items-end">
                <div className="flex flex-col items-center">
                  <Tooltip content={`Hapus ${selectedRows.length} kasir`}>
                    <button
                      onClick={handleDeleteMultiple}
                      disabled={selectedRows.length === 0}
                      className={`p-2 border border-transparent rounded-md shadow-sm min-w-[40px] ${
                        selectedRows.length === 0
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-red-600 hover:bg-red-700'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                    >
                      <Trash2 className={`h-4 w-4 mr-1 ${selectedRows.length === 0 ? 'text-gray-200' : 'text-white'}`} />
                      {selectedRows.length > 0 && (
                        <span className="text-xs font-medium text-white">
                          {selectedRows.length}
                        </span>
                      )}
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pastel-purple-200'} shadow overflow-x-auto sm:rounded-lg border`}>
            <table className="min-w-full divide-y divide-pastel-purple-200">
              <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <tr>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-12 ${
                    darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
                  }`}>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={cashiers.length > 0 && selectedRows.length === cashiers.length}
                      className={`h-4 w-4 rounded ${
                        darkMode 
                          ? 'text-pastel-purple-600 bg-gray-700 border-gray-600' 
                          : 'text-pastel-purple-600 focus:ring-pastel-purple-500 border-pastel-purple-300'
                      }`}
                    />
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
                  }`}>
                    Nama
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
                  }`}>
                    Username
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
                  }`}>
                    Role
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
                  }`}>
                    Tanggal Dibuat
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-pastel-purple-700'
                  }`}>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className={`${darkMode ? 'divide-gray-700 bg-gray-800' : 'bg-gray-50'} divide-y ${
                darkMode ? 'divide-gray-700' : 'divide-pastel-purple-200'
              }`}>
                {cashiers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={`px-6 py-4 text-center text-sm ${
                      darkMode ? 'text-gray-400' : 'text-pastel-purple-700'
                    }`}>
                      {loading ? 'Memuat data...' : 'Tidak ada data kasir ditemukan'}
                    </td>
                  </tr>
                ) : (
                  cashiers.map((cashier) => (
                    <tr key={cashier.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-pastel-purple-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(cashier.id)}
                          onChange={() => handleSelectRow(cashier.id)}
                          className={`h-4 w-4 rounded ${
                            darkMode 
                              ? 'text-pastel-purple-600 bg-gray-700 border-gray-600' 
                              : 'text-pastel-purple-600 focus:ring-pastel-purple-500 border-pastel-purple-300'
                          }`}
                        />
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {cashier.name}
                      </td>
                      <td className={`px-6 py-4 text-sm ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {cashier.username}
                      </td>
                      <td className={`px-6 py-4 text-sm ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          cashier.role === 'CASHIER' 
                            ? 'bg-green-100 text-green-800' 
                            : cashier.role === 'ADMIN' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {cashier.role}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {new Date(cashier.createdAt).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Tooltip content="Edit kasir">
                          <button
                            onClick={() => handleEdit(cashier)}
                            className={`mr-2 p-1 rounded ${
                              darkMode ? 'text-pastel-purple-400 hover:text-pastel-purple-300 hover:bg-gray-700' : 'text-pastel-purple-600 hover:text-pastel-purple-800 hover:bg-pastel-purple-100'
                            }`}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Hapus kasir">
                          <button
                            onClick={() => handleDelete(cashier.id)}
                            className={`p-1 rounded ${
                              darkMode ? 'text-red-500 hover:text-red-400 hover:bg-gray-700' : 'text-red-600 hover:text-red-800 hover:bg-red-100'
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </Tooltip>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={`px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pastel-purple-200'
          } border-t sm:px-6 mt-4 rounded-b-lg`}>
            <div className="sm:hidden w-full flex justify-between">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                  darkMode 
                    ? currentPage === 1 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-pastel-purple-700 hover:bg-pastel-purple-50'
                }`}
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                  darkMode 
                    ? currentPage === totalPages 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-pastel-purple-700 hover:bg-pastel-purple-50'
                }`}
              >
                Berikutnya
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-col md:flex md:flex-row md:items-center md:justify-between gap-4 w-full">
              <div>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-pastel-purple-700'
                }`}>
                  Menampilkan <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> ke{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalCashiers)}
                  </span>{' '}
                  dari <span className="font-medium">{totalCashiers}</span> hasil
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                      darkMode 
                        ? currentPage === 1
                          ? 'text-gray-600 bg-gray-700 cursor-not-allowed' 
                          : 'text-gray-300 bg-gray-800 hover:bg-gray-700'
                        : currentPage === 1
                          ? 'text-gray-400 bg-white cursor-not-allowed'
                          : 'text-pastel-purple-600 bg-white hover:bg-pastel-purple-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    &larr;
                  </button>
                  
                  {/* Page numbers with proper logic */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    // Skip if page number is out of range
                    if (pageNum < 1 || pageNum > totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? darkMode 
                              ? 'z-10 bg-pastel-purple-600 border-pastel-purple-600 text-white'
                              : 'z-10 bg-pastel-purple-500 border-pastel-purple-500 text-white'
                            : darkMode
                              ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                              : 'bg-white border-pastel-purple-300 text-pastel-purple-600 hover:bg-pastel-purple-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                      darkMode 
                        ? currentPage === totalPages
                          ? 'text-gray-600 bg-gray-700 cursor-not-allowed' 
                          : 'text-gray-300 bg-gray-800 hover:bg-gray-700'
                        : currentPage === totalPages
                          ? 'text-gray-400 bg-white cursor-not-allowed'
                          : 'text-pastel-purple-600 bg-white hover:bg-pastel-purple-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    &rarr;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Modal untuk tambah/edit kasir */}
        {showModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
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
                <div className={`bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${
                  darkMode ? 'bg-gray-800' : ''
                }`}>
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className={`text-lg leading-6 font-medium ${
                        darkMode ? 'text-pastel-purple-400' : 'text-pastel-purple-800'
                      }`} id="modal-title">
                        {editingCashier ? 'Edit Kasir' : 'Tambah Kasir Baru'}
                      </h3>
                      <div className="mt-4 w-full">
                        <div className="mb-4">
                          <label htmlFor="name" className={`block text-sm font-medium ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          } mb-1`}>
                            Nama Kasir *
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-pastel-purple-500 focus:border-pastel-purple-500 sm:text-sm ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'border-pastel-purple-300'
                            }`}
                            placeholder="Masukkan nama kasir"
                          />
                        </div>
                        <div className="mb-4">
                          <label htmlFor="username" className={`block text-sm font-medium ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          } mb-1`}>
                            Username *
                          </label>
                          <input
                            type="text"
                            name="username"
                            id="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-pastel-purple-500 focus:border-pastel-purple-500 sm:text-sm ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'border-pastel-purple-300'
                            }`}
                            placeholder="Masukkan username"
                          />
                        </div>
                        <div className={editingCashier ? "mb-4" : ""}>
                          <label htmlFor="password" className={`block text-sm font-medium ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          } mb-1`}>
                            {editingCashier ? 'Password Baru (kosongkan jika tidak ingin diubah)' : 'Password *'}
                          </label>
                          <input
                            type="password"
                            name="password"
                            id="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-pastel-purple-500 focus:border-pastel-purple-500 sm:text-sm ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'border-pastel-purple-300'
                            }`}
                            placeholder={editingCashier ? "Kosongkan jika tidak ingin diubah" : "Masukkan password"}
                          />
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
                    onClick={handleSave}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm flex items-center ${
                      darkMode 
                        ? 'bg-pastel-purple-600 hover:bg-pastel-purple-700' 
                        : 'bg-pastel-purple-600 hover:bg-pastel-purple-700'
                    }`}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {editingCashier ? 'Perbarui' : 'Simpan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={`mt-3 w-full inline-flex justify-center rounded-md border shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm flex items-center ${
                      darkMode 
                        ? 'bg-gray-600 text-white hover:bg-gray-500 border-gray-500' 
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                    }`}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Sidebar>
    </ProtectedRoute>
  );
}