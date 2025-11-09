
// app/unauthorized/page.js
'use client';

import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
      <div className="max-w-md w-full text-center space-y-8 bg-white rounded-2xl shadow-xl p-8 border border-red-200">
        <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-red-700">Akses Ditolak</h1>
        <p className="text-lg text-red-600">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        <Link href="/" className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition duration-300">
          Kembali ke Halaman Utama
        </Link>
      </div>
    </div>
  );
}
