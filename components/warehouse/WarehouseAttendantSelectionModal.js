'use client';

import { useState, useEffect, useRef } from 'react';
import { UserCheck, X, Scan, User } from 'lucide-react'; // Added User for consistency

const WarehouseAttendantSelectionModal = ({
  selectedAttendant,
  onSelectAttendant,
  attendants, // Pass attendants directly from parent or fetch inside
  darkMode,
  isOpen,
  onToggle // Function to open/close the modal
}) => {
  const [attendantSearchTerm, setAttendantSearchTerm] = useState('');
  const inputRef = useRef(null);

  // Filter attendants based on search term
  const filteredAttendants = attendants.filter(attendant =>
    attendant &&
    attendant.name &&
    typeof attendant.name === 'string' &&
    (attendant.status === 'AKTIF' || attendant.status === 'ACTIVE') && // Only active attendants
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

  // Focus the input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle ESC key press to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onToggle(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onToggle]);

  // Handle barcode scanning - simplified from cashier version for warehouse context, just search
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const matchedAttendant = attendants.find(attendant =>
        (attendant.status === 'AKTIF' || attendant.status === 'ACTIVE') &&
        (attendant.code?.toLowerCase() === attendantSearchTerm.toLowerCase() ||
        attendant.employeeNumber?.toLowerCase() === attendantSearchTerm.toLowerCase() ||
        attendant.username?.toLowerCase() === attendantSearchTerm.toLowerCase())
      );

      if (matchedAttendant) {
        handleSelect(matchedAttendant);
      }
    }
  };


  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className={`relative w-full max-w-md max-h-[70vh] rounded-2xl shadow-2xl flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pilih Pelayan</h3>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Cari nama/kode pelayan atau scan kode..."
                  value={attendantSearchTerm}
                  onChange={(e) => setAttendantSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
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
                  <p>Tidak ada pelayan yang ditemukan</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredAttendants
                    .filter(attendant => attendant && attendant.id)
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

export default WarehouseAttendantSelectionModal;
