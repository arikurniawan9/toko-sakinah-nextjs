// components/kasir/transaksi/TransactionCart.js
'use client';

import { Trash2, Minus, Plus } from 'lucide-react';
import { memo } from 'react';

const TransactionCart = ({ cart, updateQuantity, removeFromCart, darkMode }) => {
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = cart.reduce((total, item) => total + (item.subtotal || 0), 0);

  const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  return (
    <div className={`rounded-xl shadow-lg overflow-hidden mb-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
      <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} flex justify-between items-center`}>
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Keranjang Belanja</h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {cart.length} produk • {totalItems} item
          </p>
        </div>
        <div className={`text-lg font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
          Rp {new Intl.NumberFormat('id-ID').format(totalAmount)}
        </div>
      </div>
      <div className="overflow-x-auto">
        {cart.length === 0 ? (
          <div className="text-center py-10">
            <div className={`mx-auto w-16 h-16 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center mb-4`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className={`text-lg font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Keranjang Kosong</h3>
            <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tambahkan produk untuk memulai transaksi</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Produk
                </th>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Harga
                </th>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Jumlah
                </th>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Subtotal
                </th>
                <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {cart.map((item) => (
                <tr key={item.productId} className={darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}>
                  <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className={`text-xs ${item.quantity > item.stock ? (darkMode ? 'text-red-400' : 'text-red-600') : (darkMode ? 'text-gray-400' : 'text-gray-500')}`}>
                      Stok: {item.stock} {item.quantity > item.stock ? '(Kuantitas melebihi stok!)' : ''}
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    <div className="text-sm">
                      {item.priceAfterItemDiscount && item.priceAfterItemDiscount !== item.originalPrice ? (
                        <div>
                          <span className="line-through text-gray-500 dark:text-gray-400">Rp {formatNumber(item.originalPrice)}</span>
                          <span className={`ml-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>Rp {formatNumber(item.priceAfterItemDiscount)}</span>
                        </div>
                      ) : (
                        <span>Rp {formatNumber(item.originalPrice || 0)}</span>
                      )}
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    <div className="flex items-center">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className={`p-1 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                        aria-label="Kurangi jumlah"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-semibold w-8 text-center mx-2 bg-gray-100 dark:bg-gray-700 py-1 rounded">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className={`p-1 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                        aria-label="Tambah jumlah"
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    Rp {formatNumber(item.subtotal || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="relative group">
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className={`p-2 rounded-full ${darkMode ? 'text-red-400 hover:bg-red-900' : 'text-red-500 hover:bg-red-100'}`}
                        aria-label="Hapus item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="absolute left-1/2 transform -translate-x-1/2 -top-8 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                        Hapus Item
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default memo(TransactionCart);
