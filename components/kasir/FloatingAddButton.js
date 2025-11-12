// components/kasir/FloatingAddButton.js
'use client';

import { Plus } from 'lucide-react';

export default function FloatingAddButton({ onClick, darkMode }) {
  return (
    <button
      onClick={onClick}
      className={`
        fixed top-24 right-6 z-50
        w-14 h-14 rounded-full shadow-lg
        flex items-center justify-center
        text-white
        bg-gradient-to-r from-purple-600 to-pink-600
        hover:from-purple-700 hover:to-pink-700
        focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50
        transition-all duration-300
        transform hover:scale-110 hover:shadow-xl
        flex items-center justify-center
        text-2xl font-bold
        ${darkMode ? 'shadow-purple-900/50' : 'shadow-purple-500/30'}
      `}
      aria-label="Tambah Kasir Baru"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}