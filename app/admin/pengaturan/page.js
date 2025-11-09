'use client';

import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../components/ProtectedRoute';
import Sidebar from '../../components/Sidebar';
import { useDarkMode } from '../../components/DarkModeContext';

export default function PengaturanIndex() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <Sidebar>
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
              className={`block p-6 rounded-xl shadow border-2 border-transparent hover:border-pastel-purple-500 transition-colors ${
                darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className={`p-3 rounded-lg ${
                darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'
              } w-12 h-12 flex items-center justify-center`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className={`mt-4 text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Pengaturan Toko
              </h3>
              <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Atur informasi dan pengaturan dasar toko Anda
              </p>
            </a>

            {/* Pengaturan Sistem */}
            <div className={`p-6 rounded-xl shadow ${
              darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <div className={`p-3 rounded-lg ${
                darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
              } w-12 h-12 flex items-center justify-center`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className={`mt-4 text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Pengaturan Sistem
              </h3>
              <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Pengaturan sistem akan segera tersedia
              </p>
            </div>

            {/* Pengaturan Keamanan */}
            <div className={`p-6 rounded-xl shadow ${
              darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <div className={`p-3 rounded-lg ${
                darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
              } w-12 h-12 flex items-center justify-center`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className={`mt-4 text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Pengaturan Keamanan
              </h3>
              <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Pengaturan keamanan akan segera tersedia
              </p>
            </div>
          </div>
        </main>
      </Sidebar>
    </ProtectedRoute>
  );
}