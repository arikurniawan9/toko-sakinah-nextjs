// components/shared/UserSelectionModal.js
// Modal for selecting users with search functionality
// Search works on name, username, and code fields
// Displays user code if available, otherwise shows username
// Supports auto-selection when exact code is found or only one result remains
// Supports barcode scanner input: automatically selects user when exact code is scanned
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, X, User } from 'lucide-react';

export default function UserSelectionModal({ isOpen, onClose, users, onSelectUser, darkMode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(0);
  // State untuk mendeteksi input dari barcode scanner
  // Scanner menginput karakter sangat cepat, berbeda dengan input keyboard manual

  const filteredUsers = useMemo(() => {
    if (!searchTerm) {
      return users;
    }
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.code && user.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);

  // Handle ESC key press to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSelect = (user) => {
    onSelectUser(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-md flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pilih Pelayan</h2>
          <button onClick={onClose} className={`p-1 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200'}`}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search - can search by name or code */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari nama atau kode pelayan..."
              className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
              }`}
              value={searchTerm}
              onChange={(e) => {
                const currentTime = Date.now();
                const timeDiff = currentTime - lastKeyTime;
                setLastKeyTime(currentTime);

                const value = e.target.value;
                setSearchTerm(value);

                // Deteksi input cepat (khas scanner barcode)
                // Scanner biasanya menginput seluruh kode dalam waktu singkat
                const isLikelyScannerInput = timeDiff < 30 && value.length > 1;

                // Jika ini kemungkinan input dari scanner dan panjangnya cukup untuk kode
                if (isLikelyScannerInput && value.length >= 3) {
                  // Cek apakah sudah ada user dengan kode yang cocok
                  const exactCodeMatch = users.find(user =>
                    user.code && user.code.toLowerCase() === value.toLowerCase()
                  );

                  if (exactCodeMatch) {
                    // Jika ada kode yang cocok secara tepat, langsung pilih
                    setTimeout(() => {
                      handleSelect(exactCodeMatch);
                    }, 10); // Delay kecil agar input benar-benar terisi
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Cek apakah pencarian cocok dengan kode secara tepat
                  const exactCodeMatch = users.find(user =>
                    user.code && user.code.toLowerCase() === searchTerm.toLowerCase()
                  );

                  if (exactCodeMatch) {
                    // Jika ada kode yang cocok secara tepat, langsung pilih
                    handleSelect(exactCodeMatch);
                  } else if (filteredUsers.length === 1) {
                    // Jika hanya ada satu hasil pencarian, pilih itu
                    handleSelect(filteredUsers[0]);
                  }
                } else if (e.key.length === 1) {
                  // Jika ini karakter biasa (bukan Enter, dll), update timer untuk deteksi scanner
                  setLastKeyTime(Date.now());
                }
              }}
              autoFocus
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Search className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
          </div>
        </div>
        
        {/* User List */}
        <div className="overflow-y-auto max-h-[60vh]">
          {filteredUsers.length > 0 ? (
            <ul>
              {filteredUsers.map((user) => (
                <li key={user.id}>
                  <button
                    onClick={() => handleSelect(user)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleSelect(user);
                      }
                    }}
                    className={`w-full text-left flex items-center p-4 transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    tabIndex={0}
                  >
                    <div className={`p-2 rounded-full mr-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <User className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                    {/* Display user code if available, otherwise username */}
                    <div>
                        <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.name}</div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {user.code ? `Kode: ${user.code}` : `@${user.username}`} • {user.role}
                        </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-8 text-center text-gray-500">Pelayan tidak ditemukan.</p>
          )}
        </div>
      </div>
    </div>
  );
}
