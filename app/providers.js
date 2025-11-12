// app/providers.js
'use client';

import { SessionProvider } from 'next-auth/react';
import { DarkModeProvider } from '@/components/DarkModeContext'; // Import DarkModeProvider
import { ThemeProvider } from '@/components/ThemeContext';

export function Providers({ children }) {
  return (
    <DarkModeProvider>
      <ThemeProvider>
        <SessionProvider>{children}</SessionProvider>
      </ThemeProvider>
    </DarkModeProvider>
  );
}