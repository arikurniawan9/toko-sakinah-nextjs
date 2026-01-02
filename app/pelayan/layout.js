// app/pelayan/layout.js
'use client';

import { SidebarProvider } from '@/components/SidebarContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';

export default function PelayanLayout({ children }) {
  return (
    <ProtectedRoute requiredRole="ATTENDANT">
      <SidebarProvider>
        <Sidebar>
          {children}
        </Sidebar>
      </SidebarProvider>
    </ProtectedRoute>
  );
}