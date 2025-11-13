// components/admin/ReceivablesManager.js
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const ReceivablesManager = () => {
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceivable, setSelectedReceivable] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReceivables = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/receivables?search=${searchTerm}`);
      if (response.ok) {
        const data = await response.json();
        setReceivables(data.receivables || []);
      } else {
        toast.error('Gagal mengambil data hutang');
      }
    } catch (error) {
      console.error('Error fetching receivables:', error);
      toast.error('Gagal mengambil data hutang');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, [searchTerm]);

  const handlePayment = async () => {
    if (!selectedReceivable || paymentAmount <= 0) {
      toast.error('Jumlah pembayaran tidak valid');
      return;
    }

    const remainingAmount = selectedReceivable.amountDue - selectedReceivable.amountPaid;
    
    if (paymentAmount > remainingAmount) {
      toast.error(`Jumlah pembayaran melebihi sisa hutang. Maksimal: ${remainingAmount}`);
      return;
    }

    try {
      const response = await fetch(`/api/receivables/${selectedReceivable.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amountPaid: paymentAmount,
          paymentMethod
        }),
      });

      if (response.ok) {
        toast.success('Pembayaran hutang berhasil dicatat');
        setShowPaymentModal(false);
        setPaymentAmount(0);
        setSelectedReceivable(null);
        fetchReceivables(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.error || 'Gagal mencatat pembayaran');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Gagal mencatat pembayaran');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manajemen Hutang</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Cari nomor invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sudah Dibayar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sisa Hutang</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {receivables.length > 0 ? (
                receivables.map((receivable) => {
                  const remainingAmount = receivable.amountDue - receivable.amountPaid;
                  return (
                    <tr key={receivable.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {receivable.sale?.invoiceNumber || receivable.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {receivable.sale?.member?.name || receivable.member?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatCurrency(receivable.amountDue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatCurrency(receivable.amountPaid)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatCurrency(remainingAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${receivable.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                            receivable.status === 'PARTIALLY_PAID' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {receivable.status === 'PAID' ? 'Lunas' : 
                           receivable.status === 'PARTIALLY_PAID' ? 'Sebagian' : 'Belum Lunas'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {receivable.status !== 'PAID' && (
                          <button
                            onClick={() => {
                              setSelectedReceivable(receivable);
                              setPaymentAmount(remainingAmount);
                              setShowPaymentModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            Bayar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Tidak ada data hutang
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Pembayaran */}
      {showPaymentModal && selectedReceivable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl shadow-2xl bg-white dark:bg-gray-800 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Pembayaran Hutang</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Invoice</label>
                <p className="text-sm">{selectedReceivable.sale?.invoiceNumber}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Member</label>
                <p className="text-sm">{selectedReceivable.sale?.member?.name || selectedReceivable.member?.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Total Hutang</label>
                <p className="text-sm">{formatCurrency(selectedReceivable.amountDue)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Sudah Dibayar</label>
                <p className="text-sm">{formatCurrency(selectedReceivable.amountPaid)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Sisa Hutang</label>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(selectedReceivable.amountDue - selectedReceivable.amountPaid)}
                </p>
              </div>
              
              <div>
                <label htmlFor="paymentAmount" className="block text-sm font-medium mb-1">
                  Jumlah Pembayaran
                </label>
                <input
                  type="number"
                  id="paymentAmount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="1"
                  max={selectedReceivable.amountDue - selectedReceivable.amountPaid}
                />
              </div>
              
              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium mb-1">
                  Metode Pembayaran
                </label>
                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="CASH">CASH</option>
                  <option value="TRANSFER">TRANSFER</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2 px-4 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600"
              >
                Batal
              </button>
              <button
                onClick={handlePayment}
                className="flex-1 py-2 px-4 rounded-md text-sm font-medium bg-purple-600 text-white hover:bg-purple-700"
              >
                Proses Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceivablesManager;