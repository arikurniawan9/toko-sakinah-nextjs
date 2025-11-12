'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useDarkMode } from '../../../../components/DarkModeContext';
import { Search, Calendar, Receipt, Eye, X } from 'lucide-react';

export default function RiwayatPenjualan() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/transactions/sales');
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const data = await response.json();
        setTransactions(data);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Filter transactions based on search and date range
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.cashierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const transactionDate = new Date(transaction.date);
    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;
    
    const matchesDate = 
      (!startDate || transactionDate >= startDate) && 
      (!endDate || transactionDate <= endDate);
    
    return matchesSearch && matchesDate;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Riwayat Penjualan</h1>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Lihat dan kelola riwayat transaksi penjualan
              </p>
            </div>
            <button className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pastel-purple-600 hover:bg-pastel-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-purple-500`}>
              <Receipt className="h-4 w-4 mr-2" />
              Ekspor Laporan
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`mb-6 p-4 rounded-xl shadow ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Cari transaksi, kasir, pelanggan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:ring-2 focus:ring-pastel-purple-500 focus:border-transparent`}
              />
            </div>
            <div className="relative">
              <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-pastel-purple-500 focus:border-transparent`}
              />
            </div>
            <div className="relative">
              <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-pastel-purple-500 focus:border-transparent`}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'} border`}>
            <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
          </div>
        )}

        {/* Transactions Table */}
        <div className={`rounded-xl shadow ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    ID Transaksi
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Kasir
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Tanggal
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Jumlah
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Status
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className={darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pastel-purple-500"></div>
                        <span className={`ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Memuat...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={`px-6 py-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Tidak ada riwayat penjualan ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr 
                      key={transaction.id} 
                      className={`hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}
                    >
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                        #{transaction.id.substring(0, 8)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {transaction.cashierName}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {formatDate(transaction.date)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(transaction.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedTransaction(transaction)}
                          className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-pastel-purple-600 hover:bg-pastel-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-purple-500`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:flex print:items-center print:justify-center print:inset-0 print:bg-white">
          <div className={`relative max-w-2xl w-full rounded-xl shadow-lg ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } print:bg-white print:shadow-none print:w-full print:max-w-none print:m-0 print:p-4`}>
            <div className="p-6 print:p-0 print:overflow-visible">
              <div className="flex justify-between items-center mb-4 print:hidden">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Detail Transaksi</h2>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4 print:space-y-2">
                {/* Header struk cetak */}
                <div className="print:block hidden text-center border-b pb-3 mb-3">
                  <h2 className="text-lg font-bold">TOKO SAKINAH</h2>
                  <p className="text-sm">Jl. Contoh Alamat Toko No. 123</p>
                  <p className="text-sm">Telp: (021) 12345678</p>
                </div>
                
                {/* Informasi transaksi untuk tampilan cetak */}
                <div className="print:block hidden text-center mb-3">
                  <h3 className="font-bold text-lg border-b pb-1">STRUK PEMBELIAN</h3>
                  <p className="text-sm">ID: #{selectedTransaction.id}</p>
                  <p className="text-sm">{formatDate(selectedTransaction.date)}</p>
                </div>
                
                {/* Informasi transaksi untuk tampilan normal */}
                <div className="grid grid-cols-2 gap-4 print:hidden">
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>ID Transaksi</label>
                    <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tanggal</label>
                    <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatDate(selectedTransaction.date)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 print:hidden">
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Kasir</label>
                    <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedTransaction.cashierName}</p>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pelanggan</label>
                    <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedTransaction.customerName}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 print:hidden">
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</label>
                    <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                        {selectedTransaction.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Keseluruhan</label>
                    <p className={`mt-1 text-sm font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{formatCurrency(selectedTransaction.totalAmount)}</p>
                  </div>
                </div>
                
                {/* Info Diskon untuk tampilan normal */}
                {(selectedTransaction.discount > 0 || selectedTransaction.additionalDiscount > 0) && (
                  <div className="grid grid-cols-2 gap-4 print:hidden">
                    <div>
                      <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Diskon Member</label>
                      <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(selectedTransaction.discount || 0)}</p>
                    </div>
                    <div>
                      <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Diskon Tambahan</label>
                      <p className={`mt-1 text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(selectedTransaction.additionalDiscount || 0)}</p>
                    </div>
                  </div>
                )}
                
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2 print:hidden">
                    <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Item Produk</h3>
                    <button
                      onClick={() => {
                        // Membuat elemen iframe untuk mencetak hanya struk
                        const printWindow = window.open('', '_blank');
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Struk Transaksi - ${selectedTransaction.id}</title>
                              <style>
                                @media print {
                                  @page { size: 76mm 297mm; margin: 0.25in; }
                                }
                                body { 
                                  font-family: 'Courier New', monospace; 
                                  font-size: 12px; 
                                  margin: 0; 
                                  padding: 5px;
                                  width: 70mm;
                                  word-wrap: break-word;
                                }
                                .header { text-align: center; margin-bottom: 10px; }
                                .header h2 { margin: 2px 0; font-size: 14px; }
                                .header p { margin: 2px 0; font-size: 10px; }
                                .transaction-info { margin: 5px 0; font-size: 10px; }
                                .items { margin: 10px 0; }
                                .item-row { display: flex; justify-content: space-between; padding: 1px 0; font-size: 10px; }
                                .item-row.discount { font-weight: bold; }
                                .divider { border-bottom: 1px solid #000; margin: 5px 0; }
                                .total { font-weight: bold; margin: 5px 0; }
                                .summary-row { display: flex; justify-content: space-between; padding: 1px 0; font-size: 10px; }
                                .footer { text-align: center; margin-top: 10px; font-size: 9px; }
                                .payment-info { margin: 5px 0; font-size: 10px; }
                              </style>
                            </head>
                            <body>
                              <div class="header">
                                <h2>TOKO SAKINAH</h2>
                                <p>Jl. Contoh Alamat Toko No. 123</p>
                                <p>Telp: (021) 12345678</p>
                                <div class="divider"></div>
                                <p style="font-weight: bold;">STRUK PEMBELIAN</p>
                                <div class="transaction-info">
                                  <p>ID: #${selectedTransaction.id.substring(0, 8)}</p>
                                  <p>${formatDate(selectedTransaction.date)}</p>
                                  <p>Kasir: ${selectedTransaction.cashierName}</p>
                                  ${selectedTransaction.customerName !== '-' ? `<p>Pelanggan: ${selectedTransaction.customerName}</p>` : ''}
                                </div>
                              </div>
                              
                              <div class="items">
                                ${selectedTransaction.items?.map(item => `
                                  <div class="item-row">
                                    <div>
                                      <span>${item.productName.substring(0, 15)}${item.productName.length > 15 ? '...' : ''}</span>
                                      <span style="font-size: 9px;">(${item.quantity} x ${formatCurrency(item.price)})</span>
                                    </div>
                                    <span>${formatCurrency(item.subtotal)}</span>
                                  </div>
                                `).join('')}
                              </div>
                              
                              <div style="margin: 5px 0;">
                                <div class="summary-row">
                                  <span>Total Awal:</span>
                                  <span>${formatCurrency((selectedTransaction.totalAmount || 0) + (selectedTransaction.discount || 0))}</span>
                                </div>
                                ${(selectedTransaction.discount || 0) > 0 ? `<div class="summary-row discount">
                                  <span>Diskon Member:</span>
                                  <span>-${formatCurrency(selectedTransaction.discount)}</span>
                                </div>` : ''}
                                ${(selectedTransaction.additionalDiscount || 0) > 0 ? `<div class="summary-row discount">
                                  <span>Diskon Tambahan:</span>
                                  <span>-${formatCurrency(selectedTransaction.additionalDiscount)}</span>
                                </div>` : ''}
                                ${(selectedTransaction.tax || 0) > 0 ? `<div class="summary-row">
                                  <span>PPN ${(() => {
                                    const taxRate = selectedTransaction.totalAmount ? (selectedTransaction.tax / selectedTransaction.totalAmount) * 100 : 0;
                                    return taxRate.toFixed(0);
                                  })()}%:</span>
                                  <span>${formatCurrency(selectedTransaction.tax)}</span>
                                </div>` : ''}
                              </div>
                              
                              <div class="divider"></div>
                              
                              <div class="total">
                                <div class="summary-row">
                                  <span>Total:</span>
                                  <span>${formatCurrency(selectedTransaction.totalAmount)}</span>
                                </div>
                              </div>
                              
                              <div class="payment-info">
                                <div class="summary-row">
                                  <span>Dibayar:</span>
                                  <span>${formatCurrency(selectedTransaction.payment || 0)}</span>
                                </div>
                                <div class="summary-row">
                                  <span>Kembalian:</span>
                                  <span>${formatCurrency(selectedTransaction.change || 0)}</span>
                                </div>
                              </div>
                              
                              <div class="divider"></div>
                              
                              <div class="footer">
                                <p>Terima kasih telah berbelanja</p>
                                <p>di Toko Sakinah</p>
                                <p>Barang yang sudah dibeli</p>
                                <p>tidak dapat ditukar/dikembalikan</p>
                              </div>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.focus();
                        setTimeout(() => {
                          printWindow.print();
                          printWindow.close();
                        }, 250);
                      }}
                      className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <Receipt className="h-4 w-4 mr-1" />
                      Cetak Struk
                    </button>
                  </div>
                  
                  {/* Tabel item untuk tampilan cetak */}
                  <div className="print:block hidden">
                    <div className="space-y-1">
                      {selectedTransaction.items?.map((item, index) => (
                        <div key={index} className="flex justify-between border-b pb-1">
                          <div>
                            <span className="text-sm">{item.productName}</span>
                            <span className="text-xs block">({item.quantity} x {formatCurrency(item.price)})</span>
                          </div>
                          <span className="text-sm">{formatCurrency(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-1">
                      <div className="flex justify-between text-sm">
                        <span>Total Awal:</span>
                        <span>{formatCurrency((selectedTransaction.totalAmount || 0) + (selectedTransaction.discount || 0))}</span>
                      </div>
                      {(selectedTransaction.discount || 0) > 0 && (
                        <div className="flex justify-between text-sm font-bold">
                          <span>Diskon Member:</span>
                          <span>-{formatCurrency(selectedTransaction.discount)}</span>
                        </div>
                      )}
                      {(selectedTransaction.additionalDiscount || 0) > 0 && (
                        <div className="flex justify-between text-sm font-bold">
                          <span>Diskon Tambahan:</span>
                          <span>-{formatCurrency(selectedTransaction.additionalDiscount)}</span>
                        </div>
                      )}
                      {(selectedTransaction.tax || 0) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>PPN {((selectedTransaction.tax || 0) > 0 ? ((selectedTransaction.tax / (selectedTransaction.totalAmount || 1)) * 100).toFixed(0) : 0)}%:</span>
                          <span>{formatCurrency(selectedTransaction.tax)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-base">
                        <span>Total:</span>
                        <span>{formatCurrency(selectedTransaction.totalAmount)}</span>
                      </div>
                      
                      <div className="pt-1">
                        <div className="flex justify-between text-sm">
                          <span>Dibayar:</span>
                          <span>{formatCurrency(selectedTransaction.payment || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Kembalian:</span>
                          <span>{formatCurrency(selectedTransaction.change || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tabel item untuk tampilan normal */}
                  <div className="mt-2 print:hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Produk</th>
                          <th className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Qty</th>
                          <th className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Harga</th>
                          <th className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedTransaction.items?.map((item, index) => (
                          <tr key={index}>
                            <td className={`px-4 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{item.productName}</td>
                            <td className={`px-4 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{item.quantity}</td>
                            <td className={`px-4 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{formatCurrency(item.price)}</td>
                            <td className={`px-4 py-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Footer struk cetak */}
                <div className="print:block hidden text-center pt-3 mt-3 border-t">
                  <p className="text-xs">Terima kasih telah berbelanja di Toko Sakinah</p>
                  <p className="text-xs">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}