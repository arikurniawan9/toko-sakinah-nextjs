'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Home() {
  // Redirect if already logged in
  useEffect(() => {
    // This logic will be handled by middleware or server-side checks in Next-Auth v5
    // For now, we'll keep it simple and assume unauthenticated users land here.
  }, []);

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