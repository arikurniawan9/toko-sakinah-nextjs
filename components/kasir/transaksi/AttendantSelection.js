// components/kasir/transaksi/AttendantSelection.js
'use client';

import { useState } from 'react';
import { UserCheck, X } from 'lucide-react';

const AttendantSelection = ({ selectedAttendant, onSelectAttendant, onRemoveAttendant, attendants, darkMode, isOpen, onToggle }) => {
  const [attendantSearchTerm, setAttendantSearchTerm] = useState('');

  const filteredAttendants = attendants.filter(attendant =>
    attendant.name.toLowerCase().includes(attendantSearchTerm.toLowerCase())
  );

  const handleSelect = (attendant) => {
    onSelectAttendant(attendant);
    onToggle(false); // Close modal on selection
    setAttendantSearchTerm('');
  };

  return (
    <>
      <div className={`rounded-lg shadow p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pelayan (ALT+P)</h2>
          {selectedAttendant && (
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
              {selectedAttendant.name}
            </span>
          )}
        </div>

        {selectedAttendant ? (
          <div className="flex items-center justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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
            className={`w-full py-2 px-4 border rounded-md shadow-sm text-sm font-medium flex items-center justify-center ${
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className={`relative w-full max-w-md max-h-[70vh] rounded-2xl shadow-2xl flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="text-lg font-semibold">Pilih Pelayan</h3>
              <input
                type="text"
                placeholder="Cari nama pelayan..."
                value={attendantSearchTerm}
                onChange={(e) => setAttendantSearchTerm(e.target.value)}
                className={`w-full mt-2 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                }`}
                autoFocus
              />
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {filteredAttendants.map(attendant => (
                <div
                  key={attendant.id}
                  onClick={() => handleSelect(attendant)}
                  className={`p-3 rounded-lg cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <p className="font-medium">{attendant.name}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{attendant.username}</p>
                </div>
              ))}
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
