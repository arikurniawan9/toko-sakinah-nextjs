'use client';

import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useDarkMode } from '@/components/DarkModeContext';
import { useTheme } from '@/components/ThemeContext';
import { Settings } from 'lucide-react';

export default function PengaturanIndex() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const { themeColor } = useTheme();

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pengaturan</h1>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Kelola pengaturan sistem dan toko Anda
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pengaturan Toko */}
          <a
            href="/admin/pengaturan/toko"
            className={`block p-6 rounded-xl shadow border-2 border-transparent transition-colors ${
              darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
            }`}
            style={{'--hover-border-color': themeColor}}
            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--hover-border-color)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div className={`p-3 rounded-lg w-12 h-12 flex items-center justify-center`} style={{backgroundColor: themeColor + '20', color: themeColor}}>
              <Settings className="w-6 h-6" />
            </div>
            <h3 className={`mt-4 text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Pengaturan Toko
            </h3>
            <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Atur informasi dan pengaturan dasar toko Anda
            </p>
          </a>

          {/* Pengaturan Sistem */}
          <a
            href="/admin/pengaturan/sistem"
            className={`block p-6 rounded-xl shadow border-2 border-transparent transition-colors ${
              darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
            }`}
            style={{'--hover-border-color': themeColor}}
            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--hover-border-color)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div className={`p-3 rounded-lg w-12 h-12 flex items-center justify-center`} style={{backgroundColor: themeColor + '20', color: themeColor}}>
              <Settings className="w-6 h-6" />
            </div>
            <h3 className={`mt-4 text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Pengaturan Sistem
            </h3>
            <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Pengaturan terkait sistem aplikasi
            </p>
          </a>

          {/* Pengaturan Keamanan */}
          <a
            href="/admin/pengaturan/keamanan"
            className={`block p-6 rounded-xl shadow border-2 border-transparent transition-colors ${
              darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
            }`}
            style={{'--hover-border-color': themeColor}}
            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--hover-border-color)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div className={`p-3 rounded-lg w-12 h-12 flex items-center justify-center`} style={{backgroundColor: themeColor + '20', color: themeColor}}>
               <Settings className="w-6 h-6" />
            </div>
            <h3 className={`mt-4 text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Pengaturan Keamanan
            </h3>
            <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Pengaturan terkait keamanan dan akses
            </p>
          </a>
        </div>
      </main>
    </ProtectedRoute>
  );
}