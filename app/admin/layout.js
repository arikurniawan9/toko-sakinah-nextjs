// app/admin/layout.js
'use client';

import { DarkModeProvider } from '../../components/DarkModeContext';
import { SidebarProvider } from '../../components/SidebarContext';

export default function AdminLayout({ children }) {
  return (
    <DarkModeProvider>
      <SidebarProvider>
        {children}
      </SidebarProvider>
    </DarkModeProvider>
  );
}