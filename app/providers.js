// app/providers.js
'use client';

import { SessionProvider } from 'next-auth/react';
import { DarkModeProvider } from '@/components/DarkModeContext'; // Import DarkModeProvider

export function Providers({ children }) {
  return (
    <DarkModeProvider>
      <SessionProvider>{children}</SessionProvider>
    </DarkModeProvider>
  );
}