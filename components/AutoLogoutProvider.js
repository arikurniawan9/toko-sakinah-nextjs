// components/AutoLogoutProvider.js
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';

const AutoLogoutProvider = ({ children }) => {
  const { data: session } = useSession();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Hanya aktifkan auto logout jika pengguna sudah login dan di client side
    if (isClient && session) {
      let timeoutId;

      const resetTimeout = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
          // Logout pengguna dan clear semua cache
          signOut({ callbackUrl: '/login' });
        }, 180000); // 3 menit
      };

      // Reset timeout saat ada aktivitas
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'keydown'];

      // Inisialisasi timeout
      resetTimeout();

      // Tambahkan event listener untuk mereset timeout
      events.forEach(event => {
        window.addEventListener(event, resetTimeout, true);
      });

      // Cleanup saat komponen unmount
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        events.forEach(event => {
          window.removeEventListener(event, resetTimeout, true);
        });
      };
    }
  }, [session, isClient]); // Tambahkan session dan isClient ke dependency array

  return <>{children}</>;
};

export default AutoLogoutProvider;