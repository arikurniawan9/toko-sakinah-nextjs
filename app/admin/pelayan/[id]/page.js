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
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const handlePrintReport = async () => {
    try {
      // Show loading state
      setLoading(true);

      // Import jsPDF and autoTable
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      // Create a new PDF document
      const doc = new jsPDF('p', 'mm', 'a4');

      // Add title
      doc.setFontSize(18);
      doc.text('Laporan Transaksi Pelayan', 105, 20, null, null, 'center');

      // Add attendant information
      doc.setFontSize(12);
      doc.text(`Nama Pelayan: ${attendant?.name || '-'}`, 20, 30);
      doc.text(`Username: ${attendant?.username || '-'}`, 20, 36);
      doc.text(`Kode Karyawan: ${attendant?.employeeNumber || '-'}`, 20, 42);
      doc.text(`Status: ${attendant?.status || '-'}`, 20, 48);
      doc.text(`Tanggal Bergabung: ${attendant ? new Date(attendant.createdAt).toLocaleDateString('id-ID') : '-'}`, 20, 54);

      // Add summary information
      doc.text(`Total Transaksi: ${totalTransactions}`, 120, 36);
      doc.text(`Total Penjualan: Rp ${summary.totalSalesValue.toLocaleString('id-ID')}`, 120, 42);

      // Add date of report generation
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 120, 48);

      // Calculate the y position for the table
      let startY = 65;

      // Prepare transaction data for the table
      const transactionData = transactions.map((transaction, index) => [
        index + 1,
        transaction.invoice || '-',
        transaction.total ? `Rp ${transaction.total.toLocaleString('id-ID')}` : 'Rp 0',
        transaction.paymentMethod || '-',
        transaction.status || '-',
        new Date(transaction.createdAt).toLocaleDateString('id-ID')
      ]);

      // Add the table of transactions
      doc.autoTable({
        head: [['No.', 'Invoice', 'Total', 'Metode Pembayaran', 'Status', 'Tanggal']],
        body: transactionData,
        startY: startY,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [66, 73, 245], // Tailwind blue-500 equivalent
          textColor: [255, 255, 255]
        },
        alternateRowStyles: {
          fillColor: [243, 244, 246] // Light gray for alternate rows
        }
      });

      // Add detailed transaction items for each transaction
      let currentY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text('Detail Transaksi', 20, currentY);
      currentY += 10;

      for (const transaction of transactions) {
        doc.setFontSize(12);
        doc.text(`Invoice: ${transaction.invoice || '-'}`, 20, currentY);
        doc.text(`Tanggal: ${new Date(transaction.createdAt).toLocaleDateString('id-ID')}`, 100, currentY);
        currentY += 6;

        // Add items table for this transaction
        if (transaction.saleDetails && transaction.saleDetails.length > 0) {
          const itemData = transaction.saleDetails.map((detail, idx) => [
            idx + 1,
            detail.product?.name || 'Tidak Diketahui',
            detail.product?.productCode || 'Tidak Ada Kode',
            detail.quantity,
            `Rp ${detail.price.toLocaleString('id-ID')}`,
            `Rp ${detail.subtotal.toLocaleString('id-ID')}`
          ]);

          doc.autoTable({
            head: [['No.', 'Nama Produk', 'Kode Produk', 'Jumlah', 'Harga', 'Subtotal']],
            body: itemData,
            startY: currentY,
            margin: { left: 20 },
            theme: 'grid',
            styles: {
              fontSize: 9,
              cellPadding: 2
            },
            headStyles: {
              fillColor: [107, 114, 128], // Tailwind gray-500 equivalent
              textColor: [255, 255, 255]
            },
            tableWidth: 170
          });

          currentY = doc.lastAutoTable.finalY + 5;
        } else {
          doc.text('Tidak ada item dalam transaksi ini', 20, currentY);
          currentY += 5;
        }

        currentY += 5; // Space between transactions

        // Check if we need a new page
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
      }

      // Add page footer info
      doc.setFontSize(10);
      doc.text(`Laporan ini dihasilkan pada ${new Date().toLocaleString('id-ID')}`, 20, currentY + 5);
      doc.text(`Halaman ${doc.internal.getNumberOfPages()} dari ${doc.internal.getNumberOfPages()}`, 200, currentY + 5, null, null, 'right');

      // Save the PDF
      doc.save(`Laporan_Transaksi_Pelayan_${attendant?.name || 'tidak_diketahui'}_${new Date().toISOString().slice(0, 10)}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Gagal membuat laporan PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


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
    { key: 'actions', title: '', render: (_, transaction) => (
      <button
        onClick={() => {
          setSelectedTransaction(transaction);
          setShowTransactionDetails(true);
        }}
        className={`p-1 rounded-md ${
          darkMode
            ? 'text-blue-400 hover:bg-gray-700'
            : 'text-blue-600 hover:bg-gray-200'
        }`}
        title="Lihat Detail"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
      </button>
    )},
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


        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Riwayat Transaksi
          </h2>
          <button
            onClick={() => handlePrintReport()}
            className={`mt-2 sm:mt-0 px-4 py-2 rounded-lg flex items-center ${
              darkMode
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            Cetak Laporan
          </button>
        </div>

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <DataTable
            data={transactions}
            columns={columns}
            loading={loading}
            onSearch={() => {}} // Search on this page is not implemented
            onItemsPerPageChange={setItemsPerPage}
            darkMode={darkMode}
            actions={false} // Disable default actions column to prevent duplicate
            pagination={paginationData}
            mobileColumns={['invoice', 'total', 'createdAt']}
          />
        </div>

        {/* Transaction Detail Modal */}
        {showTransactionDetails && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`p-6 border-b ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex justify-between items-center">
                  <h3 className={`text-xl font-bold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Detail Transaksi - {selectedTransaction.invoice}
                  </h3>
                  <button
                    onClick={() => setShowTransactionDetails(false)}
                    className={`p-1 rounded-full ${
                      darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tanggal</p>
                    <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                      {new Date(selectedTransaction.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Metode Pembayaran</p>
                    <p className={darkMode ? 'text-white' : 'text-gray-900'}>{selectedTransaction.paymentMethod}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</p>
                    <p className={darkMode ? 'text-white' : 'text-gray-900'}>{selectedTransaction.status}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total</p>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Rp {selectedTransaction.total.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <h4 className={`text-lg font-semibold mb-4 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Item Pembelian
                </h4>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          darkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          Produk
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          darkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          Kode
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          darkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          Jumlah
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          darkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          Harga
                        </th>
                        <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          darkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${
                      darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'
                    }`}>
                      {selectedTransaction.saleDetails && selectedTransaction.saleDetails.map((detail, index) => (
                        <tr key={index}>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm ${
                            darkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                            {detail.product.name}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm ${
                            darkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                            {detail.product.productCode}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm ${
                            darkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                            {detail.quantity}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm ${
                            darkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                            Rp {detail.price.toLocaleString('id-ID')}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            Rp {detail.subtotal.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {(!selectedTransaction.saleDetails || selectedTransaction.saleDetails.length === 0) && (
                    <p className={`text-center py-4 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Tidak ada item dalam transaksi ini
                    </p>
                  )}
                </div>
              </div>

              <div className={`p-6 border-t ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              } flex justify-end`}>
                <button
                  onClick={() => setShowTransactionDetails(false)}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
