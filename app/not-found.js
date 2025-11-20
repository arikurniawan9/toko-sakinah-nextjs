import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">404 - Halaman Tidak Ditemukan</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Maaf, halaman yang Anda cari tidak ditemukan.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}