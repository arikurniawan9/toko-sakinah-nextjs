// app/providers.js
'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import NotificationProvider from '@/components/notifications/NotificationProvider';
import AutoLogoutProvider from '@/components/AutoLogoutProvider';

import { DashboardCustomizationProvider } from '@/components/DashboardCustomizationContext';
import { UserThemeProvider } from '@/components/UserThemeContext';
import ShopNameUpdater from '@/components/ShopNameUpdater';

import { PelayanStateProvider } from '@/components/pelayan/PelayanStateContext';

// Providers lengkap untuk aplikasi yang memerlukan otentikasi
export function Providers({ children }) {
  return (
    <ErrorBoundary>
      <DashboardCustomizationProvider>
        <ThemeProvider>
          <UserThemeProvider>
            <NotificationProvider>
              <SessionProvider>
                <AutoLogoutProvider>
                  <ShopNameUpdater />
                  {children}
                </AutoLogoutProvider>
              </SessionProvider>
            </NotificationProvider>
          </UserThemeProvider>
        </ThemeProvider>
      </DashboardCustomizationProvider>
    </ErrorBoundary>
  );
}

// Versi ringan dari providers untuk halaman publik
export function LightProviders({ children }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SessionProvider>
          {children}
        </SessionProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}