'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../../../../components/ProtectedRoute';
import { useUserTheme } from '../../../../../components/UserThemeContext';
import { useRouter } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';

const formatNumber = (value) => {
  return new Intl.NumberFormat('id-ID').format(value);
};

export default function PrintDistributionInvoice({ params }) {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const router = useRouter();
  const printRef = useRef();
  
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDistribution = async () => {
      try {
        setLoading(true);
        setError('');

        // Use the grouped API to get all items in the same distribution batch
        const response = await fetch(`/api/warehouse/distribution/grouped?id=${params.id}`);

        if (!response.ok) {
          throw new Error('Gagal mengambil data distribusi');
        }

        const data = await response.json();
        setDistribution(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching distribution:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchDistribution();
    }
  }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="WAREHOUSE">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredRole="WAREHOUSE">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!distribution) {
    return (
      <ProtectedRoute requiredRole="WAREHOUSE">
        <div className="min-h-screen flex items-center justify-center">
          <div>Distribusi tidak ditemukan</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="WAREHOUSE">
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Print Controls - Only visible on screen, not in print */}
          <div className="mb-4 print:hidden flex justify-between items-center">
            <button
              onClick={() => router.back()}
              className="flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-gray-600 hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Cetak Faktur
            </button>
          </div>

          {/* Invoice Content */}
          <div
            ref={printRef}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 print:p-0 print:shadow-none print:bg-white print:rounded-none print:shadow-none print-content"
          >
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6 print:pb-4 print:mb-4 print:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FAKTUR DISTRIBUSI PRODUK</h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">No. Faktur: {distribution.invoiceNumber || distribution.id}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">GUDANG PUSAT</div>
                  <p className="text-gray-600 dark:text-gray-400">Jl. Contoh Alamat Gudang</p>
                  <p className="text-gray-600 dark:text-gray-400">Telp: (021) 12345678</p>
                </div>
              </div>
            </div>

            {/* Customer and Invoice Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 print:mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Kepada:</h3>
                <p className="text-gray-900 dark:text-white font-medium">{distribution.store?.name || 'N/A'}</p>
                <p className="text-gray-600 dark:text-gray-400">{distribution.store?.code || 'N/A'}</p>
              </div>
              <div className="text-right md:text-right">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-gray-600 dark:text-gray-400">Tanggal:</div>
                  <div className="text-gray-900 dark:text-white">
                    {distribution.distributedAt ? new Date(distribution.distributedAt).toLocaleDateString('id-ID') : 'N/A'}
                  </div>
                  
                  <div className="text-gray-600 dark:text-gray-400">Status:</div>
                  <div className="text-gray-900 dark:text-white">
                    {distribution.status === 'PENDING_ACCEPTANCE' ? 'Menunggu Konfirmasi' :
                     distribution.status === 'ACCEPTED' ? 'Diterima' :
                     distribution.status === 'DELIVERED' ? 'Dikirim' :
                     distribution.status === 'REJECTED' ? 'Ditolak' : distribution.status}
                  </div>
                  
                  <div className="text-gray-600 dark:text-gray-400">Dikirim Oleh:</div>
                  <div className="text-gray-900 dark:text-white">
                    {distribution.distributedByUser?.name || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6 print:mb-6">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Produk</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jumlah</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Harga</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {distribution.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.product?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{formatNumber(item.quantity)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{formatNumber(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{formatNumber(item.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-700 font-semibold">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">TOTAL</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                      {distribution.items ? 
                        formatNumber(distribution.items.reduce((sum, item) => sum + item.totalAmount, 0)) 
                        : '0'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Notes */}
            {distribution.notes && (
              <div className="mb-6 print:mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Catatan:</h3>
                <p className="text-gray-900 dark:text-white">{distribution.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 print:pt-4 print:border-gray-700">
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Dibuat oleh:</p>
                  <p className="text-gray-900 dark:text-white font-medium mt-4">{distribution.distributedByUser?.name || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 dark:text-gray-400">Mengetahui:</p>
                  <p className="text-gray-900 dark:text-white font-medium mt-4">________________</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0.5in;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          button, .print\\:hidden, .no-print {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:bg-gray-100, .print\\:dark\\:bg-gray-900 {
            background-color: white !important;
          }
          .print\\:shadow-lg {
            box-shadow: none !important;
          }
          .print\\:rounded-lg {
            border-radius: 0 !important;
          }
          .print-content {
            display: block !important;
            visibility: visible !important;
          }
        }
      `}</style>
    </ProtectedRoute>
  );
}