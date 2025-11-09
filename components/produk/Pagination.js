// components/produk/Pagination.js
'use client';

export default function Pagination({ 
  currentPage, 
  totalPages, 
  setCurrentPage, 
  itemsPerPage, 
  totalProducts, 
  darkMode 
}) {
  const pageNumbers = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    if (currentPage <= 3) {
      pageNumbers.push(1, 2, 3, 4, 5);
    } else if (currentPage >= totalPages - 2) {
      pageNumbers.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pageNumbers.push(currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2);
    }
  }

  return (
    <div className={`px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pastel-purple-200'} border-t sm:px-6 mt-4 rounded-b-lg`}>
      <div className="sm:hidden w-full flex justify-between">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${darkMode ? (currentPage === 1 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-800 text-gray-300 hover:bg-gray-700') : (currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-pastel-purple-700 hover:bg-pastel-purple-50')}`}>
          Sebelumnya
        </button>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${darkMode ? (currentPage === totalPages ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-800 text-gray-300 hover:bg-gray-700') : (currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-pastel-purple-700 hover:bg-pastel-purple-50')}`}>
          Berikutnya
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-col md:flex md:flex-row md:items-center md:justify-between gap-4 w-full">
        <div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-pastel-purple-700'}`}>
            Menampilkan <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> ke{' '}
            <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalProducts)}</span> dari <span className="font-medium">{totalProducts}</span> hasil
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
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
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${darkMode ? (currentPage === totalPages ? 'text-gray-600 bg-gray-700 cursor-not-allowed' : 'text-gray-300 bg-gray-800 hover:bg-gray-700') : (currentPage === totalPages ? 'text-gray-400 bg-white cursor-not-allowed' : 'text-pastel-purple-600 bg-white hover:bg-pastel-purple-50')}`}>
              <span className="sr-only">Next</span>
              &rarr;
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
