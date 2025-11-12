// components/supplier/SupplierCard.js
'use client';

import { Edit, Trash2, Package, Phone, Mail, MapPin } from 'lucide-react';

export default function SupplierCard({ supplier, onEdit, onDelete, darkMode }) {
  // Get the first letter of the supplier's name for the avatar
  const avatarLetter = supplier.name ? supplier.name.charAt(0).toUpperCase() : 'S';

  return (
    <div className={`relative rounded-xl shadow-md transition-all duration-300 ${darkMode ? 'bg-gray-800 hover:shadow-cyan-500/20 hover:shadow-lg' : 'bg-white hover:shadow-xl'}`}>
      <div className="p-6 pb-14"> {/* pb-14 to make space for the fixed buttons */}
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 flex items-center justify-center rounded-full text-xl font-bold ${darkMode ? 'bg-gray-700 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
            {avatarLetter}
          </div>
          <div className={`text-sm font-medium px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            {supplier.productCount || 0} Produk
          </div>
        </div>
        <div className="mt-4">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {supplier.name}
          </h3>
          <div className="mt-2 space-y-1 text-sm">
            {supplier.phone && (
              <p className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <Phone className="h-4 w-4 mr-2 text-gray-400" /> {supplier.phone}
              </p>
            )}
            {supplier.email && (
              <p className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <Mail className="h-4 w-4 mr-2 text-gray-400" /> {supplier.email}
              </p>
            )}
            {supplier.address && (
              <p className={`flex items-start ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <MapPin className="h-4 w-4 mr-2 mt-1 text-gray-400 flex-shrink-0" /> {supplier.address}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Action buttons in bottom right corner */}
      <div className="absolute bottom-3 right-3 flex items-center space-x-2">
        <button
          onClick={() => onEdit(supplier)}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          aria-label="Edit supplier"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(supplier.id)}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-red-400 hover:bg-gray-600' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
          aria-label="Hapus supplier"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
