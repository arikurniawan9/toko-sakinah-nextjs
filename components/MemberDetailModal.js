// components/MemberDetailModal.js
import { useState, useEffect } from 'react';
import { Eye, X } from 'lucide-react';

export default function MemberDetailModal({ isOpen, onClose, memberId }) {
  const [member, setMember] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && memberId) {
      fetchMemberDetail();
    }
  }, [isOpen, memberId]);

  const fetchMemberDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ambil detail member
      const memberRes = await fetch(`/api/member/${memberId}`);
      if (!memberRes.ok) {
        throw new Error('Gagal mengambil data member');
      }
      const memberData = await memberRes.json();
      setMember(memberData.member);

      // Ambil riwayat transaksi untuk member ini
      const transactionRes = await fetch(`/api/transaksi?memberId=${memberId}`);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Detail Member</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-grow">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pastel-purple-600"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-red-500">
              Error: {error}
            </div>
          ) : member ? (
            <>
              {/* Member Info */}
              <div className="p-6 border-b">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Informasi Member</h3>
                    <div className="space-y-1">
                      <p><span className="font-medium">Nama:</span> {member.name}</p>
                      <p><span className="font-medium">Nomor HP:</span> {member.phone}</p>
                      <p><span className="font-medium">Alamat:</span> {member.address || '-'}</p>
                      <p><span className="font-medium">Jenis Member:</span> {member.membershipType}</p>
                      <p><span className="font-medium">Diskon:</span> {member.discount}%</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Statistik</h3>
                    <div className="space-y-1">
                      <p><span className="font-medium">Jumlah Transaksi:</span> {transactions.length}</p>
                      <p>
                        <span className="font-medium">Total Pembelian:</span> 
                        {transactions.length > 0 
                          ? `Rp ${transactions.reduce((sum, t) => sum + t.total, 0).toLocaleString()}` 
                          : 'Rp 0'}
                      </p>
                      <p><span className="font-medium">Terdaftar:</span> {new Date(member.createdAt).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Riwayat Belanja</h3>
                
                {transactions.length === 0 ? (
                  <p className="text-gray-600">Belum ada riwayat belanja untuk member ini.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Invoice</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{transaction.invoiceNumber}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              {new Date(transaction.date).toLocaleDateString('id-ID')}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              Rp {transaction.total.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${transaction.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
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
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-md"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}