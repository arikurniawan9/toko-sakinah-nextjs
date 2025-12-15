// components/pelayan/AttendantMemberSelection.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { Users, X, Scan } from 'lucide-react';

const AttendantMemberSelection = ({ 
  selectedCustomer, 
  defaultCustomer, 
  onSelectCustomer, 
  onRemoveCustomer, 
  darkMode, 
  isOpen, 
  onToggle 
}) => {
  // State management
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanTimeout, setScanTimeout] = useState(null);

  // Ref for input field
  const inputRef = useRef(null);

  // Fungsi untuk mencari customer secara dinamis
  const searchCustomers = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setCustomerSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/member?search=${encodeURIComponent(searchTerm)}&global=true`);
      if (response.ok) {
        const membersData = await response.json();
        setCustomerSearchResults(membersData.members || []);
      } else {
        setCustomerSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomerSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change dengan debounce
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setCustomerSearchTerm(newValue);

    // Hapus timer lama jika ada
    if (scanTimeout) {
      clearTimeout(scanTimeout);
    }

    // Jika nilai input tidak kosong, lakukan pencarian setelah delay
    if (newValue) {
      const newTimeout = setTimeout(() => {
        searchCustomers(newValue);
      }, 300); // Delay 300ms untuk pencarian
      setScanTimeout(newTimeout);
    } else {
      setCustomerSearchResults([]);
    }
  };

  // Fungsi ketika customer dipilih
  const handleSelect = (customer) => {
    onSelectCustomer(customer);
    onToggle(false); // Close modal on selection
    setCustomerSearchTerm('');
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

        // Periksa apakah ada customer yang cocok dengan searchTerm
        const matchedCustomer = customerSearchResults.find(customer =>
          customer.code?.toLowerCase() === customerSearchTerm.toLowerCase() ||
          customer.phone?.toLowerCase() === customerSearchTerm.toLowerCase()
        );

        if (matchedCustomer) {
          onSelectCustomer(matchedCustomer);
          onToggle(false); // Tutup modal setelah pemilihan
          setCustomerSearchTerm(''); // Reset search term
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
  }, [isOpen, customerSearchResults, onSelectCustomer, onToggle, scanTimeout, inputRef, customerSearchTerm]);

  // Fungsi untuk render tampilan customer saat tidak dipilih
  const renderUnselectedView = () => (
    <div className="flex items-center justify-between">
      <span className={`text-sm italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {defaultCustomer ? defaultCustomer.name : 'Tidak ada member'}
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

  // Fungsi untuk render tampilan customer saat dipilih
  const renderSelectedView = () => (
    <div className="flex items-center justify-between">
      <div>
        <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {selectedCustomer.name}
          {selectedCustomer.membershipType && ` (${selectedCustomer.membershipType})`}
        </div>
        {selectedCustomer.discount > 0 && (
          <div className="text-xs mt-1">
            <span className={`px-2 py-0.5 rounded-full ${
              selectedCustomer.discount >= 5 ? 'bg-purple-100 text-purple-800' :
              selectedCustomer.discount >= 4 ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            } ${darkMode ? 'text-xs' : ''}`}>
              {selectedCustomer.discount}% Discount
            </span>
          </div>
        )}
        {selectedCustomer.code !== 'UMUM' && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Kode: {selectedCustomer.code}</div>
        )}
      </div>
      {/* Tombol hapus muncul jika selectedCustomer bukan defaultCustomer */}
      {selectedCustomer?.id !== defaultCustomer?.id && (
        <button
          onClick={onRemoveCustomer}
          className={`p-1 rounded-full ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-100'}`}
          title="Hapus Pilihan Member"
        >
          <X size={16} />
        </button>
      )}
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

    if (!customerSearchTerm) {
      return (
        <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p className="text-sm">Silakan ketik untuk mencari member atau scan kode member</p>
        </div>
      );
    }

    if (customerSearchResults.length === 0) {
      return (
        <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Member tidak ditemukan</p>
        </div>
      );
    }

    return customerSearchResults.map(customer => (
      <div
        key={customer.id}
        onClick={() => handleSelect(customer)}
        className={`p-3 rounded-lg cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
      >
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">{customer.name}</p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {customer.phone} {customer.code && ` • Kode: ${customer.code}`}
            </p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            customer.discount >= 5 ? 'bg-purple-100 text-purple-800' :
            customer.discount >= 4 ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          } ${darkMode ? 'text-xs' : ''}`}>
            {customer.discount}% Discount
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
            Member
          </h2>
          {selectedCustomer && (
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              selectedCustomer.code === 'UMUM'
                ? (darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-800')
                : (darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800')
            }`}>
              {selectedCustomer.name}
            </span>
          )}
        </div>

        {selectedCustomer ? renderSelectedView() : renderUnselectedView()}
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
                  value={customerSearchTerm}
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

export default AttendantMemberSelection;