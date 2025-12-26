// lib/hooks/useKeyboardShortcut.js
import { useEffect } from 'react';

/**
 * Hook untuk menangani keyboard shortcuts
 * @param {Object} shortcuts - Objek berisi kombinasi tombol dan fungsi callback
 * Contoh: { 'ctrl+s': () => saveFunction(), 'n': () => newFunction() }
 */
export const useKeyboardShortcut = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Membuat kombinasi tombol yang ditekan
      const keys = [];
      
      if (event.ctrlKey) keys.push('ctrl');
      if (event.shiftKey) keys.push('shift');
      if (event.altKey) keys.push('alt');
      if (event.metaKey) keys.push('meta'); // Untuk tombol Command di Mac
      
      const key = event.key.toLowerCase();
      keys.push(key);
      
      const combination = keys.join('+');
      
      // Cek apakah kombinasi ada dalam shortcuts
      const shortcutFunction = shortcuts[combination];
      if (shortcutFunction) {
        event.preventDefault();
        shortcutFunction();
      }
    };

    // Tambahkan event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Hapus event listener saat komponen unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
};