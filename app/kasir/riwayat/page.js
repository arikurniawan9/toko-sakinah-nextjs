// app/kasir/riwayat/page.js
'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { useUserTheme } from '../../../components/UserThemeContext';
import { History, Home, Calendar, Search, Printer, Undo2 } from 'lucide-react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { printThermalReceipt } from '../../../utils/thermalPrint'; // Import the thermal print utility
import UndoTransactionButton from '../../../components/kasir/transaksi/UndoTransactionButton'; // Import Undo Transaction Button

export default function RiwayatKasirPage() {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchTransactions = async (page = 1, date = '', endDate = '', search = '', limit = itemsPerPage) => {
    setLoading(true);
    try {
      let url = `/api/kasir/transaksi?page=${page}&limit=${limit}`;
      if (date) {
        url += `&date=${date}`;
      }
      if (endDate) {
        url += `&endDate=${endDate}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Gagal memuat riwayat transaksi');
      }
      const data = await response.json();

      setTransactions(data.sales || []);
      setPagination({
        page: data.pagination.page,
        totalPages: data.pagination.totalPages,
        total: data.pagination.total,
        limit: data.pagination.limit
      });
    } catch (err) {
      setError(err.message);
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = async (transaction) => {
    // Ambil informasi toko untuk dimasukkan ke dalam receipt
    let storeInfo = {
      name: 'TOKO SAKINAH',
      address: 'Jl. Raya No. 123, Kota Anda',
      phone: '0812-3456-7890',
    };

    try {
      const storeResponse = await fetch('/api/stores/current');
      if (storeResponse.ok) {
        const storeData = await storeResponse.json();
        storeInfo = {
          name: storeData.name || process.env.NEXT_PUBLIC_SHOP_NAME || 'TOKO SAKINAH',
          address: storeData.address || process.env.NEXT_PUBLIC_SHOP_ADDRESS || 'Jl. Raya No. 123, Kota Anda',
          phone: storeData.phone || process.env.NEXT_PUBLIC_SHOP_PHONE || '0812-3456-7890',
        };
      } else {
        // Coba endpoint setting sebagai fallback
        const settingResponse = await fetch('/api/setting');
        if (settingResponse.ok) {
          const settingData = await settingResponse.json();
          storeInfo = {
            name: settingData.shopName || process.env.NEXT_PUBLIC_SHOP_NAME || 'TOKO SAKINAH',
            address: settingData.address || process.env.NEXT_PUBLIC_SHOP_ADDRESS || 'Jl. Raya No. 123, Kota Anda',
            phone: settingData.phone || process.env.NEXT_PUBLIC_SHOP_PHONE || '0812-3456-7890',
          };
        }
      }
    } catch (error) {
      console.error('Error fetching store info for receipt:', error);
      // Gunakan environment variables atau default jika API gagal
      storeInfo = {
        name: process.env.NEXT_PUBLIC_SHOP_NAME || 'TOKO SAKINAH',
        address: process.env.NEXT_PUBLIC_SHOP_ADDRESS || 'Jl. Raya No. 123, Kota Anda',
        phone: process.env.NEXT_PUBLIC_SHOP_PHONE || '0812-3456-7890',
      };
    }

    // Transform the transaction data to the format expected by printThermalReceipt
    const receiptPayload = {
      id: transaction.id,
      invoiceNumber: transaction.invoiceNumber,
      date: transaction.date,
      cashier: { name: transaction.cashierName },
      attendant: { name: transaction.attendantName },
      payment: transaction.payment,
      change: transaction.change,
      paymentMethod: transaction.paymentMethod,
      grandTotal: transaction.totalAmount,
      totalDiscount: transaction.discount + transaction.additionalDiscount,
      subTotal: transaction.totalAmount + transaction.discount + transaction.additionalDiscount, // Approximate subtotal
      items: transaction.items.map(item => ({
        name: item.productName,
        quantity: item.quantity,
        originalPrice: item.price, // Assuming price from history is the final price
        priceAfterItemDiscount: item.price,
      })),
      storeName: storeInfo.name,
      storeAddress: storeInfo.address,
      storePhone: storeInfo.phone,
    };

    printThermalReceipt(receiptPayload)
      .then(() => console.log("Cetak struk dari riwayat berhasil."))
      .catch((error) => console.error("Gagal mencetak struk dari riwayat:", error));
  };


  // Fetch transactions when page, date, endDate, search term, or itemsPerPage changes with debounce for search
  useEffect(() => {
    if (searchTerm) {
      // When searching, always start from first page
      const delayDebounce = setTimeout(() => {
        fetchTransactions(1, selectedDate, endDate, searchTerm, itemsPerPage);
      }, 300); // Debounce search to avoid too many API calls

      return () => clearTimeout(delayDebounce);
    } else {
      // If search term is empty, fetch with pagination, date filter, and items per page
      fetchTransactions(pagination.page, selectedDate, endDate, '', itemsPerPage);
    }
  }, [searchTerm, selectedDate, endDate, pagination.page, itemsPerPage]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page }));
    }
  };

  return (
    <ProtectedRoute requiredRole="CASHIER">
      <Sidebar>
        <main className={`flex-1 p-4 min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <History className={`h-8 w-8 mr-3 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <div>
                  <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Riwayat Transaksi Kasir</h1>
                  <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Daftar transaksi yang telah Anda proses.</p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className={`mb-6 p-4 rounded-xl shadow border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-2 flex items-center">
                  <label className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Dari:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      // Reset to first page when date changes
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  />
                </div>
                <div className="md:col-span-2 flex items-center">
                  <label className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sampai:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      // Reset to first page when date changes
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  />
                </div>
                <div className="md:col-span-5 flex items-center">
                  <Search className={`mr-2 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari berdasarkan nomor invoice..."
                    className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className={`ml-2 p-1 rounded-full ${
                        darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      &times;
                    </button>
                  )}
                </div>
                <div className="md:col-span-3 flex items-center">
                  <label className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Item:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when changing items per page
                    }}
                    className={`w-20 px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className={`rounded-xl shadow overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {loading ? (
                <div className="p-8 text-center">
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Memuat riwayat transaksi...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <p className="text-red-500">Error: {error}</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center">
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tidak ada transaksi ditemukan.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead>
                        <tr>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-500'}`}>
                            Invoice
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-500'}`}>
                            Tanggal
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-500'}`}>
                            Total
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-500'}`}>
                            Bayar
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-500'}`}>
                            Status
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-500'}`}>
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                            <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                              {transaction.invoiceNumber}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              {formatDate(transaction.date)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                              {formatCurrency(transaction.totalAmount)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                              {formatCurrency(transaction.payment)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap`}>
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                transaction.status === 'PAID'
                                  ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800')
                                  : (darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800')
                              }`}>
                                {transaction.status}
                              </span>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm`}>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handlePrintReceipt(transaction)}
                                  className={`p-1 rounded ${
                                    darkMode
                                      ? 'text-gray-300 hover:bg-gray-700'
                                      : 'text-gray-600 hover:bg-gray-200'
                                  }`}
                                  title="Cetak Struk"
                                >
                                  <Printer size={16} />
                                </button>
                                {/* Tombol undo hanya untuk transaksi yang statusnya 'PAID' dan masih dalam waktu maksimum undo */}
                                {transaction.status === 'PAID' && (
                                  <UndoTransactionButton
                                    saleId={transaction.id}
                                    invoiceNumber={transaction.invoiceNumber}
                                    onUndo={() => fetchTransactions(pagination.page, selectedDate, endDate, searchTerm, itemsPerPage)}
                                    darkMode={darkMode}
                                  />
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className={`px-4 py-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} transaksi
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => goToPage(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className={`px-3 py-1.5 text-sm rounded ${
                              pagination.page === 1
                                ? (darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                                : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800')
                            }`}
                          >
                            Sebelumnya
                          </button>
                          <span className={`px-3 py-1.5 text-sm ${darkMode ? 'text-white bg-gray-700' : 'text-gray-800 bg-gray-200'} rounded`}>
                            {pagination.page} dari {pagination.totalPages}
                          </span>
                          <button
                            onClick={() => goToPage(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                            className={`px-3 py-1.5 text-sm rounded ${
                              pagination.page === pagination.totalPages
                                ? (darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                                : (darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800')
                            }`}
                          >
                            Berikutnya
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </Sidebar>
    </ProtectedRoute>
  );
}
