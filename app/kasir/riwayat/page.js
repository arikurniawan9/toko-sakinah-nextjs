// app/kasir/riwayat/page.js
'use client';

import Sidebar from '../../../components/Sidebar';
import { useDarkMode } from '../../../components/DarkModeContext';
import { History, Home } from 'lucide-react';

export default function RiwayatKasirPage() {
  const { darkMode } = useDarkMode();

  return (
    <Sidebar>
      <main className={`flex-1 p-4 min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <History className={`h-8 w-8 mr-3 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Riwayat Transaksi Kasir</h1>
                <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Daftar transaksi yang telah Anda proses.</p>
              </div>
            </div>
            <div className="group relative">
              <button
                onClick={() => window.location.href = '/kasir'}
                className={`p-2 rounded-md ${
                  darkMode
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                } transition-colors`}
                title="Dashboard"
              >
                <Home size={20} />
              </button>
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs py-1 px-2 rounded">
                Dashboard
              </span>
            </div>
          </div>

          <div className={`p-8 rounded-xl shadow border text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Halaman ini sedang dalam pengembangan. Fitur untuk melihat riwayat transaksi kasir akan segera tersedia di sini.
            </p>
          </div>
        </div>
      </main>
    </Sidebar>
  );
}
