// app/admin/page.js
'use client';

import { useSession } from 'next-auth/react';

import ProtectedRoute from '../../components/ProtectedRoute';

import Link from 'next/link';

import SalesChart from '../../components/SalesChart';

import { useDarkMode } from '../../components/DarkModeContext';
import useDashboardData from '../../lib/hooks/useDashboardData';
import StatCard from '../../components/admin/StatCard';
import RecentActivityTable from '../../components/admin/RecentActivityTable';
import SalesChartSection from '../../components/admin/SalesChartSection';
import { 
  ShoppingBag, 
  Tag, 
  Truck, 
  Users, 
  CreditCard, 
  UserRound, 
  BarChart3 
} from 'lucide-react';
import { useState } from 'react';


export default function AdminDashboard() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const [dateRange, setDateRange] = useState('7_days'); // Default to last 7 days

  const {
    totalProductsCount,
    totalMembersCount,
    transactionsTodayCount,
    activeEmployeesCount,
    dashboardSalesChartData,
    recentActivitiesData,
    loading,
    error,
  } = useDashboardData();



  if (loading) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Loading Ringkasan Sistem...</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`p-6 rounded-xl shadow ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } border animate-pulse`}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  } h-12 w-12`}></div>
                  <div className="ml-4">
                    <div className={`h-4 w-24 rounded ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    } mb-2`}></div>
                    <div className={`h-6 w-16 rounded ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={`rounded-xl shadow ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border h-80 animate-pulse mb-8`}></div>
          <div className={`rounded-xl shadow ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border h-64 animate-pulse`}></div>
        </main>
      </ProtectedRoute>
    );    
  }



    if (error) {



      return (



        <ProtectedRoute requiredRole="ADMIN">



          <main className="w-full px-4 sm:px-6 lg:px-8 py-8">



            <h2 className={`text-2xl font-semibold text-red-600 mb-6`}>Error: {error}</h2>



          </main>



        </ProtectedRoute>



      );



    }



    return (



      <ProtectedRoute requiredRole="ADMIN">



        {/* Main Content */}



        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">



          {/* Stats Overview */}



          <div className="mb-8">



            <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Ringkasan Sistem</h2>



            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">



                                                        <StatCard



                                                          title="Total Produk"



                                                          value={totalProductsCount}



                                                          icon={ShoppingBag}



                                                          bgColorClass={darkMode ? 'bg-purple-900/30' : 'bg-purple-100'}



                                                          textColorClass={darkMode ? 'text-purple-400' : 'text-purple-600'}



                                                          darkMode={darkMode}



                                                          href="/admin/produk"



                                                        />



                                          



                                                        <StatCard



                                                          title="Total Member"



                                                          value={totalMembersCount}



                                                          icon={UserRound}



                                                          bgColorClass={darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}



                                                          textColorClass={darkMode ? 'text-blue-400' : 'text-blue-600'}



                                                          darkMode={darkMode}



                                                          href="/admin/member"



                                                        />



                                          



                                                        <StatCard



                                                          title="Transaksi Hari Ini"



                                                          value={transactionsTodayCount}



                                                          icon={CreditCard}



                                                          bgColorClass={darkMode ? 'bg-green-900/30' : 'bg-green-100'}



                                                          textColorClass={darkMode ? 'text-green-400' : 'text-green-600'}



                                                          darkMode={darkMode}



                                                          href="/admin/transaksi"



                                                        />



                                          



                                                        <StatCard



                                                          title="Karyawan Aktif"



                                                          value={activeEmployeesCount}



                                                          icon={Users}



                                                          bgColorClass={darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}



                                                          textColorClass={darkMode ? 'text-yellow-400' : 'text-yellow-600'}



                                                          darkMode={darkMode}



                                                          href="/admin/pelayan"



                                                        />



            </div>



          </div>



  



          <div className="mb-8">
            <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Grafik Penjualan</h2>
            <div className="flex justify-end mb-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className={`p-2 rounded-md border ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="7_days">7 Hari Terakhir</option>
                <option value="30_days">30 Hari Terakhir</option>
                <option value="all_time">Semua Waktu</option>
              </select>
            </div>
            <SalesChartSection darkMode={darkMode} dashboardSalesChartData={dashboardSalesChartData} dateRange={dateRange} />
          </div>



  



          <RecentActivityTable recentActivitiesData={recentActivitiesData} darkMode={darkMode} />



        </main>



      </ProtectedRoute>



    );

}