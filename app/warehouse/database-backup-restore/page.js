'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useUserTheme } from '../../../../components/UserThemeContext';
import { ROLES } from '@/lib/constants';
import { Download, Upload, File, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function DatabaseBackupRestorePage() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const [backupStatus, setBackupStatus] = useState('');
  const [restoreStatus, setRestoreStatus] = useState('');
  const [backupList, setBackupList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Check if user has sufficient privileges (ADMIN only)
  const hasPrivileges = session?.user?.role === ROLES.ADMIN;

  // Fetch backup list on component mount
  const fetchBackupList = async () => {
    if (!hasPrivileges) return;
    
    try {
      const response = await fetch('/api/admin/restore');
      const data = await response.json();
      
      if (response.ok) {
        setBackupList(data.backups || []);
      } else {
        console.error('Failed to fetch backup list:', data.error);
      }
    } catch (error) {
      console.error('Error fetching backup list:', error);
    }
  };

  // Create backup
  const handleCreateBackup = async () => {
    if (!hasPrivileges) {
      setBackupStatus({
        type: 'error',
        message: 'Anda tidak memiliki izin untuk membuat backup'
      });
      return;
    }

    setLoading(true);
    setBackupStatus('');
    
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setBackupStatus({
          type: 'success',
          message: `Backup berhasil dibuat: ${data.filename} (${(data.size / 1024 / 1024).toFixed(2)} MB)`
        });
        fetchBackupList(); // Refresh the backup list
      } else {
        setBackupStatus({
          type: 'error',
          message: `Gagal membuat backup: ${data.error}`
        });
      }
    } catch (error) {
      setBackupStatus({
        type: 'error',
        message: `Terjadi kesalahan: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload for restore
  const handleFileUpload = async (event) => {
    event.preventDefault();
    
    if (!hasPrivileges) {
      setRestoreStatus({
        type: 'error',
        message: 'Anda tidak memiliki izin untuk merestore database'
      });
      return;
    }

    if (!fileInputRef.current || !fileInputRef.current.files[0]) {
      setRestoreStatus({
        type: 'error',
        message: 'Silakan pilih file backup terlebih dahulu'
      });
      return;
    }

    const file = fileInputRef.current.files[0];
    const formData = new FormData();
    formData.append('backupFile', file);

    setRestoreLoading(true);
    setRestoreStatus('');

    try {
      const response = await fetch('/api/admin/restore', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setRestoreStatus({
          type: 'success',
          message: 'Database berhasil direstore'
        });
        fetchBackupList(); // Refresh the backup list
      } else {
        setRestoreStatus({
          type: 'error',
          message: `Gagal merestore database: ${data.error}`
        });
      }
    } catch (error) {
      setRestoreStatus({
        type: 'error',
        message: `Terjadi kesalahan: ${error.message}`
      });
    } finally {
      setRestoreLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Download backup file
  const handleDownloadBackup = async (filename) => {
    if (!hasPrivileges) {
      setBackupStatus({
        type: 'error',
        message: 'Anda tidak memiliki izin untuk mengunduh backup'
      });
      return;
    }

    try {
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = `/api/admin/backup/download?filename=${encodeURIComponent(filename)}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      setBackupStatus({
        type: 'error',
        message: `Gagal mengunduh file: ${error.message}`
      });
    }
  };

  // Delete backup file
  const handleDeleteBackup = async (filename) => {
    if (!hasPrivileges) {
      setBackupStatus({
        type: 'error',
        message: 'Anda tidak memiliki izin untuk menghapus backup'
      });
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus backup ${filename}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/backup/delete?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setBackupStatus({
          type: 'success',
          message: `Backup ${filename} berhasil dihapus`
        });
        fetchBackupList(); // Refresh the backup list
      } else {
        setBackupStatus({
          type: 'error',
          message: `Gagal menghapus backup: ${data.error}`
        });
      }
    } catch (error) {
      setBackupStatus({
        type: 'error',
        message: `Terjadi kesalahan: ${error.message}`
      });
    }
  };

  // Fetch backup list when component mounts
  useState(() => {
    fetchBackupList();
  });

  return (
    <ProtectedRoute requiredRole={ROLES.WAREHOUSE}>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-4 sm:p-6 lg:p-8`}>
        <div className="max-w-6xl mx-auto">
          <div className={`p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Backup & Restore Database - Gudang
            </h1>
            
            {!hasPrivileges && (
              <div className="mb-6 p-4 rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                <p className="font-medium">Perhatian:</p>
                <p>Fitur backup dan restore hanya tersedia untuk pengguna dengan role MANAGER atau ADMIN.</p>
              </div>
            )}
            
            <p className={`mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Kelola backup dan restore database untuk menjaga keamanan data sistem Anda.
            </p>

            {/* Backup Section */}
            <div className={`mb-12 p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Backup Database
              </h2>
              
              <div className="mb-6">
                <button
                  onClick={handleCreateBackup}
                  disabled={loading || !hasPrivileges}
                  className={`flex items-center px-6 py-3 rounded-lg font-medium ${
                    loading || !hasPrivileges
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : darkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Membuat Backup...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5 mr-2" />
                      Buat Backup Baru
                    </>
                  )}
                </button>
              </div>

              {backupStatus && (
                <div className={`p-4 rounded-lg mb-4 flex items-start ${
                  backupStatus.type === 'success' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {backupStatus.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  )}
                  <span>{backupStatus.message}</span>
                </div>
              )}
            </div>

            {/* Restore Section */}
            <div className={`mb-12 p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Restore Database
              </h2>
              
              <form onSubmit={handleFileUpload} className="mb-6">
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Pilih File Backup
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".sql,.json,.dump"
                    disabled={!hasPrivileges}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      !hasPrivileges 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : darkMode 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Format yang didukung: .sql, .json, .dump
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={restoreLoading || !hasPrivileges}
                  className={`flex items-center px-6 py-3 rounded-lg font-medium ${
                    restoreLoading || !hasPrivileges
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : darkMode 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {restoreLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Merestore...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Restore Database
                    </>
                  )}
                </button>
              </form>

              {restoreStatus && (
                <div className={`p-4 rounded-lg mb-4 flex items-start ${
                  restoreStatus.type === 'success' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {restoreStatus.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  )}
                  <span>{restoreStatus.message}</span>
                </div>
              )}
            </div>

            {/* Backup List */}
            <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Daftar Backup Tersedia
              </h2>
              
              {backupList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className={`min-w-full ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <thead>
                      <tr className={`${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        <th className="py-3 px-4 text-left">Nama File</th>
                        <th className="py-3 px-4 text-left">Ukuran</th>
                        <th className="py-3 px-4 text-left">Tanggal Dibuat</th>
                        <th className="py-3 px-4 text-left">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backupList.map((backup, index) => (
                        <tr 
                          key={index} 
                          className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <File className="h-4 w-4 mr-2" />
                              {backup.filename}
                            </div>
                          </td>
                          <td className="py-3 px-4">{(backup.size / 1024 / 1024).toFixed(2)} MB</td>
                          <td className="py-3 px-4">
                            {new Date(backup.createdAt).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleDownloadBackup(backup.filename)}
                                disabled={!hasPrivileges}
                                className={`px-3 py-1 rounded ${
                                  !hasPrivileges
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : darkMode 
                                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                              >
                                Unduh
                              </button>
                              <button
                                onClick={() => handleDeleteBackup(backup.filename)}
                                disabled={!hasPrivileges}
                                className={`px-3 py-1 rounded ${
                                  !hasPrivileges
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : darkMode 
                                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                                      : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Belum ada file backup tersedia.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}