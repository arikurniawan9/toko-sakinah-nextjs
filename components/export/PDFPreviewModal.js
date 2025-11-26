import { useState, useEffect, useRef } from 'react';
import { X, Printer, Download, FileText } from 'lucide-react';
import ReactToPrint from 'react-to-print';

const PDFPreviewModal = ({ isOpen, onClose, data, title, darkMode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const componentRef = useRef();

  // State untuk menyimpan data yang akan ditampilkan
  const [previewData, setPreviewData] = useState([]);

  // Generate preview data when data changes
  useEffect(() => {
    if (data && Array.isArray(data)) {
      setPreviewData(data);
    }
  }, [data]);

  // Handler untuk download PDF
  const handleDownloadPDF = async () => {
    setIsLoading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();

      // Judul
      doc.setFontSize(18);
      doc.text(title || 'Pratinjau Data', 14, 20);

      // Tanggal
      doc.setFontSize(12);
      doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 30);

      // Data tabel - ambil field dari data pertama sebagai header jika ada data
      if (previewData.length > 0) {
        // Ambil header dari kunci objek pertama
        const headers = Object.keys(previewData[0]);
        
        // Format header untuk tampilan lebih bagus
        const tableColumn = headers.map(header => 
          header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
        );

        // Siapkan data baris
        const tableRows = previewData.map(item => 
          Object.values(item).map(value => 
            typeof value === 'object' && value !== null ? 
              JSON.stringify(value) : 
              String(value)
          )
        );

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 40,
          styles: {
            fontSize: 8,
            cellPadding: 3
          },
          headStyles: {
            fillColor: [100, 100, 100],
            textColor: [255, 255, 255]
          },
          bodyStyles: {
            textColor: [0, 0, 0]
          },
          alternateRowStyles: {
            fillColor: [240, 240, 240]
          }
        });
      } else {
        // Jika tidak ada data, tampilkan pesan
        doc.text('Tidak ada data untuk ditampilkan', 14, 40);
      }

      const fileName = `${title || 'data'}-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Terjadi kesalahan saat membuat PDF: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-[100] inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} ${darkMode ? 'border-gray-700' : 'border-gray-200'} border`}>
          <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${darkMode ? 'bg-blue-900' : 'bg-blue-100'} sm:mx-0 sm:h-10 sm:w-10`}>
                <FileText className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className={`text-lg leading-6 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Pratinjau {title || 'Data'}
                </h3>
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className={`text-md font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Tabel {title || 'Data'}
                      </h4>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Pratinjau data sebelum dicetak atau diunduh
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <ReactToPrint
                        trigger={() => (
                          <button
                            disabled={isLoading}
                            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50`}
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            Cetak
                          </button>
                        )}
                        content={() => componentRef.current}
                        documentTitle={`${title || 'data'}-${new Date().toISOString().slice(0, 10)}`}
                        pageStyle={`
                          @page {
                            size: A4;
                            margin: 1cm;
                          }
                          @media print {
                            body {
                              -webkit-print-color-adjust: exact;
                              print-color-adjust: exact;
                            }
                          }
                        `}
                      />
                      <button
                        onClick={handleDownloadPDF}
                        disabled={isLoading}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50`}
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Memproses...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            Unduh PDF
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className={`border rounded-lg overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <h5 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title || 'Data'}</h5>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
                    </div>
                    <div className="overflow-x-auto" ref={componentRef}>
                      <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                          <tr>
                            {previewData.length > 0 && Object.keys(previewData[0]).map((key, index) => (
                              <th 
                                key={index} 
                                scope="col" 
                                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}
                              >
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                          {previewData.length === 0 ? (
                            <tr>
                              <td 
                                colSpan={previewData.length > 0 ? Object.keys(previewData[0]).length : 1} 
                                className={`px-6 py-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                              >
                                Tidak ada data untuk ditampilkan
                              </td>
                            </tr>
                          ) : (
                            previewData.map((item, index) => (
                              <tr key={index} className={index % 2 === 0 ? (darkMode ? 'bg-gray-800' : 'bg-white') : (darkMode ? 'bg-gray-750' : 'bg-gray-50')}>
                                {Object.values(item).map((value, cellIndex) => (
                                  <td 
                                    key={cellIndex} 
                                    className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}
                                  >
                                    {typeof value === 'object' && value !== null ? 
                                      JSON.stringify(value) : 
                                      String(value)}
                                  </td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`mt-3 w-full inline-flex justify-center rounded-md border px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${
                darkMode
                  ? 'border-gray-600 bg-gray-600 text-white hover:bg-gray-500 focus:ring-gray-600'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-300'
              }`}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewModal;