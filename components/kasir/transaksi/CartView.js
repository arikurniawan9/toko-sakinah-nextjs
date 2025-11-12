// components/kasir/transaksi/CartView.js
'use client';

import { PlusCircle, MinusCircle, Trash2, UserPlus, XCircle } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function CartView({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenPayment,
  onSelectMember,
  selectedMember,
  darkMode,
}) {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Discounts and taxes will be calculated here in the future
  const total = subtotal;

  return (
    <div className={`h-full flex flex-col rounded-lg shadow-inner ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Member Selection */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {selectedMember ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pelanggan:</p>
              <p className={`font-bold ${darkMode ? 'text-white' : 'text-black'}`}>{selectedMember.name}</p>
            </div>
            <button onClick={() => onSelectMember(null)} className="text-red-500 hover:text-red-700">
              <XCircle size={20} />
            </button>
          </div>
        ) : (
          <button
            onClick={onSelectMember}
            className={`w-full flex items-center justify-center p-2 rounded-lg border-2 border-dashed transition ${
              darkMode ? 'border-gray-600 hover:border-blue-500 hover:text-blue-500' : 'border-gray-300 hover:border-blue-500 hover:text-blue-500'
            }`}
          >
            <UserPlus size={20} className="mr-2" />
            Pilih Pelanggan / Member
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-grow overflow-y-auto p-4">
        {cartItems.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">Keranjang masih kosong.</p>
        ) : (
          <ul className="space-y-3">
            {cartItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between">
                <div className="flex-grow">
                  <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{item.name}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center">
                  <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className={`p-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <MinusCircle size={18} />
                  </button>
                  <span className="w-10 text-center font-bold">{item.quantity}</span>
                  <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className={`p-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <PlusCircle size={18} />
                  </button>
                  <button onClick={() => onRemoveItem(item.id)} className="ml-3 text-red-500 hover:text-red-700">
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Cart Summary & Actions */}
      <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-gray-400">Subtotal</span>
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>{formatCurrency(subtotal)}</span>
          </div>
          {/* Future placeholders for discount and tax */}
          <div className="flex justify-between text-xl font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
        <div className="space-y-2">
          <button
            onClick={onOpenPayment}
            disabled={cartItems.length === 0}
            className="w-full bg-blue-600 text-white p-4 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Bayar
          </button>
          <button
            onClick={onClearCart}
            disabled={cartItems.length === 0}
            className="w-full bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}