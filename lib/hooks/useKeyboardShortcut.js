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

      // Pastikan event.key tidak null atau undefined sebelum memanggil toLowerCase
      const key = event.key && typeof event.key === 'string' ? event.key.toLowerCase() : '';
      if (key) {
        keys.push(key);

        const combination = keys.join('+');

        // Cek apakah kombinasi ada dalam shortcuts
        const shortcutFunction = shortcuts[combination];
        if (shortcutFunction) {
          event.preventDefault();
          shortcutFunction(event);
        }
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