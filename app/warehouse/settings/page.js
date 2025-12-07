'use client';

import { useUserTheme } from '@/components/UserThemeContext';
import Breadcrumb from '@/components/Breadcrumb';

export default function WarehouseSettingsPage() {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  return (
    <main className="flex-1 p-6">
      <Breadcrumb
        items={[
            { title: 'Dashboard Gudang', href: '/warehouse' },
            { title: 'Pengaturan', href: '/warehouse/settings' }
        ]}
        darkMode={darkMode}
      />
      <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Pengaturan Gudang
      </h1>
      
      <div className={`p-6 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Halaman untuk pengaturan yang spesifik untuk modul gudang akan ditampilkan di sini.
        </p>
      </div>
    </main>
  );
}
