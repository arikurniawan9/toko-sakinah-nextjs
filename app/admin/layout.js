// app/admin/layout.js
'use client';

import { DarkModeProvider } from '../../components/DarkModeContext';

export default function AdminLayout({ children }) {
  return (
    <DarkModeProvider>
      {children}
    </DarkModeProvider>
  );
}