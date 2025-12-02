'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserTheme } from '@/components/UserThemeContext';
import DataTable from '@/components/DataTable';
import Breadcrumb from '@/components/Breadcrumb';
import { User, Calendar, Hash, Receipt, DollarSign } from 'lucide-react';

export default function PelayanDetail() {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const params = useParams();
  const { id: attendantId } = params;
  const [attendant, setAttendant] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalSalesValue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalPages, setTotalPages] = useState(1);


  useEffect(() => {
    if (attendantId) {
      const fetchAttendantDetails = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/pelayan/${attendantId}?page=${currentPage}&limit=${itemsPerPage}`);
          if (!response.ok) {
            throw new Error('Gagal mengambil data pelayan');
          }
          const data = await response.json();
          setAttendant(data.attendant);
          setTransactions(data.transactions);
          setTotalTransactions(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
          setSummary(data.summary);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchAttendantDetails();
    }
  }, [attendantId, currentPage, itemsPerPage]);
  
    useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const columns = [
    { key: 'no', title: 'No.', render: (_, __, index) => (currentPage - 1) * itemsPerPage + index + 1 },
    { key: 'invoice', title: 'Invoice', sortable: true },
    { key: 'total', title: 'Total', render: (value) => `Rp ${value.toLocaleString('id-ID')}`, sortable: true },
    { key: 'paymentMethod', title: 'Metode Pembayaran', sortable: true },
    { key: 'status', title: 'Status', sortable: true },
    { key: 'createdAt', title: 'Tanggal', render: (value) => new Date(value).toLocaleString('id-ID'), sortable: true },
  ];

  const paginationData = {
    currentPage,
    totalPages,
    totalItems: totalTransactions,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, totalTransactions),
    onPageChange: setCurrentPage,
    itemsPerPage: itemsPerPage
  };

  if (loading && !attendant) { // Show full page loading only on initial load
    return <div className="p-8 text-center">Memuat data...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500 text-center">{error}</div>;
  }

  if (!attendant) {
    return <div className="p-8 text-center">Pelayan tidak ditemukan.</div>;
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <Breadcrumb
          items={[
            { title: 'Manajemen Pelayan', href: '/admin/pelayan' },
            { title: 'Detail Pelayan', href: `/admin/pelayan/${attendantId}` },
          ]}
          darkMode={darkMode}
        />

        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Detail Pelayan
        </h1>

        {/* Attendant Info Card */}
        <div className={`p-6 rounded-xl shadow-lg mb-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border'}`}>
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <User className={`h-8 w-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{attendant.name}</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{attendant.username}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <Hash className={`h-4 w-4 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Kode Karyawan: {attendant.employeeNumber || '-'}</span>
            </div>
            <div className="flex items-center">
              <div className="mr-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  attendant.status === 'AKTIF' || attendant.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  Status: {attendant.status}
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className={`h-4 w-4 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Bergabung pada: {new Date(attendant.createdAt).toLocaleDateString('id-ID')}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-4">
            {attendant.status === 'AKTIF' || attendant.status === 'ACTIVE' ? (
              <button
                onClick={async () => {
                  if (window.confirm('Apakah Anda yakin ingin menonaktifkan pelayan ini?')) {
                    try {
                      const response = await fetch(`/api/store-users`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ids: [attendant.id] }),
                      });

                      if (response.ok) {
                        // Refresh the page to update status
                        window.location.reload();
                      } else {
                        const error = await response.json();
                        alert(`Gagal menonaktifkan pelayan: ${error.error}`);
                      }
                    } catch (err) {
                      alert(`Terjadi kesalahan: ${err.message}`);
                    }
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Nonaktifkan Pelayan
              </button>
            ) : (
              <button
                onClick={async () => {
                  if (window.confirm('Apakah Anda yakin ingin mengaktifkan kembali pelayan ini?')) {
                    try {
                      const response = await fetch(`/api/store-users/${attendant.id}/activate`, {
                        method: 'PATCH',
                      });

                      if (response.ok) {
                        // Refresh the page to update status
                        window.location.reload();
                      } else {
                        const error = await response.json();
                        alert(`Gagal mengaktifkan pelayan: ${error.error}`);
                      }
                    } catch (err) {
                      alert(`Terjadi kesalahan: ${err.message}`);
                    }
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Aktifkan Pelayan
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className={`p-6 rounded-xl shadow-lg flex items-center space-x-4 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border'}`}>
                <div className="p-3 rounded-full bg-blue-500/20">
                    <Receipt className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                    <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Transaksi</h3>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{totalTransactions.toLocaleString('id-ID')}</p>
                </div>
            </div>
            <div className={`p-6 rounded-xl shadow-lg flex items-center space-x-4 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border'}`}>
                <div className="p-3 rounded-full bg-green-500/20">
                    <DollarSign className="h-8 w-8 text-green-500" />
                </div>
                <div>
                    <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Penjualan</h3>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Rp {summary.totalSalesValue.toLocaleString('id-ID')}</p>
                </div>
            </div>
        </div>


        <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Riwayat Transaksi
        </h2>

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <DataTable
            data={transactions}
            columns={columns}
            loading={loading}
            onSearch={() => {}} // Search on this page is not implemented
            onItemsPerPageChange={setItemsPerPage}
            darkMode={darkMode}
            pagination={paginationData}
            mobileColumns={['invoice', 'total', 'createdAt']}
          />
        </div>
      </main>
    </ProtectedRoute>
  );
}
