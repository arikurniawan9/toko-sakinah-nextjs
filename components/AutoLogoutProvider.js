// components/AutoLogoutProvider.js
'use client';

import { useSession } from 'next-auth/react';
import useAutoLogout from '@/hooks/useAutoLogout';

const AutoLogoutProvider = ({ children }) => {
  const { data: session } = useSession();
  
  // Hanya aktifkan auto logout jika pengguna sudah login
  if (session) {
    useAutoLogout(60000); // 1 menit
  }

  return <>{children}</>;
};

export default AutoLogoutProvider;