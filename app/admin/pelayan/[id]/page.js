'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useDarkMode } from '../../../../components/DarkModeContext';
import Link from 'next/link';
import { ArrowLeft, User, Phone, MapPin, TrendingUp, Calendar } from 'lucide-react';

// A simple component for displaying a piece of profile info
const InfoPill = ({ icon: Icon, label, value, darkMode }) => (
  <div className={`flex items-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
    <Icon className={`h-5 w-5 mr-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
    <div>
      <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
      <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{value || '-'}</p>
    </div>
  </div>
);

export default function PelayanDetailPage() {
  const { id } = useParams();
  const { darkMode } = useDarkMode();
  const [pelayan, setPelayan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for transaction table
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (id) {
      const fetchPelayanDetails = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/pelayan/${id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch pelayan details');
          }
          const data = await response.json();
          setPelayan(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchPelayanDetails();
    }
  }, [id]);

  if (loading) {
    return <div className={`p-8 ${darkMode ? 'text-white' : 'text-black'}`}>Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  if (!pelayan) {
    return <div className={`p-8 ${darkMode ? 'text-white' : 'text-black'}`}>Pelayan not found.</div>;
  }

  // Logic for filtering and paginating transactions
  const filteredTransactions = pelayan.attendantSales.filter(sale => {
    const saleDate = new Date(sale.date).toLocaleDateString('id-ID');
    const memberName = sale.member?.name.toLowerCase() || '';
    return saleDate.includes(searchTerm) || memberName.includes(searchTerm.toLowerCase());
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin/pelayan" className={`flex items-center text-sm font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Pelayan
          </Link>
          <h1 className={`text-3xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{pelayan.name}</h1>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Detail performa dan informasi pelayan.</p>
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="mb-8">
        <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Informasi Profil</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoPill icon={User} label="Gender" value={pelayan.gender} darkMode={darkMode} />
          <InfoPill icon={Phone} label="No. Telepon" value={pelayan.phone} darkMode={darkMode} />
          <InfoPill icon={MapPin} label="Alamat" value={pelayan.address} darkMode={darkMode} />
          <InfoPill icon={Calendar} label="Status" value={pelayan.status} darkMode={darkMode} />
        </div>
      </div>

      {/* Performance Summary */}
      <div className="mb-8">
        <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Ringkasan Performa</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className={`p-6 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'}`}>
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Penjualan Dilayani</h3>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Rp {pelayan.totalSales.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
          <div className={`p-6 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                <User className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Transaksi Dilayani</h3>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {pelayan.attendantSales.length} Transaksi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div>
        <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Riwayat Transaksi</h2>
        <input
          type="text"
          placeholder="Cari berdasarkan tanggal atau nama member..."
          className={`w-full p-2 mb-4 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
        <div className={`rounded-xl shadow overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <table className="min-w-full divide-y divide-gray-200">
            {/* Table Head */}
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Tanggal</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Invoice</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Member</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Total Belanja</th>
              </tr>
            </thead>
            {/* Table Body */}
            <tbody className={darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}>
              {currentTransactions.length > 0 ? currentTransactions.map(sale => (
                <tr key={sale.id}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{new Date(sale.date).toLocaleString('id-ID')}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{sale.invoiceNumber}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{sale.member?.name || 'Non-Member'}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Rp {sale.total.toLocaleString('id-ID')}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className={`px-6 py-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tidak ada transaksi ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            {/* Pagination implementation would go here */}
          </div>
        )}
      </div>
    </main>
  );
}