// components/FloatingAddButton.js
'use client';

import { Plus } from 'lucide-react';

export default function FloatingAddButton({ onClick, darkMode }) {
  return (
    <button
      onClick={onClick}
      className={`
        fixed top-24 right-8 z-50
        w-16 h-16 rounded-full shadow-lg
        flex items-center justify-center
        text-white
        bg-gradient-to-r from-purple-600 to-pink-500
        hover:from-purple-700 hover:to-pink-600
        focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-50
        transition-all duration-300
        transform hover:scale-110 hover:shadow-xl
        ${darkMode ? 'shadow-purple-900/50' : 'shadow-purple-500/40'}
      `}
      aria-label="Tambah Baru"
    >
      <Plus className="w-8 h-8" />
    </button>
  );
}
