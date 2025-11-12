// components/kasir/KasirCard.js
'use client';

import { Edit, Trash2, User, AtSign, BadgeCheck } from 'lucide-react';

export default function KasirCard({ cashier, onEdit, onDelete, darkMode }) {
  // Mendapatkan huruf pertama nama kasir untuk avatar
  const avatarLetter = cashier.name ? cashier.name.charAt(0).toUpperCase() : 'K';

  return (
    <div className={`relative rounded-xl shadow-md transition-all duration-300 ${darkMode ? 'bg-gray-800 hover:shadow-cyan-500/20 hover:shadow-lg' : 'bg-white hover:shadow-xl'}`}>
      <div className="p-6 pb-14"> {/* pb-14 to make space for the fixed buttons */}
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 flex items-center justify-center rounded-full text-xl font-bold ${darkMode ? 'bg-gray-700 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
            {avatarLetter}
          </div>
          <div className={`text-sm font-medium px-2 py-1 rounded-full ${
            cashier.role === 'ADMIN' 
              ? 'bg-blue-100 text-blue-800' 
              : cashier.role === 'CASHIER' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
          }`}>
            {cashier.role}
          </div>
        </div>
        <div className="mt-4">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {cashier.name}
          </h3>
          <div className="mt-2 space-y-1 text-sm">
            <p className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <AtSign className="h-4 w-4 mr-2 text-gray-400" /> {cashier.username}
            </p>
            <p className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <BadgeCheck className="h-4 w-4 mr-2 text-gray-400" /> {cashier.role}
            </p>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Dibuat: {new Date(cashier.createdAt).toLocaleDateString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons in bottom right corner */}
      <div className="absolute bottom-3 right-3 flex items-center space-x-2">
        <button
          onClick={() => onEdit(cashier)}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          aria-label="Edit kasir"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(cashier.id)}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-red-400 hover:bg-gray-600' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
          aria-label="Hapus kasir"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}