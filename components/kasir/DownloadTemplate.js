// components/kasir/DownloadTemplate.js
import { Download } from 'lucide-react';

export default function DownloadTemplate({ darkMode }) {
  const downloadCSVTemplate = () => {
    // Template data untuk kasir
    const headers = ['Nama', 'Username', 'Password', 'Role'];
    const sampleData = [
      ['Budi Santoso', 'budi', 'password123', 'CASHIER'],
      ['Siti Aminah', 'siti', 'password123', 'CASHIER']
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
    link.setAttribute('download', 'template_kasir.csv');
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