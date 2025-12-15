// components/pelayan/PelayanHistory.js
'use client';

import { useState, useEffect } from 'react';
import { Clock, Package, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';

const PelayanHistory = ({ darkMode, attendantId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (attendantId) {
      fetchHistory();
    }
  }, [attendantId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pelayan/history?attendantId=${attendantId}`);
      if (!response.ok) {
        throw new Error('Gagal mengambil histori');
      }
      const data = await response.json();
      setHistory(data.history || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'completed_by_cashier':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'suspended':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed_by_cashier':
        return 'Selesai oleh Kasir';
      case 'suspended':
        return 'Ditangguhkan';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return 'Status Tidak Dikenal';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed_by_cashier':
        return darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800';
      case 'suspended':
        return darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800';
      default:
        return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><LoadingSpinner /></div>;
  }

  if (error) {
    return (
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-100 text-red-700'}`}>
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Histori Daftar Belanja
      </h3>
      
      {history.length === 0 ? (
        <div className={`text-center py-8 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Belum ada histori daftar belanja</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.slice(0, 10).map((item, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(item.status)}
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.note || `Daftar Belanja #${item.id}`}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.itemsCount} item • {new Date(item.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(item.status)}`}>
                  {getStatusText(item.status)}
                </span>
              </div>
              
              {item.completedAt && (
                <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Selesai: {new Date(item.completedAt).toLocaleString('id-ID')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PelayanHistory;