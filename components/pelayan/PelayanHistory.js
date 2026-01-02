// components/pelayan/PelayanHistory.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Search, Calendar, User, Package, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

const PelayanHistory = ({ darkMode, attendantId }) => {
  const { data: session } = useSession();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchHistory = useCallback(async () => {
    if (!attendantId || !session?.user?.storeId) return;

    setLoading(true);
    setError(null);
    try {
      let url = `/api/suspended-sales?attendantId=${attendantId}`;
      if (session.user.storeId) {
        url += `&storeId=${session.user.storeId}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Gagal memuat histori transaksi');
      }
      const data = await response.json();
      setHistory(data.suspendedSales || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  }, [attendantId, session]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Filter data berdasarkan pencarian dan filter
  const filteredHistory = history.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.customerName && item.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDate = !dateFilter || 
      new Date(item.createdAt).toDateString() === new Date(dateFilter).toDateString();
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && !item.isCompleted) ||
      (statusFilter === 'completed' && item.isCompleted);
    
    return matchesSearch && matchesDate && matchesStatus;
  });

  const getStatusColor = (isCompleted) => {
    if (isCompleted) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
  };

  const getStatusIcon = (isCompleted) => {
    if (isCompleted) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-50 text-red-700'}`}>
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama pelanggan..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-600 border-gray-500 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-600 border-gray-500 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          
          <select
            className={`w-full px-4 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-600 border-gray-500 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="completed">Selesai</option>
          </select>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className={`text-center py-12 rounded-xl ${
            darkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className={`text-lg font-medium ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Tidak ada histori transaksi
            </h3>
            <p className={`mt-1 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {searchTerm || dateFilter || statusFilter !== 'all' 
                ? 'Tidak ditemukan histori dengan filter yang dipilih' 
                : 'Belum ada transaksi yang disimpan'}
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div 
              key={item.id} 
              className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className={`font-semibold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {item.name}
                    </h3>
                    <span className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.isCompleted)}`}>
                      {getStatusIcon(item.isCompleted)}
                      <span className="ml-1">{item.isCompleted ? 'Selesai' : 'Aktif'}</span>
                    </span>
                  </div>
                  
                  {item.customerName && (
                    <div className="flex items-center text-sm mb-1">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                        {item.customerName}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm mb-2">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  
                  {item.notes && (
                    <div className={`text-sm p-2 rounded ${
                      darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <span className="font-medium">Catatan:</span> {item.notes}
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {item.items?.length || 0} item
                  </div>
                  <div className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {item.totalItems || 0} total
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
                <button 
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    darkMode 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                  onClick={() => {
                    // Implementasi untuk melanjutkan penjualan
                    console.log('Resume sale:', item);
                  }}
                >
                  Lanjutkan
                </button>
                <button 
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    darkMode 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  onClick={() => {
                    // Implementasi untuk menghapus penjualan
                    console.log('Delete sale:', item);
                  }}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PelayanHistory;