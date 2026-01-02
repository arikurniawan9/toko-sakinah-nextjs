// components/AutoLogoutProvider.js
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation'; // Import usePathname

const AUTO_LOGOUT_DURATION = 600000; // 10 minutes in milliseconds

const AutoLogoutProvider = ({ children }) => {
  const { data: session } = useSession();
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname(); // Get current pathname
  const timeoutRef = useRef(null); // Use useRef to persist timeoutId across renders

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only activate auto logout if user is logged in and on client side
    if (session && isClient) {
      const resetTimeout = () => {
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set new timeout only if NOT on the kasir/transaksi page
        if (pathname !== '/kasir/transaksi') {
          timeoutRef.current = setTimeout(() => {
            signOut({ callbackUrl: '/login' });
          }, AUTO_LOGOUT_DURATION);
        }
      };

      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'keydown'];

      // Initial reset of timeout based on current conditions
      resetTimeout();

      // Add/remove event listeners based on pathname
      // Event listeners are always added, but resetTimeout itself checks pathname before setting timer.
      events.forEach(event => {
        window.addEventListener(event, resetTimeout, true);
      });

      // Cleanup function to clear timeout and remove event listeners
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        events.forEach(event => {
          window.removeEventListener(event, resetTimeout, true);
        });
      };
    }

    // If no session or not client, ensure any active timeout is cleared.
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // No need to remove event listeners here if they were never added in this effect run.
      // The main cleanup above handles cases where listeners were added.
    };
  }, [session, isClient, pathname]); // Re-run effect if session, client status, or pathname changes

  return <>{children}</>;
};

export default AutoLogoutProvider;