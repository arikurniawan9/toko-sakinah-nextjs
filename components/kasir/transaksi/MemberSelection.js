// components/kasir/transaksi/MemberSelection.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { Users, X, Plus, Scan } from 'lucide-react';

const MemberSelection = ({ selectedMember, defaultMember, onSelectMember, onRemoveMember, darkMode, isOpen, onToggle, onAddNewMember }) => {
  // State management
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanTimeout, setScanTimeout] = useState(null);

  // Ref for input field
  const inputRef = useRef(null);

  // Fungsi untuk mencari member secara dinamis
  const searchMembers = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setMemberSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/member?search=${encodeURIComponent(searchTerm)}&simple=true`);
      if (response.ok) {
        const membersData = await response.json();
        setMemberSearchResults(membersData || []);
      } else {
        setMemberSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching members:', error);
      setMemberSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change dengan debounce
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setMemberSearchTerm(newValue);

    // Hapus timer lama jika ada
    if (scanTimeout) {
      clearTimeout(scanTimeout);
    }

    // Jika nilai input tidak kosong, lakukan pencarian setelah delay
    if (newValue) {
      const newTimeout = setTimeout(() => {
        searchMembers(newValue);
      }, 300); // Delay 300ms untuk pencarian
      setScanTimeout(newTimeout);
    } else {
      setMemberSearchResults([]);
    }
  };

  // Fungsi ketika member dipilih
  const handleSelect = (member) => {
    onSelectMember(member);
    onToggle(false); // Close modal on selection
    setMemberSearchTerm('');
  };

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

        // Periksa apakah ada member yang cocok dengan searchTerm
        const matchedMember = memberSearchResults.find(member =>
          member.code?.toLowerCase() === memberSearchTerm.toLowerCase() ||
          member.phone?.toLowerCase() === memberSearchTerm.toLowerCase()
        );

        if (matchedMember) {
          onSelectMember(matchedMember);
          onToggle(false); // Tutup modal setelah pemilihan
          setMemberSearchTerm(''); // Reset search term
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
  }, [isOpen, memberSearchResults, onSelectMember, onToggle, scanTimeout, inputRef, memberSearchTerm]);

  // Fungsi untuk render tampilan member saat tidak dipilih
  const renderUnselectedView = () => (
    <div className="flex items-center justify-between">
      <span className={`text-sm italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {defaultMember ? defaultMember.name : 'Tidak ada member'}
      </span>
      <button
        onClick={() => onToggle(true)}
        className={`py-2 px-4 border rounded-md shadow-sm text-sm font-medium flex items-center justify-center ${
          darkMode
            ? 'border-gray-600 text-gray-200 bg-gray-700 hover:bg-gray-600'
            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
        }`}
      >
        <Users className="h-4 w-4 inline mr-2" />
        Pilih Member
      </button>
    </div>
  );

  // Fungsi untuk render tampilan member saat dipilih
  const renderSelectedView = () => (
    <div className="flex items-center justify-between">
      <div>
        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {selectedMember.name} ({selectedMember.membershipType})
        </div>
        <div className="text-xs mt-1">
          <span className={`px-2 py-0.5 rounded-full ${
            selectedMember.discount >= 5 ? 'bg-purple-100 text-purple-800' :
            selectedMember.discount >= 4 ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          } ${darkMode ? 'text-xs' : ''}`}>
            {selectedMember.discount}% Discount
          </span>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onRemoveMember}
          className={`p-1 rounded-full ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-100'}`}
          title="Hapus Member"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );

  // Fungsi untuk render hasil pencarian
  const renderSearchResults = () => {
    if (loading) {
      return (
        <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Mencari member...</p>
        </div>
      );
    }

    if (!memberSearchTerm) {
      return (
        <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p className="text-sm">Silakan ketik untuk mencari member atau scan kode member</p>
        </div>
      );
    }

    if (memberSearchResults.length === 0) {
      return (
        <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Member tidak ditemukan</p>
        </div>
      );
    }

    return memberSearchResults.map(member => (
      <div
        key={member.id}
        onClick={() => handleSelect(member)}
        className={`p-3 rounded-lg cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
      >
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">{member.name}</p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {member.phone} {member.code && ` • Kode: ${member.code}`}
            </p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            member.discount >= 5 ? 'bg-purple-100 text-purple-800' :
            member.discount >= 4 ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          } ${darkMode ? 'text-xs' : ''}`}>
            {member.discount}% Discount
          </span>
        </div>
      </div>
    ));
  };

  return (
    <>
      <div className={`rounded-lg shadow p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Member <span className="text-xs text-gray-500 ml-2 float-right">(ALT+M)</span>
          </h2>
          {selectedMember && (
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`}>
              {selectedMember.name}
            </span>
          )}
        </div>

        {selectedMember ? renderSelectedView() : renderUnselectedView()}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
          <div className={`relative w-full max-w-md max-h-[70vh] rounded-2xl shadow-2xl flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="text-lg font-semibold">Pilih Member</h3>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Cari nama/no.telp atau scan kode..."
                  value={memberSearchTerm}
                  onChange={handleInputChange}
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
                <div className="absolute right-3 top-10 flex items-center">
                  <Scan size={16} className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
              </div>
              <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Scan kode member atau ketik untuk mencari
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {renderSearchResults()}
            </div>
            <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex space-x-2">
                <button
                  onClick={() => onToggle(false)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                    darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Batal
                </button>
                {onAddNewMember && (
                  <button
                    onClick={() => {
                      onToggle(false); // Close modal
                      onAddNewMember(); // Call function to open add member modal
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center ${
                      darkMode ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'
                    }`}
                  >
                    <Plus className="h-4 w-4 inline mr-2" />
                    Tambah Baru
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MemberSelection;
