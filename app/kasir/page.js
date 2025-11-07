// app/kasir/page.js
'use client';

import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../components/ProtectedRoute';
import Link from 'next/link';
import { Calculator, History, CreditCard, ShoppingCart } from 'lucide-react';

export default function CashierDashboard() {
  const { data: session } = useSession();

  // Menu items for cashier
  const menuItems = [
    {
      title: "Transaksi Baru",
      description: "Buat transaksi penjualan baru",
      href: "/kasir/transaksi",
      icon: Calculator,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Riwayat Transaksi",
      description: "Lihat riwayat transaksi hari ini",
      href: "/kasir/riwayat",
      icon: History,
      color: "bg-blue-100 text-blue-600",
    },
  ];

  return (
    <ProtectedRoute requiredRole="CASHIER">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Kasir</h1>
                <p className="mt-1 text-gray-600">Sistem Penjualan Toko Sakinah</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Halo, {session?.user?.name}</p>
                  <p className="text-xs text-gray-500">Kasir</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-pastel-purple-400 flex items-center justify-center text-white font-bold">
                  {session?.user?.name?.charAt(0).toUpperCase() || 'K'}
                </div>
                <Link 
                  href="/api/auth/signout" 
                  className="text-sm text-pastel-purple-600 hover:text-pastel-purple-800 font-medium"
                  onClick={(e) => {
                    e.preventDefault();
                    import('next-auth/react').then((module) => {
                      module.signOut({ callbackUrl: '/' });
                    });
                  }}
                >
                  Logout
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800">Menu Kasir</h2>
            <p className="text-gray-600">Pilih menu untuk melakukan transaksi</p>
          </div>

          {/* Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Link 
                  key={index}
                  href={item.href}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 overflow-hidden group"
                >
                  <div className="p-8 text-center">
                    <div className={`${item.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                      <IconComponent size={32} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 mb-6">{item.description}</p>
                    <div className="flex items-center justify-center text-pastel-purple-600 font-medium">
                      <span>Mulai</span>
                      <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Ringkasan Hari Ini</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow border border-gray-200 text-center">
                <div className="mx-auto p-3 bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Transaksi Selesai</h3>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow border border-gray-200 text-center">
                <div className="mx-auto p-3 bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Total Item Terjual</h3>
                <p className="text-2xl font-bold text-gray-900">45</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow border border-gray-200 text-center">
                <div className="mx-auto p-3 bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                  <Calculator className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-600">Total Pendapatan</h3>
                <p className="text-2xl font-bold text-gray-900">Rp 2.450.000</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}