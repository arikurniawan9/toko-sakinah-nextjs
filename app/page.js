'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HomeHeader from '@/components/HomeHeader';
import HomeContent from '@/components/HomeContent';
import { ROLES } from '@/lib/constants';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      // Jika role adalah role per toko, arahkan ke select-store
      if ([ROLES.ADMIN, ROLES.CASHIER, ROLES.ATTENDANT].includes(session.user.role)) {
        router.push('/select-store');
        return;
      }

      // Jika role adalah MANAGER, tampilkan halaman manager
      if (session.user.role === ROLES.MANAGER) {
        router.push('/manager');
        return;
      }

      // Jika role adalah WAREHOUSE, arahkan ke warehouse dashboard
      if (session.user.role === ROLES.WAREHOUSE) {
        router.push('/warehouse');
        return;
      }
    }
  }, [status, session, router]);

  // Jika sedang loading, tampilkan loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-purple-100 to-pastel-purple-300 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-purple-600 mx-auto"></div>
          <p className="mt-4 text-pastel-purple-700">Memuat...</p>
        </div>
      </div>
    );
  }

  // Jika sudah login, arahkan ke halaman sesuai role
  if (status === 'authenticated') {
    return null; // Redirect akan terjadi di useEffect
  }

  // Jika belum login, tampilkan halaman utama dengan header dan konten
  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-purple-100 to-pastel-purple-300">
      <HomeHeader />
      <HomeContent />
    </div>
  );
}