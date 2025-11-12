'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useDarkMode } from '@/components/DarkModeContext';

export default function KeamananPage() {
  const { darkMode } = useDarkMode();

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Pengaturan Keamanan
            </h1>
            <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Pengaturan keamanan akan segera tersedia.
            </p>
          </div>
          <Link href="/admin/pengaturan">
            <button className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>
              <ArrowLeft size={16} />
              Kembali
            </button>
          </Link>
        </div>

        <div className={`p-6 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Content for security settings will go here */}
          <p>Coming soon...</p>
        </div>
      </main>
    </ProtectedRoute>
  );
}
