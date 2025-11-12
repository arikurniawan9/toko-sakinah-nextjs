// components/supplier/DownloadTemplate.js
import { Download } from 'lucide-react';

export default function DownloadTemplate({ darkMode }) {
  const downloadCSVTemplate = () => {
    // Template data untuk supplier
    const headers = ['Nama', 'Alamat', 'Telepon', 'Email'];
    const sampleData = [
      ['PT. Maju Jaya', 'Jl. Sudirman No. 123', '021-12345678', 'info@majujaya.com'],
      ['CV. Sejahtera Abadi', 'Jl. Gatot Subroto No. 45', '021-87654321', 'cs@sejahteraabadi.com']
    ];

    // Buat konten CSV
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');

    // Buat file dan trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_supplier.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={downloadCSVTemplate}
      className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors ${
        darkMode 
          ? 'bg-gray-700 text-white hover:bg-gray-600' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <Download className="h-5 w-5" />
      <span>Template</span>
    </button>
  );
}