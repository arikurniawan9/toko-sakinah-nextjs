// app/pelayan/statistik/history/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUserTheme } from '../../../../components/UserThemeContext';
import { Search, Calendar, User, Package, Clock, CheckCircle, XCircle, AlertCircle, BarChart3, History, TrendingUp } from 'lucide-react';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import PelayanHistory from '../../../../components/pelayan/PelayanHistory';

export default function PelayanHistoryPage() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  if (!session) {
    return <LoadingSpinner />;
  }

  const attendantId = session.user.id;

  return (
    <main className={`flex-1 p-4 min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <History className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-3xl font-bold">Histori Transaksi Pelayan</h1>
          </div>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Lihat dan kelola riwayat transaksi yang Anda tangani
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`p-5 rounded-2xl shadow-lg border ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Transaksi</h3>
                <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  0
                </p>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                <Package className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl shadow-lg border ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Aktif</h3>
                <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  0
                </p>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
                <Clock className={`h-6 w-6 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              </div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl shadow-lg border ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Selesai</h3>
                <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  0
                </p>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <CheckCircle className={`h-6 w-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
            </div>
          </div>

          <div className={`p-5 rounded-2xl shadow-lg border ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pelanggan</h3>
                <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  0
                </p>
              </div>
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                <User className={`h-6 w-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* History Content */}
        <div className={`rounded-2xl shadow-xl ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} border overflow-hidden`}>
          <div className="p-6">
            <PelayanHistory darkMode={darkMode} attendantId={attendantId} />
          </div>
        </div>
      </div>
    </main>
  );
}