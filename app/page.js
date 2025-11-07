'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Redirect based on role
      switch(session.user.role) {
        case 'ADMIN':
          window.location.href = '/admin';
          break;
        case 'CASHIER':
          window.location.href = '/kasir';
          break;
        case 'ATTENDANT':
          window.location.href = '/pelayan';
          break;
        default:
          break;
      }
    }
  }, [status, session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-purple-50 to-pastel-purple-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-purple-500 mx-auto"></div>
          <p className="mt-4 text-pastel-purple-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pastel-purple-100 to-pastel-purple-300 p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-pastel-purple-700 mb-2 font-poppins">Toko Sakinah</h1>
          <p className="text-lg text-pastel-purple-600">Aplikasi Kasir untuk Toko Pakaian</p>
        </div>
        
        <div className="mt-8 space-y-4">
          <Link href="/login/admin" className="block w-full py-4 px-6 bg-pastel-purple-400 hover:bg-pastel-purple-500 text-white font-semibold rounded-lg shadow-md transition duration-300 transform hover:scale-105 text-center">
            Login Admin
          </Link>
          
          <Link href="/login/kasir" className="block w-full py-4 px-6 bg-pastel-purple-500 hover:bg-pastel-purple-600 text-white font-semibold rounded-lg shadow-md transition duration-300 transform hover:scale-105 text-center">
            Login Kasir
          </Link>
          
          <Link href="/login/pelayan" className="block w-full py-4 px-6 bg-pastel-purple-600 hover:bg-pastel-purple-700 text-white font-semibold rounded-lg shadow-md transition duration-300 transform hover:scale-105 text-center">
            Login Pelayan
          </Link>
        </div>
        
        <div className="mt-6 text-center">
          <Link href="/login" className="text-pastel-purple-600 hover:text-pastel-purple-800 text-sm">
            Login dengan role khusus
          </Link>
        </div>
        
        <div className="mt-12 text-center text-pastel-purple-700 text-sm">
          <p>Sistem Informasi Penjualan &amp; Inventaris</p>
        </div>
      </div>
    </div>
  );
}