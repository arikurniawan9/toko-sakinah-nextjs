import React, { useState, useMemo } from 'react';

const RecentActivityTable = ({ recentActivitiesData, darkMode, loading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // You can make this configurable
  const [searchTerm, setSearchTerm] = useState('');

  // Use useMemo for performance optimization
  const filteredActivities = useMemo(() => {
    if (!recentActivitiesData || !Array.isArray(recentActivitiesData)) {
      return [];
    }
    return recentActivitiesData.filter(activity => {
      const cashierName = activity.cashier?.name || ''; // Use optional chaining and default to empty string
      const invoiceNum = activity.invoiceNumber || ''; // Use optional chaining and default to empty string
      return cashierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             invoiceNum.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [recentActivitiesData, searchTerm]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredActivities.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Render skeleton while loading
  if (loading) {
    return (
      <div className={`rounded-xl shadow ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
        <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-6 p-6`}>Log Aktivitas Kasir</h2>
        <div className="p-6">
          <div className="mb-4 flex justify-between items-center">
            <div className={`p-2 rounded-md border w-64 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-300'} animate-pulse`}></div>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Waktu
                </th>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Kasir
                </th>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  No. Invoice
                </th>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Jumlah
                </th>
              </tr>
            </thead>
            <tbody className={darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}>
              {[...Array(5)].map((_, index) => (
                <tr key={index} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'} animate-pulse`}>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'} animate-pulse`}>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} animate-pulse`}>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'} animate-pulse`}>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Log Aktivitas Kasir</h2>
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Cari transaksi atau kasir..."
          className={`p-2 rounded-md border ${
            darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
          }`}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page on search
          }}
        />
      </div>
      <div className={`rounded-xl shadow ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border overflow-hidden`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
            <tr>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Waktu
              </th>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Kasir
              </th>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                No. Invoice
              </th>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Jumlah
              </th>
            </tr>
          </thead>
          <tbody className={darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="4" className={`px-6 py-4 text-center text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Tidak ada aktivitas terbaru.
                </td>
              </tr>
            ) : (
              currentItems.map((activity) => (
                <tr key={activity.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {new Date(activity.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {activity.cashier?.name || 'N/A'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    #{activity.invoiceNumber}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Rp {activity.total ? activity.total.toLocaleString('id-ID') : '0'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      {filteredActivities.length > itemsPerPage && (
        <div className="flex justify-center mt-4">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              } text-sm font-medium`}
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => paginate(index + 1)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  currentPage === index + 1
                    ? 'z-10 ' + (darkMode ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-indigo-50 border-indigo-500 text-indigo-600')
                    : darkMode
                      ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              } text-sm font-medium`}
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default RecentActivityTable;
