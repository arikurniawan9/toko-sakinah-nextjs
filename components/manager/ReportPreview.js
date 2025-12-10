'use client';

import { useEffect, useState } from 'react';
import { Printer, FileText, ShoppingCart, TrendingUp, Package, X } from 'lucide-react';

const ReportPreview = ({ 
  isOpen, 
  onClose, 
  storeId, 
  reportType, 
  dateRange, 
  stores 
}) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fungsi untuk mengambil data laporan berdasarkan tipe
  const fetchReportData = async () => {
    if (!isOpen || !storeId || !reportType) return;

    setLoading(true);
    setError(null);

    try {
      // Buat parameter URL
      const params = new URLSearchParams({
        storeId,
        startDate: dateRange.start,
        endDate: dateRange.end
      });

      let apiUrl = '';
      switch(reportType) {
        case 'sales':
          apiUrl = `/api/reports/sales/print?${params.toString()}`;
          break;
        case 'daily':
          apiUrl = `/api/reports/daily/print?${params.toString()}`;
          break;
        case 'inventory':
          apiUrl = `/api/reports/inventory/print?${params.toString()}`;
          break;
        case 'summary':
          apiUrl = `/api/reports/summary/print?${params.toString()}`;
          break;
        default:
          throw new Error('Jenis laporan tidak dikenali');
      }

      // Ambil data laporan sebagai HTML
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Gagal mengambil data laporan');
      }

      const htmlContent = await response.text();
      setReportData(htmlContent);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReportData();
    } else {
      setReportData(null);
    }
  }, [isOpen, storeId, reportType, dateRange]);

  // Format tanggal untuk tampilan
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Dapatkan nama toko dari ID
  const getStoreName = (id) => {
    const store = stores.find(s => s.id === id);
    return store ? store.name : 'Toko Tidak Dikenal';
  };

  // Render preview laporan
  const renderReportPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 p-4">
          <FileText className="h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-red-600 mb-2">Gagal Memuat Laporan</h3>
          <p className="text-gray-600 dark:text-gray-400 text-center">{error}</p>
        </div>
      );
    }

    if (!reportData) {
      return (
        <div className="flex flex-col items-center justify-center h-64 p-4">
          <FileText className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Pilih Parameter Laporan</h3>
          <p className="text-gray-500 text-center">
            Laporan akan muncul di sini setelah Anda memilih toko dan jenis laporan
          </p>
        </div>
      );
    }

    // Tampilkan laporan dalam iframe untuk isolasi
    return (
      <div className="w-full h-[70vh] overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <iframe
          srcDoc={reportData}
          title="Preview Laporan"
          className="w-full h-full"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    );
  };

  // Dapatkan nama jenis laporan
  const getReportTypeName = (type) => {
    switch(type) {
      case 'sales': return 'Laporan Penjualan';
      case 'daily': return 'Laporan Harian';
      case 'inventory': return 'Laporan Inventaris';
      case 'summary': return 'Ringkasan Laporan';
      default: return 'Laporan';
    }
  };

  // Fungsi untuk mencetak laporan
  const handlePrint = () => {
    const iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.contentWindow.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {getReportTypeName(reportType)}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getStoreName(storeId)} • {dateRange.start && dateRange.end ? 
                  `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}` : 
                  'Seluruh Periode'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 p-4 overflow-auto">
          {renderReportPreview()}
        </div>

        {/* Footer/Action Buttons */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {reportData ? 'Preview siap dicetak' : 'Harap lengkapi parameter laporan'}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              disabled={!reportData}
              className={`flex items-center px-4 py-2 rounded-lg text-white transition-colors ${
                reportData 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <Printer className="h-4 w-4 mr-2" />
              Cetak
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPreview;