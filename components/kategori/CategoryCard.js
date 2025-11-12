// components/kategori/CategoryCard.js
'use client';

import * as LucideIcons from 'lucide-react';
import { Edit, Trash2, Package } from 'lucide-react';

export default function CategoryCard({ category, onEdit, onDelete, darkMode }) {
  const IconComponent = category.icon ? LucideIcons[category.icon] || Package : Package;

  return (
    <div className={`relative group rounded-xl shadow-md transition-all duration-300 ${darkMode ? 'bg-gray-800 hover:shadow-cyan-500/20 hover:shadow-lg' : 'bg-white hover:shadow-xl'}`}>
      <div className="p-6 pb-14"> {/* pb-14 to make space for the fixed buttons */}
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 flex items-center justify-center rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-cyan-50'}`}>
            <IconComponent className={`h-7 w-7 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
          </div>
          <div className={`text-sm font-medium px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            {category.productCount || 0} Produk
          </div>
        </div>
        <div className="mt-4">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {category.name}
          </h3>
          <p className={`mt-1 text-sm text-gray-500 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {category.description || 'Tidak ada deskripsi'}
          </p>
        </div>
      </div>
      
      {/* Action buttons in bottom right corner */}
      <div className="absolute bottom-3 right-3 flex items-center space-x-2">
        <button
          onClick={() => onEdit(category)}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          aria-label="Edit kategori"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(category.id)}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-red-400 hover:bg-gray-600' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
          aria-label="Hapus kategori"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
