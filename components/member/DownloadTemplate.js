// components/member/DownloadTemplate.js
import { Download } from 'lucide-react';

export default function DownloadTemplate({ darkMode }) {
  const downloadCSVTemplate = () => {
    // Template data untuk member
    const headers = ['Nama', 'Telepon', 'Alamat', 'Tipe Keanggotaan', 'Diskon'];
    const sampleData = [
      ['Budi Santoso', '081234567890', 'Jl. Merdeka No. 123', 'Gold', '10'],
      ['Siti Aminah', '082345678901', 'Jl. Sudirman No. 45', 'Silver', '5']
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
    link.setAttribute('download', 'template_member.csv');
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