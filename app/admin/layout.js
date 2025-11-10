// app/admin/layout.js
'use client';

import { DarkModeProvider } from '../../components/DarkModeContext';
import { SidebarProvider } from '../../components/SidebarContext';
import Sidebar from '../../components/Sidebar';

export default function AdminLayout({ children }) {
  return (
    <DarkModeProvider>
      <SidebarProvider>
        <Sidebar>
          {children}
        </Sidebar>
      </SidebarProvider>
    </DarkModeProvider>
  );
}