'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from './ThemeContext';

export default function ShopNameUpdater() {
  const { data: session, status } = useSession();
  const { updateShopName, resetToDefaultShopName } = useTheme();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Jika user memiliki akses ke toko (melalui storeAccess), gunakan nama toko tersebut
      if (session.user.storeAccess && session.user.storeAccess.name) {
        updateShopName(session.user.storeAccess.name);
      } else {
        // Kembalikan ke nama toko default jika user tidak memiliki akses ke toko tertentu
        resetToDefaultShopName();
      }
    } else if (status === 'unauthenticated') {
      // Reset ke nama toko default saat tidak login
      resetToDefaultShopName();
    }
  }, [session, status, updateShopName, resetToDefaultShopName]);

  return null; // Component hanya untuk efek samping, tidak merender apa pun
}