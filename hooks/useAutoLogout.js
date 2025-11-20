'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

const useAutoLogout = (timeout = 60000) => { // default 1 minute = 60000 ms
  useEffect(() => {
    let timeoutId;

    const resetTimeout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        // Logout pengguna dan clear semua cache
        signOut({ callbackUrl: '/login' });
      }, timeout);
    };

    // Reset timeout saat ada aktivitas
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'keydown'];
    
    // Inisialisasi timeout
    resetTimeout();

    // Tambahkan event listener untuk mereset timeout
    events.forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });

    // Cleanup saat komponen unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      events.forEach(event => {
        document.removeEventListener(event, resetTimeout, true);
      });
    };
  }, [timeout]);
};

export default useAutoLogout;