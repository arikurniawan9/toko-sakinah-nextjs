// components/kasir/transaksi/TransactionCart.js
'use client';

import { Trash2 } from 'lucide-react';
import { memo } from 'react';

const TransactionCartItem = memo(({ item, updateQuantity, removeFromCart, darkMode }) => {
  return (
    <li key={item.productId} className="py-3">
      <div className="flex justify-between items-center">
        <div>
          <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.name}</div>
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {item.quantity} x Rp {(item.originalPrice || 0).toLocaleString('id-ID')}
            {(item.priceAfterItemDiscount || 0) < (item.originalPrice || 0) && (
              <span className={`ml-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                (Rp {(item.priceAfterItemDiscount || 0).toLocaleString('id-ID')})
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
            className={`px-2 py-0.5 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            -
          </button>
          <span className="text-sm w-4 text-center">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
            className={`px-2 py-0.5 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            +
          </button>
          <button
            onClick={() => removeFromCart(item.productId)}
            className={`text-red-500 hover:text-red-700 ml-2 p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="text-sm text-right font-bold text-purple-500 mt-1">
        Rp {(item.subtotal || 0).toLocaleString('id-ID')}
      </div>
    </li>
  );
});

TransactionCartItem.displayName = 'TransactionCartItem';

const TransactionCart = ({ cart, updateQuantity, removeFromCart, darkMode }) => {
  return (
    <div className={`rounded-lg shadow overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`px-4 py-5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} sm:px-6`}>
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Keranjang</h2>
      </div>
      <div className="p-4 max-h-64 overflow-y-auto styled-scrollbar">
        {cart.length === 0 ? (
          <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Keranjang kosong</p>
        ) : (
          <ul className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {cart.map((item) => (
              <TransactionCartItem 
                key={item.productId} 
                item={item} 
                updateQuantity={updateQuantity} 
                removeFromCart={removeFromCart} 
                darkMode={darkMode} 
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default memo(TransactionCart);
