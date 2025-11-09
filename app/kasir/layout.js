'use client';

import { DarkModeProvider } from '../../components/DarkModeContext';
import { SidebarProvider } from '../../components/SidebarContext';

export default function KasirLayout({ children }) {
  return (
    <DarkModeProvider>
      <SidebarProvider>
        {children}
      </SidebarProvider>
    </DarkModeProvider>
  );
}
