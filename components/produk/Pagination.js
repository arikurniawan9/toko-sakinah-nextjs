// components/produk/Pagination.js
'use client';

export default function Pagination({ 
  currentPage, 
  totalPages, 
  setCurrentPage, 
  itemsPerPage, 
  totalItems, // Renamed from totalProducts
  darkMode 
}) {
  const pageNumbers = [];
  const safeTotalPages = totalPages && !isNaN(totalPages) ? totalPages : 0;

  if (safeTotalPages <= 5) {
    for (let i = 1; i <= safeTotalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    if (currentPage <= 3) {
      pageNumbers.push(1, 2, 3, 4, 5);
    } else if (currentPage >= safeTotalPages - 2) {
      pageNumbers.push(safeTotalPages - 4, safeTotalPages - 3, safeTotalPages - 2, safeTotalPages - 1, safeTotalPages);
    } else {
      pageNumbers.push(currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2);
    }
  }

  const startItem = totalItems > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0;
  const endItem = totalItems > 0 ? Math.min(currentPage * itemsPerPage, totalItems) : 0;

  return (
    <div className={`px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pastel-purple-200'} border-t sm:px-6 mt-4 rounded-b-lg`}>
      <div className="sm:hidden w-full flex justify-between">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1 || safeTotalPages === 0}
          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${darkMode ? (currentPage === 1 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-800 text-gray-300 hover:bg-gray-700') : (currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-pastel-purple-700 hover:bg-pastel-purple-50')}`}>
          Sebelumnya
        </button>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, safeTotalPages))}
          disabled={currentPage === safeTotalPages || safeTotalPages === 0}
          className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${darkMode ? (currentPage === safeTotalPages ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-800 text-gray-300 hover:bg-gray-700') : (currentPage === safeTotalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-pastel-purple-700 hover:bg-pastel-purple-50')}`}>
          Berikutnya
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-col md:flex md:flex-row md:items-center md:justify-between gap-4 w-full">
        <div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-pastel-purple-700'}`}>
            {totalItems > 0 ? (
              <>
                Menampilkan <span className="font-medium">{startItem}</span> ke{' '}
                <span className="font-medium">{endItem}</span> dari <span className="font-medium">{totalItems}</span> hasil
              </>
            ) : (
              '0 hasil'
            )}
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || safeTotalPages === 0}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${darkMode ? (currentPage === 1 ? 'text-gray-600 bg-gray-700 cursor-not-allowed' : 'text-gray-300 bg-gray-800 hover:bg-gray-700') : (currentPage === 1 ? 'text-gray-400 bg-white cursor-not-allowed' : 'text-pastel-purple-600 bg-white hover:bg-pastel-purple-50')}`}>
              <span className="sr-only">Previous</span>
              &larr;
            </button>
            {pageNumbers.map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum ? (darkMode ? 'z-10 bg-pastel-purple-600 border-pastel-purple-600 text-white' : 'z-10 bg-pastel-purple-500 border-pastel-purple-500 text-white') : (darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-pastel-purple-300 text-pastel-purple-600 hover:bg-pastel-purple-50')}`}>
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, safeTotalPages))}
              disabled={currentPage === safeTotalPages || safeTotalPages === 0}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${darkMode ? (currentPage === safeTotalPages ? 'text-gray-600 bg-gray-700 cursor-not-allowed' : 'text-gray-300 bg-gray-800 hover:bg-gray-700') : (currentPage === safeTotalPages ? 'text-gray-400 bg-white cursor-not-allowed' : 'text-pastel-purple-600 bg-white hover:bg-pastel-purple-50')}`}>
              <span className="sr-only">Next</span>
              &rarr;
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
