// app/providers.js
'use client';

import { SessionProvider } from 'next-auth/react';
import { DarkModeProvider } from '@/components/DarkModeContext';
import { ThemeProvider } from '@/components/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import NotificationProvider from '@/components/NotificationProvider';
import AutoLogoutProvider from '@/components/AutoLogoutProvider';

export function Providers({ children }) {
  return (
    <ErrorBoundary>
      <DarkModeProvider>
        <ThemeProvider>
          <NotificationProvider>
            <SessionProvider>
              <AutoLogoutProvider>
                {children}
              </AutoLogoutProvider>
            </SessionProvider>
          </NotificationProvider>
        </ThemeProvider>
      </DarkModeProvider>
    </ErrorBoundary>
  );
}