// app/admin/member/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useDarkMode } from '../../../../components/DarkModeContext';
import TransactionDetailModal from '../../../../components/TransactionDetailModal';
import { ROLES } from '@/lib/constants';
import { ArrowLeft, User, ShoppingBag, Package, Wallet, Calendar, CreditCard } from 'lucide-react';

export default function MemberDetailPage({ params }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { darkMode } = useDarkMode();
  const [member, setMember] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    if (status === 'authenticated') {
      if (session.user.role !== ROLES.ADMIN) {
        router.push('/unauthorized');
        return;
      }
      fetchMemberDetail();
    }
  }, [status, session, params.id]);

  const fetchMemberDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/member/${params.id}`);
      if (!res.ok) {
        throw new Error('Gagal mengambil data member');
      }
      const data = await res.json();
      setMember(data.member);

      // Ambil juga riwayat transaksi untuk member ini
      const transactionRes = await fetch(`/api/transaksi?memberId=${params.id}`);
      if (!transactionRes.ok) {
        throw new Error('Gagal mengambil riwayat transaksi');
      }
      const transactionData = await transactionRes.json();
      setTransactions(transactionData.transactions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  if (status === 'loading' || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className={`mt-4 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Memuat data...</p>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated' || !member) {
    router.push('/login');
    return null;
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="text-center">
          <p className={`text-lg ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Error: {error}</p>
          <button
            onClick={() => router.back()}
            className={`mt-4 px-4 py-2 rounded ${darkMode ? 'bg-purple-700 hover:bg-purple-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  // Hitung statistik
  const totalTransactions = transactions.length;
  const totalSpent = transactions.length > 0
    ? transactions.reduce((sum, t) => sum + t.total, 0)
    : 0;
  const avgTransaction = totalTransactions > 0
    ? totalSpent / totalTransactions
    : 0;
  const paidTransactions = transactions.filter(t => t.status === 'PAID').length;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} transition-colors duration-200`}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300'
            } transition-colors duration-200 shadow`}
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
        </div>

        {/* Header Member */}
        <div className={`rounded-xl shadow-lg mb-8 p-6 ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-start gap-6">
            <div className={`p-4 rounded-full ${
              darkMode ? 'bg-purple-900/50' : 'bg-purple-100'
            }`}>
              <User className={`h-12 w-12 ${
                darkMode ? 'text-purple-400' : 'text-purple-600'
              }`} />
            </div>
            <div className="flex-1">
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {member.name}
              </h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Member {member.membershipType} • {member.phone}
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700'
                }`}>
                  <Wallet className="h-4 w-4" />
                  <span className="font-medium">{member.discount}% Diskon</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'
                }`}>
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">
                    Terdaftar: {new Date(member.createdAt).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistik Member */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`rounded-xl p-6 ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          } shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Transaksi</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {totalTransactions}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                darkMode ? 'bg-purple-900/50' : 'bg-purple-100'
              }`}>
                <ShoppingBag className={`h-6 w-6 ${
                  darkMode ? 'text-purple-400' : 'text-purple-600'
                }`} />
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-6 ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          } shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Pembelian</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Rp {totalSpent.toLocaleString()}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                darkMode ? 'bg-green-900/50' : 'bg-green-100'
              }`}>
                <Wallet className={`h-6 w-6 ${
                  darkMode ? 'text-green-400' : 'text-green-600'
                }`} />
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-6 ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          } shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rata-rata Transaksi</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Rp {Math.round(avgTransaction).toLocaleString()}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                darkMode ? 'bg-blue-900/50' : 'bg-blue-100'
              }`}>
                <Package className={`h-6 w-6 ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-6 ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          } shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Transaksi Lunas</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {paidTransactions}/{totalTransactions}
                </p>
              </div>
              <div className={`p-3 rounded-full ${
                darkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'
              }`}>
                <CreditCard className={`h-6 w-6 ${
                  darkMode ? 'text-yellow-400' : 'text-yellow-600'
                }`} />
              </div>
            </div>
          </div>
        </div>

        {/* Riwayat Belanja */}
        <div className={`rounded-xl shadow-lg p-6 ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Riwayat Belanja
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm ${
              darkMode
                ? 'bg-purple-900/50 text-purple-400'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {transactions.length} transaksi
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className={`text-center py-12 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Belum ada riwayat belanja untuk member ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`min-w-full ${
                darkMode ? 'divide-gray-700' : 'divide-gray-200'
              }`}>
                <thead>
                  <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      No. Invoice
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Tanggal
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Total
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Pembayaran
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'
                }`}>
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className={`${
                        darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'
                      } transition-colors duration-150 cursor-pointer`}
                      onClick={() => handleTransactionClick(transaction)}
                    >
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {transaction.invoiceNumber}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        darkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {new Date(transaction.date).toLocaleDateString('id-ID')}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Rp {transaction.total.toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        darkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {transaction.paymentMethod} - Rp {transaction.payment.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.status === 'PAID'
                            ? darkMode
                              ? 'bg-green-900/50 text-green-400'
                              : 'bg-green-100 text-green-800'
                            : transaction.status === 'UNPAID'
                            ? darkMode
                              ? 'bg-red-900/50 text-red-400'
                              : 'bg-red-100 text-red-800'
                            : darkMode
                              ? 'bg-yellow-900/50 text-yellow-400'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
}