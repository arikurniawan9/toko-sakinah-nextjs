import Link from 'next/link';

const HomeContent = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-pastel-purple-100 to-pastel-purple-300">
      <div className="max-w-3xl w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-extrabold text-pastel-purple-900 sm:text-5xl md:text-6xl">
            Selamat Datang di Toko Sakinah
          </h1>
          <p className="mt-4 text-xl text-pastel-purple-700 max-w-2xl mx-auto">
            Sistem Informasi Penjualan & Inventaris Multi-Toko
          </p>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-pastel-purple-800 mb-4">Fitur Utama</h2>
              <ul className="space-y-3 text-left">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 text-pastel-purple-600 mt-0.5">•</span>
                  <span className="ml-3 text-pastel-purple-700">Manajemen penjualan dan inventaris</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 text-pastel-purple-600 mt-0.5">•</span>
                  <span className="ml-3 text-pastel-purple-700">Multi-toko dan multi-role</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 text-pastel-purple-600 mt-0.5">•</span>
                  <span className="ml-3 text-pastel-purple-700">Laporan keuangan lengkap</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 text-pastel-purple-600 mt-0.5">•</span>
                  <span className="ml-3 text-pastel-purple-700">Manajemen pelanggan dan supplier</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 text-pastel-purple-600 mt-0.5">•</span>
                  <span className="ml-3 text-pastel-purple-700">Laporan piutang dan pengeluaran</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-pastel-purple-800 mb-4">Peran Pengguna</h2>
              <ul className="space-y-3 text-left">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 text-pastel-purple-600 mt-0.5">•</span>
                  <span className="ml-3 text-pastel-purple-700">Manager: Mengelola beberapa toko</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 text-pastel-purple-600 mt-0.5">•</span>
                  <span className="ml-3 text-pastel-purple-700">Admin: Mengelola data di toko</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 text-pastel-purple-600 mt-0.5">•</span>
                  <span className="ml-3 text-pastel-purple-700">Kasir: Melakukan transaksi</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 text-pastel-purple-600 mt-0.5">•</span>
                  <span className="ml-3 text-pastel-purple-700">Pelayan: Melayani pelanggan</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-5 h-5 text-pastel-purple-600 mt-0.5">•</span>
                  <span className="ml-3 text-pastel-purple-700">Gudang: Mengelola stok barang</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-pastel-purple-200">
            <p className="text-lg text-pastel-purple-800 font-medium">
              Sistem multi-role & multi-toko untuk efisiensi operasional toko Anda
            </p>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-pastel-purple-600 text-sm">
            Login untuk mengakses sistem sesuai peran Anda
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomeContent;