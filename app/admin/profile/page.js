// app/admin/profile/page.js
'use client';

import ProtectedRoute from '../../../components/ProtectedRoute';
import Sidebar from '../../../components/Sidebar';
import { useDarkMode } from '../../../components/DarkModeContext';

export default function AdminProfileSettings() {
  const { darkMode } = useDarkMode();

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <Sidebar>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <h1 className={`${darkMode ? 'text-white' : 'text-gray-900'} text-2xl font-bold mb-6`}>
            Pengaturan Profil Admin
          </h1>
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow rounded-lg p-6`}>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Ini adalah halaman pengaturan profil. Di sini Anda bisa mengelola informasi akun Anda.
            </p>
            {/* Form atau konten pengaturan profil akan ditambahkan di sini */}
          </div>
        </div>
      </Sidebar>
    </ProtectedRoute>
  );
}
