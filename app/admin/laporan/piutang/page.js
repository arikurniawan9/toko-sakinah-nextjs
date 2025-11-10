// app/admin/laporan/piutang/page.js
'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useDarkMode } from '@/components/DarkModeContext';
import { useReceivableTable } from '@/lib/hooks/useReceivableTable';
import ReceivableToolbar from '@/components/laporan/piutang/ReceivableToolbar';
import ReceivableTable from '@/components/laporan/piutang/ReceivableTable';
import Pagination from '@/components/produk/Pagination'; // Re-using pagination component

export default function ReceivablesPage() {
  const { darkMode } = useDarkMode();
  const {
    receivables,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    totalReceivables,
  } = useReceivableTable();

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <main className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${darkMode ? 'bg-gray-900 text-gray-100' : ''}`}>
        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Laporan Piutang
        </h1>

        <div className={`rounded-xl shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <div className="p-4 sm:p-6">
            <ReceivableToolbar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              darkMode={darkMode}
            />

            {error && (
              <div className={`my-4 p-4 ${darkMode ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border border-red-200 text-red-700'} rounded-md`}>
                {error}
              </div>
            )}

            <ReceivableTable
              receivables={receivables}
              loading={loading}
              darkMode={darkMode}
            />
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalProducts={totalReceivables} // Prop name is totalProducts, but we pass totalReceivables
            darkMode={darkMode}
          />
        </div>
      </main>
    </ProtectedRoute>
  );
}
