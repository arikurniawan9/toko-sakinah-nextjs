// components/warehouse/distribution/DistributionCart.js
'use client';

import { Trash2, ShoppingCart, Package } from 'lucide-react';
import { memo, useMemo, useState, useEffect, useRef } from 'react';
import { getTerbilangText } from '../../../lib/utils/terbilang';

const formatNumber = (num) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num || 0);
};

const DistributionCartRow = memo(({ item, updateQuantity, removeFromCart, darkMode, isSelected, onSelect }) => {
  // Memoisasi perhitungan subtotal per item
  const itemSubtotal = useMemo(() => item.quantity * item.purchasePrice, [item.quantity, item.purchasePrice]);

  // Ref untuk baris tabel
  const rowRef = useRef(null);

  // Efek untuk menangani shortcut keyboard
  useEffect(() => {
    if (!isSelected) return;

    const handleKeyDown = (e) => {
      // Jika tombol + ditekan, tambah jumlah
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        if (item.quantity < item.stock) {
          updateQuantity(item.productId, item.quantity + 1);
        }
      }
      // Jika tombol - ditekan, kurangi jumlah
      else if (e.key === '-') {
        e.preventDefault();
        if (item.quantity > 1) {
          updateQuantity(item.productId, item.quantity - 1);
        }
      }
      // Jika tombol Delete ditekan, hapus item
      else if (e.key === 'Delete') {
        e.preventDefault();
        removeFromCart(item.productId);
      }
    };

    // Tambahkan event listener ke dokumen
    document.addEventListener('keydown', handleKeyDown);

    // Fokus ke baris saat dipilih
    if (rowRef.current) {
      rowRef.current.focus();
    }

    // Hapus event listener saat komponen tidak digunakan
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSelected, item, updateQuantity, removeFromCart]);

  return (
    <tr
      ref={rowRef}
      tabIndex={0}
      className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'} ${isSelected ? (darkMode ? 'bg-gray-700/70' : 'bg-blue-100') : ''}`}
      onClick={() => onSelect(item.productId)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(item.productId);
        }
      }}
    >
      <td className={`p-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.name}</td>
      <td className={`p-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.productCode}</td>
      <td className={`p-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateQuantity(item.productId, item.quantity - 1);
            }}
            disabled={item.quantity <= 1}
            className={`w-7 h-7 flex items-center justify-center rounded-full ${item.quantity <= 1 ? (darkMode ? 'bg-gray-700 opacity-50 cursor-not-allowed' : 'bg-gray-200 opacity-50 cursor-not-allowed') : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')}`}
            aria-label="Kurangi jumlah"
          >
            -
          </button>
          <span className={`text-sm font-bold w-8 text-center ${item.quantity > item.stock ? (darkMode ? 'text-red-400' : 'text-red-600' ) : ''}`}>
            {item.quantity}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateQuantity(item.productId, item.quantity + 1);
            }}
            disabled={item.quantity >= item.stock}
            className={`w-7 h-7 flex items-center justify-center rounded-full ${item.quantity >= item.stock ? (darkMode ? 'bg-gray-700 opacity-50 cursor-not-allowed' : 'bg-gray-200 opacity-50 cursor-not-allowed') : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')}`}
            aria-label="Tambah jumlah"
          >
            +
          </button>
        </div>
      </td>
      <td className={`p-3 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formatNumber(item.purchasePrice)}</td>
      <td className={`p-3 text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formatNumber(itemSubtotal)}</td>
      <td className={`p-3 text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        <div className="flex flex-col items-center">
          <span>{item.stock}</span>
          {item.quantity > item.stock && (
            <span className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
              Melebihi stok!
            </span>
          )}
        </div>
      </td>
      <td className="p-3 text-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeFromCart(item.productId);
          }}
          className={`text-red-500 hover:text-red-700 p-2 rounded-full ${darkMode ? 'hover:bg-red-900/20' : 'hover:bg-red-100'}`}
          aria-label="Hapus item"
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
});

DistributionCartRow.displayName = 'DistributionCartRow';

const DistributionCart = ({ items, updateQuantity, removeFromCart, cartTotal, darkMode }) => {
  // State untuk item yang dipilih
  const [selectedItemId, setSelectedItemId] = useState(null);

  // Memoisasi terbilang text untuk menghindari perhitungan ulang yang tidak perlu
  const terbilangText = useMemo(() => getTerbilangText(cartTotal), [cartTotal]);

  // Fungsi untuk memilih item
  const handleSelectItem = (productId) => {
    setSelectedItemId(productId);
  };

  // Fungsi untuk menangani shortcut keyboard global
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Jika tidak ada item yang dipilih, tidak lakukan apa-apa
      if (!selectedItemId) return;

      // Jika tombol + ditekan, tambah jumlah item yang dipilih
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        const selectedItem = items.find(item => item.productId === selectedItemId);
        if (selectedItem && selectedItem.quantity < selectedItem.stock) {
          updateQuantity(selectedItemId, selectedItem.quantity + 1);
        }
      }
      // Jika tombol - ditekan, kurangi jumlah item yang dipilih
      else if (e.key === '-') {
        e.preventDefault();
        const selectedItem = items.find(item => item.productId === selectedItemId);
        if (selectedItem && selectedItem.quantity > 1) {
          updateQuantity(selectedItemId, selectedItem.quantity - 1);
        }
      }
      // Jika tombol Delete ditekan, hapus item yang dipilih
      else if (e.key === 'Delete') {
        e.preventDefault();
        removeFromCart(selectedItemId);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [selectedItemId, items, updateQuantity, removeFromCart]);

  return (
    <div className={`rounded-lg shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`flex items-center px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <ShoppingCart className={`h-6 w-6 mr-3 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Keranjang Distribusi</h2>
        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
          {items.length} item
        </span>
        {selectedItemId && (
          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${darkMode ? 'bg-blue-700 text-blue-100' : 'bg-blue-200 text-blue-800'}`}>
            Item dipilih: {items.find(item => item.productId === selectedItemId)?.name || 'N/A'}
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Package size={48} className="text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">Keranjang Kosong</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pilih produk untuk ditambahkan.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className={`${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
              <tr>
                <th className="p-3 text-left">Nama Produk</th>
                <th className="p-3 text-left">Kode Produk</th>
                <th className="p-3 text-center">Jumlah</th>
                <th className="p-3 text-right">Harga Satuan</th>
                <th className="p-3 text-right">Subtotal</th>
                <th className="p-3 text-center">Stok</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <DistributionCartRow
                  key={item.productId}
                  item={item}
                  updateQuantity={updateQuantity}
                  removeFromCart={removeFromCart}
                  darkMode={darkMode}
                  isSelected={selectedItemId === item.productId}
                  onSelect={handleSelectItem}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className={`p-4 border-t ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex justify-between items-center mb-2">
          <span className={`text-base font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total</span>
          <span className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
            {formatNumber(cartTotal)}
          </span>
        </div>
        <p className={`text-sm text-right italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {terbilangText}
        </p>
        <div className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>Shortcut: Klik item untuk memilih, lalu gunakan tombol + untuk tambah jumlah, - untuk kurangi jumlah, Delete untuk hapus item</p>
        </div>
      </div>
    </div>
  );
};

export default memo(DistributionCart);