// components/kasir/transaksi/AllReceivablesModal.js
'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, User, CreditCard } from 'lucide-react';
import { toast } from 'react-toastify';

const AllReceivablesModal = ({ isOpen, onClose, darkMode }) => {
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceivable, setSelectedReceivable] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchReceivables();
    }
  }, [isOpen]);

  const fetchReceivables = async () => {
    try {
      setLoading(true);
      // Ambil semua hutang (UNPAID dan PARTIALLY_PAID) tanpa filter member
      // Kita coba dulu dengan status spesifik
      const response = await fetch('/api/receivables?status=UNPAID,PARTIALLY_PAID');
      if (response.ok) {
        const data = await response.json();
        setReceivables(data.receivables || []);
      } else {
        // Jika permintaan dengan status gagal, coba tanpa status
        const responseAll = await fetch('/api/receivables');
        if (responseAll.ok) {
          const dataAll = await responseAll.json();
          // Filter sisi klien untuk hanya menampilkan UNPAID dan PARTIALLY_PAID
          const filteredReceivables = dataAll.receivables?.filter(r => 
            r.status === 'UNPAID' || r.status === 'PARTIALLY_PAID'
          ) || [];
          setReceivables(filteredReceivables);
        } else {
          toast.error('Gagal mengambil data hutang');
        }
      }
    } catch (error) {
      console.error('Error fetching receivables:', error);
      toast.error('Gagal mengambil data hutang');
    } finally {
      setLoading(false);
    }
  };

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
          paymentMethod,
          ...(paymentMethod !== 'CASH' && referenceNumber && { referenceNumber })
        }),
      });

      if (response.ok) {
        toast.success('Pembayaran hutang berhasil dicatat');
        setShowPaymentModal(false);
        setPaymentAmount(0);
        setReferenceNumber(''); // Reset reference number after successful payment
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

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`relative rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex justify-between items-center p-6 border-b bg-white dark:bg-gray-800 rounded-t-xl">
          <h2 className="text-xl font-bold flex items-center">
            <DollarSign className="mr-2" size={20} />
            Daftar Member dengan Hutang
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : receivables.length > 0 ? (
            <div className="space-y-4">
              {receivables.map((receivable) => {
                const remainingAmount = receivable.amountDue - receivable.amountPaid;
                const isFullyPaid = receivable.status === 'PAID';
                const memberName = receivable.sale?.member?.name || receivable.member?.name || 'Tidak Ada Nama';
                
                return (
                  <div 
                    key={receivable.id} 
                    className={`p-4 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                      {/* Member Info */}
                      <div className="md:col-span-2">
                        <div className="flex items-center font-bold">
                          <User size={16} className="mr-2 flex-shrink-0" />
                          <span className="truncate">{memberName}</span>
                        </div>
                        <p className={`text-xs mt-1 truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} title={receivable.sale?.invoiceNumber}>
                          Inv: {receivable.sale?.invoiceNumber || receivable.id}
                        </p>
                        {receivable.sale?.attendant?.name && (
                          <p className={`text-xs mt-1 truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Pelayan: {receivable.sale.attendant.name}
                          </p>
                        )}
                      </div>

                      {/* Financial Details */}
                      <div className="md:col-span-3">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Total Hutang</div>
                          <div className="font-medium text-right">{formatCurrency(receivable.amountDue)}</div>
                          
                          <div className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Sudah Dibayar</div>
                          <div className={`font-medium text-right ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{formatCurrency(receivable.amountPaid)}</div>

                          <div className={`font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sisa Hutang</div>
                          <div className="font-bold text-red-500 dark:text-red-400 text-right">{formatCurrency(remainingAmount)}</div>
                        </div>
                      </div>
                      
                      {/* Status & Action */}
                      <div className="flex flex-col items-start md:items-end justify-center space-y-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          receivable.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                          receivable.status === 'PARTIALLY_PAID' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {receivable.status === 'PAID' ? 'Lunas' : 
                           receivable.status === 'PARTIALLY_PAID' ? 'Sebagian' : 'Belum Lunas'}
                        </span>
                        {!isFullyPaid && (
                          <button
                            onClick={() => {
                              setSelectedReceivable(receivable);
                              setPaymentAmount(remainingAmount);
                              setPaymentMethod('CASH');
                              setReferenceNumber('');
                              setShowPaymentModal(true);
                            }}
                            className={`px-3 py-1.5 text-sm rounded-md flex items-center w-full justify-center md:w-auto ${
                              darkMode
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            <CreditCard size={14} className="mr-1" />
                            Bayar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tidak ada hutang aktif</p>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Tidak ada member yang memiliki hutang yang belum lunas</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedReceivable && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className={`relative rounded-xl shadow-lg w-full max-w-md bg-white dark:bg-gray-800 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Pembayaran Hutang</h3>
              
              <div className="space-y-3 mb-4">
                <div>
                  <span className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Member</span>
                  <p className="font-medium">{selectedReceivable.sale?.member?.name || selectedReceivable.member?.name}</p>
                </div>
                
                <div>
                  <span className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Invoice</span>
                  <p className="font-medium">{selectedReceivable.sale?.invoiceNumber}</p>
                </div>
                
                <div>
                  <span className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Hutang</span>
                  <p className="font-medium">{formatCurrency(selectedReceivable.amountDue)}</p>
                </div>
                
                <div>
                  <span className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sudah Dibayar</span>
                  <p className="font-medium">{formatCurrency(selectedReceivable.amountPaid)}</p>
                </div>
                
                <div>
                  <span className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sisa Hutang</span>
                  <p className="font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(selectedReceivable.amountDue - selectedReceivable.amountPaid)}
                  </p>
                </div>
                
                <div>
                  <label htmlFor="paymentAmount" className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Jumlah Pembayaran
                  </label>
                  <input
                    type="number"
                    id="paymentAmount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                    }`}
                    min="1"
                    max={selectedReceivable.amountDue - selectedReceivable.amountPaid}
                  />
                  <p className="text-xs mt-1 text-gray-500">Maksimal: {formatCurrency(selectedReceivable.amountDue - selectedReceivable.amountPaid)}</p>
                </div>
                
                <div>
                  <label htmlFor="paymentMethod" className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Metode Pembayaran
                  </label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      // Reset reference number when payment method changes to CASH
                      if (e.target.value === 'CASH') {
                        setReferenceNumber('');
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  >
                    <option value="CASH">CASH</option>
                    <option value="TRANSFER">TRANSFER</option>
                  </select>
                </div>

                {/* Tampilkan input nomor referensi hanya untuk pembayaran non-tunai */}
                {paymentMethod !== 'CASH' && (
                  <div>
                    <label htmlFor="referenceNumberInput" className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Nomor Referensi
                    </label>
                    <input
                      type="text"
                      id="referenceNumberInput"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                      }`}
                      placeholder="Masukkan nomor referensi"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 flex flex-row-reverse gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
              <button
                onClick={handlePayment}
                disabled={paymentAmount <= 0}
                className={`px-4 py-2 rounded-md text-white font-medium flex items-center ${
                  paymentAmount <= 0 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : darkMode 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <CreditCard size={16} className="mr-1" />
                Lunasi Hutang
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setReferenceNumber(''); // Reset reference number when modal is closed
                }}
                className={`px-4 py-2 rounded-md font-medium ${
                  darkMode
                    ? 'border border-gray-600 bg-gray-700 hover:bg-gray-600 text-white'
                    : 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllReceivablesModal;