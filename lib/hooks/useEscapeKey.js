import { useEffect } from 'react';

/**
 * Hook untuk menangani penutupan modal dengan tombol ESC
 * @param {Function} onClose - Fungsi untuk menutup modal
 * @param {Boolean} isOpen - Status apakah modal terbuka
 */
export const useEscapeKey = (onClose, isOpen) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose, isOpen]);
};