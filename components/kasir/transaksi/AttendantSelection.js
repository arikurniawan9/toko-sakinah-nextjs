// components/kasir/transaksi/AttendantSelection.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { UserCheck, X, Scan } from 'lucide-react';

const AttendantSelection = ({ selectedAttendant, onSelectAttendant, onRemoveAttendant, attendants, darkMode, isOpen, onToggle }) => {
  const [attendantSearchTerm, setAttendantSearchTerm] = useState('');
  const [scanTimeout, setScanTimeout] = useState(null);
  const inputRef = useRef(null);

  // Event listener untuk handling tombol Enter
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      // Hanya tangani Enter saat input field fokus
      if (document.activeElement === inputRef.current && event.key === 'Enter') {
        event.preventDefault(); // Mencegah perilaku default dari tombol Enter

        if (scanTimeout) {
          clearTimeout(scanTimeout);
        }

        // Periksa apakah ada pelayan yang cocok dengan searchTerm
        const matchedAttendant = attendants.find(attendant =>
          (attendant.status === 'AKTIF' || attendant.status === 'ACTIVE') && // Hanya pelayan aktif
          (attendant.code?.toLowerCase() === attendantSearchTerm.toLowerCase() ||
          attendant.employeeNumber?.toLowerCase() === attendantSearchTerm.toLowerCase() ||
          attendant.username?.toLowerCase() === attendantSearchTerm.toLowerCase())
        );

        if (matchedAttendant) {
          onSelectAttendant(matchedAttendant);
          onToggle(false); // Tutup modal setelah pemilihan
          setAttendantSearchTerm(''); // Reset search term
        }
      }
    };

    // Hanya tambahkan event listener jika modal terbuka
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (scanTimeout) {
        clearTimeout(scanTimeout);
      }
    };
  }, [isOpen, attendants, onSelectAttendant, onToggle, scanTimeout, inputRef, attendantSearchTerm]);

  const filteredAttendants = attendants.filter(attendant =>
    attendant &&
    attendant.name &&
    typeof attendant.name === 'string' &&
    (attendant.status === 'AKTIF' || attendant.status === 'ACTIVE') && // Hanya tampilkan pelayan yang aktif
    (attendant.name.toLowerCase().includes(attendantSearchTerm.toLowerCase()) ||
    attendant.code?.toLowerCase().includes(attendantSearchTerm.toLowerCase()) ||
    attendant.employeeNumber?.toLowerCase().includes(attendantSearchTerm.toLowerCase()) ||
    attendant.username?.toLowerCase().includes(attendantSearchTerm.toLowerCase()))
  );

  const handleSelect = (attendant) => {
    onSelectAttendant(attendant);
    onToggle(false); // Close modal on selection
    setAttendantSearchTerm('');
  };

  return (
    <>
            <div className="flex items-center space-x-2"> {/* New flex container for inline display */}
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Pelayan
              </h2>
              {selectedAttendant && selectedAttendant.name ? (
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                    {selectedAttendant.name}
                  </span>
                  <button
                    onClick={onRemoveAttendant}
                    className={`text-sm font-medium p-1 rounded-full ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-100'}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onToggle(true)}
                  className={`py-1 px-3 border rounded-md shadow-sm text-sm font-medium flex items-center justify-center ${
                    darkMode
                      ? 'border-gray-600 text-gray-200 bg-gray-700 hover:bg-gray-600'
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  <UserCheck className="h-4 w-4 inline mr-2" />
                  Pilih Pelayan
                </button>
              )}
            </div>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className={`relative w-full max-w-md max-h-[70vh] rounded-2xl shadow-2xl flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="text-lg font-semibold">Pilih Pelayan</h3>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Cari nama/kode pelayan atau scan kode..."
                  value={attendantSearchTerm}
                  onChange={(e) => {
                    // Update searchTerm sesuai dengan nilai field
                    const newValue = e.target.value;
                    setAttendantSearchTerm(newValue);

                    // Hapus timer lama jika ada
                    if (scanTimeout) {
                      clearTimeout(scanTimeout);
                    }

                    // Deteksi apakah inputan mungkin dari scanner barcode berdasarkan panjang dan kecepatan input
                    // Jika panjang input cocok dengan kode pelayan, cek kecocokan
                    if (newValue) {
                      const newTimeout = setTimeout(() => {
                        // Periksa apakah ada pelayan yang cocok dengan nilai yang telah diketik
                        const matchedAttendant = attendants.find(attendant =>
                          (attendant.status === 'AKTIF' || attendant.status === 'ACTIVE') && // Hanya pelayan aktif
                          (attendant.code?.toLowerCase() === newValue.toLowerCase() ||
                          attendant.employeeNumber?.toLowerCase() === newValue.toLowerCase() ||
                          attendant.username?.toLowerCase() === newValue.toLowerCase())
                        );

                        if (matchedAttendant) {
                          onSelectAttendant(matchedAttendant);
                          onToggle(false); // Tutup modal setelah pemilihan
                          setAttendantSearchTerm(''); // Reset search term
                        }
                      }, 100); // Delay 100ms untuk menunggu apakah input dari scanner selesai

                      setScanTimeout(newTimeout);
                    }
                  }}
                  onKeyDown={(e) => {
                    // Mencegah perilaku default Enter saat di handle oleh event keyboard
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  className={`w-full mt-2 px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                  }`}
                  autoFocus
                />
                <div className="absolute right-3 top-4 flex items-center">
                  <Scan size={16} className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
              </div>
              <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Scan kode pelayan atau ketik untuk mencari
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto styled-scrollbar">
              {filteredAttendants.length === 0 ? (
                <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p>Tidak ada pelayan yang cocok.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredAttendants
                    .filter(attendant => attendant && attendant.id) // Hanya proses attendant yang valid
                    .map(attendant => (
                    <button
                      key={attendant.id}
                      onClick={() => handleSelect(attendant)}
                      className={`p-3 rounded-lg text-center transition-all duration-150 transform focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        darkMode 
                          ? 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-offset-gray-800 focus:ring-purple-500' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-offset-white focus:ring-purple-500'
                      }`}
                    >
                      <p className="font-semibold truncate">{attendant.name || 'Nama tidak tersedia'}</p>
                      <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {attendant.code || attendant.employeeNumber || attendant.username || '...'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => onToggle(false)}
                className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
                  darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AttendantSelection;
