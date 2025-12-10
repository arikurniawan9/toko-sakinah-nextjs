import { useState, useEffect } from 'react';
import { X, Hash } from 'lucide-react';
import JsBarcode from 'jsbarcode';

export default function ProductBarcodePreview({ 
  isOpen, 
  onClose, 
  product, 
  quantity = 1,
  darkMode = false,
  onPrint
}) {
  const [canvasElements, setCanvasElements] = useState([]);
  const [labelWidth, setLabelWidth] = useState(50);
  const [labelHeight, setLabelHeight] = useState(25);
  const [fontSize, setFontSize] = useState(8);
  const [includeProductName, setIncludeProductName] = useState(false);
  const [includeProductCode, setIncludeProductCode] = useState(true);

  // Generate canvas elements for barcode preview
  useEffect(() => {
    if (!isOpen || !product) return;

    const canvases = [];
    for (let i = 0; i < quantity; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 200; // Lebar canvas dalam pixel
      canvas.height = 100; // Tinggi canvas dalam pixel

      try {
        // Pilih format barcode berdasarkan karakter dalam kode
        let format = 'CODE128'; // Default ke CODE128 karena mendukung semua karakter ASCII

        // Jika kode hanya berisi angka dan panjangnya 13 digit, gunakan EAN-13
        if (/^\d{13}$/.test(product.productCode)) {
          format = 'EAN13';
        }
        // Jika kode hanya berisi angka dan panjangnya 12 digit, gunakan EAN-12 (UPC-A)
        else if (/^\d{12}$/.test(product.productCode)) {
          format = 'EAN12';
        }
        // Jika kode hanya berisi angka dan panjangnya 8 digit, gunakan EAN-8
        else if (/^\d{8}$/.test(product.productCode)) {
          format = 'EAN8';
        }
        // Jika kode hanya berisa angka, gunakan CODE39
        else if (/^\d+$/.test(product.productCode)) {
          format = 'CODE39';
        }
        // Jika kode mengandung karakter alfanumerik dan simbol khusus, tetap gunakan CODE128
        else if (/^[0-9A-Za-z\-\.\$\/\+\%]+$/.test(product.productCode)) {
          format = 'CODE128';
        }

        JsBarcode(canvas, product.productCode, {
          format: format,
          width: 2.5,         // Lebar bar
          height: 40,         // Tinggi barcode dalam px
          displayValue: false, // Kita akan menambahkan teks secara manual
          fontOptions: '',
          fontSize: 12,
          textMargin: 0,
          margin: 0,
          marginWidth: 0,
          marginTop: 0,
          marginBottom: 0,
          marginLeft: 0,
          marginRight: 0,
          background: darkMode ? '#1f2937' : '#ffffff', // Warna background sesuai mode
          lineColor: darkMode ? '#ffffff' : '#000000',  // Warna garis sesuai mode
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }

      canvases.push(canvas);
    }

    setCanvasElements(canvases);
  }, [isOpen, product, quantity, darkMode]);

  if (!isOpen || !product) return null;

  const handlePrint = () => {
    if (onPrint) {
      onPrint({
        labelWidth,
        labelHeight,
        fontSize,
        includeProductName,
        includeProductCode
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen p-0 sm:items-center sm:p-4">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className={`${darkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-gray-500 bg-opacity-75'}`}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`relative inline-block align-bottom w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-0 sm:align-middle sm:max-w-4xl sm:w-full ${darkMode ? 'border-gray-700' : 'border-gray-200'} border`}>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Preview Barcode untuk {product.name}
            </h3>
            <button onClick={onClose} className={`p-1 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-400 hover:bg-gray-200'} transition-colors`}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Lebar Label (mm)
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={labelWidth}
                  onChange={(e) => setLabelWidth(Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-theme-purple-500`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tinggi Label (mm)
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={labelHeight}
                  onChange={(e) => setLabelHeight(Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-theme-purple-500`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Ukuran Font (pt)
                </label>
                <input
                  type="number"
                  min="6"
                  max="16"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-theme-purple-500`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center">
                <input
                  id="includeProductName"
                  type="checkbox"
                  checked={includeProductName}
                  onChange={(e) => setIncludeProductName(e.target.checked)}
                  className={`h-4 w-4 ${
                    darkMode 
                      ? 'text-theme-purple-600 bg-gray-700 border-gray-600 rounded' 
                      : 'text-theme-purple-600 bg-white border-gray-300 rounded'
                  } focus:ring-theme-purple-500`}
                />
                <label htmlFor="includeProductName" className={`ml-2 block text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Sertakan Nama Produk
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="includeProductCode"
                  type="checkbox"
                  checked={includeProductCode}
                  onChange={(e) => setIncludeProductCode(e.target.checked)}
                  className={`h-4 w-4 ${
                    darkMode 
                      ? 'text-theme-purple-600 bg-gray-700 border-gray-600 rounded' 
                      : 'text-theme-purple-600 bg-white border-gray-300 rounded'
                  } focus:ring-theme-purple-500`}
                />
                <label htmlFor="includeProductCode" className={`ml-2 block text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Sertakan Kode Produk
                </label>
              </div>
            </div>

            <div className="mb-6">
              <h4 className={`text-md font-medium mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Preview ({quantity} buah)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-2 border rounded">
                {canvasElements.map((canvas, index) => (
                  <div 
                    key={index} 
                    className={`p-2 border rounded flex flex-col items-center ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    style={{ 
                      width: `${labelWidth}mm`, 
                      height: `${labelHeight}mm`,
                      fontSize: `${fontSize}px`
                    }}
                  >
                    <div className="flex-grow flex items-center justify-center w-full">
                      {includeProductName && (
                        <div className={`text-center mb-1 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {product.name.length > 15 ? 
                            product.name.substring(0, 12) + '...' : 
                            product.name}
                        </div>
                      )}
                      <div className="flex justify-center">
                        <img 
                          src={canvas.toDataURL()} 
                          alt={`Barcode ${product.productCode}`} 
                          className="max-w-full max-h-16 object-contain"
                        />
                      </div>
                    </div>
                    {includeProductCode && (
                      <div className={`text-center text-xs font-medium mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {product.productCode}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`px-4 py-3 sm:flex sm:flex-row-reverse ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <button
              type="button"
              onClick={handlePrint}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm ${
                darkMode ? 'focus:ring-offset-gray-800' : ''
              }`}
            >
              <Hash className="h-5 w-5 mr-2" />
              Cetak PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`mt-3 w-full inline-flex justify-center rounded-md border px-4 py-2 text-base font-medium shadow-sm sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${
                darkMode 
                  ? 'border-gray-600 bg-gray-600 text-white hover:bg-gray-500 focus:ring-gray-600' 
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}