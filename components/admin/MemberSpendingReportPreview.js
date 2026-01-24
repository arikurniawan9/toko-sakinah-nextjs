// components/admin/MemberSpendingReportPreview.js
import { useState, useRef } from 'react';
import { Printer, Download } from 'lucide-react';
import { generateMemberSpendingReportPDF } from './MemberSpendingReportPDFGenerator';

const MemberSpendingReportPreview = ({ member, transactions, onClose }) => {
  const reportRef = useRef(null);
  
  // Hitung statistik
  const totalTransactions = transactions.length;
  const totalSpent = transactions.length > 0
    ? transactions.reduce((sum, t) => sum + t.total, 0)
    : 0;
  const avgTransaction = totalTransactions > 0
    ? totalSpent / totalTransactions
    : 0;
  const paidTransactions = transactions.filter(t => t.status === 'PAID').length;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateMemberSpendingReportPDF(member, transactions);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        ref={reportRef}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-gray-800">Preview Laporan Pembelanjaan Member</h2>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Unduh PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Cetak
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="p-6 print:p-0 print:shadow-none">
          {/* Report Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">LAPORAN PEMBELANJAAN MEMBER</h1>
            <div className="border-t border-gray-300 pt-2"></div>
          </div>

          {/* Member Info */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Informasi Member</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex">
                <span className="font-medium w-32 text-gray-600">Nama:</span>
                <span className="text-gray-800">{member.name}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-32 text-gray-600">Nomor Telepon:</span>
                <span className="text-gray-800">{member.phone}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-32 text-gray-600">Jenis Membership:</span>
                <span className="text-gray-800">{member.membershipType}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-32 text-gray-600">Tanggal Registrasi:</span>
                <span className="text-gray-800">{new Date(member.createdAt).toLocaleDateString('id-ID')}</span>
              </div>
              {member.code && (
                <div className="flex">
                  <span className="font-medium w-32 text-gray-600">Kode Member:</span>
                  <span className="text-gray-800">{member.code}</span>
                </div>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Ringkasan Pembelanjaan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700">Total Transaksi</p>
                <p className="text-xl font-bold text-blue-900">{totalTransactions}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <p className="text-sm text-green-700">Total Pembelian</p>
                <p className="text-xl font-bold text-green-900">Rp {totalSpent.toLocaleString()}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <p className="text-sm text-purple-700">Rata-rata Transaksi</p>
                <p className="text-xl font-bold text-purple-900">Rp {Math.round(avgTransaction).toLocaleString()}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <p className="text-sm text-yellow-700">Transaksi Lunas</p>
                <p className="text-xl font-bold text-yellow-900">{paidTransactions}/{totalTransactions}</p>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Riwayat Transaksi</h2>
            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">No. Invoice</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Tanggal</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Total</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Pembayaran</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction, index) => (
                      <tr key={transaction.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-800">{transaction.invoiceNumber}</td>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-800">{new Date(transaction.date).toLocaleDateString('id-ID')}</td>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-800">Rp {transaction.total.toLocaleString()}</td>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-800">{transaction.paymentMethod} - Rp {transaction.payment.toLocaleString()}</td>
                        <td className="border border-gray-300 px-4 py-2 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.status === 'PAID'
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'UNPAID'
                              ? 'bg-red-100 text-red-800'
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
            ) : (
              <div className="text-center py-8 text-gray-500">
                Tidak ada riwayat transaksi untuk member ini.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-300 pt-4 text-center text-sm text-gray-500">
            <p>Dicetak pada: {new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberSpendingReportPreview;