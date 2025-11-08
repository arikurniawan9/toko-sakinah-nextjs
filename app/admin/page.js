// app/admin/page.js
'use client';

import { useSession } from 'next-auth/react';

import ProtectedRoute from '../../components/ProtectedRoute';

import Link from 'next/link';

import Sidebar from '../../components/Sidebar';

import SalesChart from '../../components/SalesChart';

import { useDarkMode } from '../../components/DarkModeContext';

import { useEffect, useState } from 'react';

import { 

  ShoppingBag, 

  Tag, 

  Truck, 

  Users, 

  CreditCard, 

  UserRound, 

  BarChart3 

} from 'lucide-react';



export default function AdminDashboard() {

  const { data: session } = useSession();

  const { darkMode } = useDarkMode();



  const [totalProductsCount, setTotalProductsCount] = useState(0);

  const [totalMembersCount, setTotalMembersCount] = useState(0);

  const [transactionsTodayCount, setTransactionsTodayCount] = useState(0);

  const [activeEmployeesCount, setActiveEmployeesCount] = useState(0);

  const [dashboardSalesChartData, setDashboardSalesChartData] = useState([]);

  const [recentActivitiesData, setRecentActivitiesData] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');



  useEffect(() => {

    const fetchDashboardData = async () => {

      try {

        setLoading(true);

        const response = await fetch('/api/dashboard');

        if (!response.ok) {

          throw new Error('Failed to fetch dashboard data');

        }

        const data = await response.json();

        

        setTotalProductsCount(data.totalProducts);

        setTotalMembersCount(data.totalMembers);

        setTransactionsTodayCount(data.transactionsToday);

        setActiveEmployeesCount(data.activeEmployees);

        setDashboardSalesChartData(data.dailySalesChartData);

        setRecentActivitiesData(data.recentTransactions);

      } catch (err) {

        console.error('Error fetching dashboard data:', err);

        setError('Failed to load dashboard data: ' + err.message);

      } finally {

        setLoading(false);

      }

    };



    fetchDashboardData();

  }, []); // Run once on component mount



  if (loading) {

    return (

      <ProtectedRoute requiredRole="ADMIN">

        <Sidebar>

          <main className="w-full px-4 sm:px-6 lg:px-8 py-8">

            <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Loading Ringkasan Sistem...</h2>

            {/* You could add a skeleton loader here */}

          </main>

        </Sidebar>

      </ProtectedRoute>

    );    

  }



  if (error) {

    return (

      <ProtectedRoute requiredRole="ADMIN">

        <Sidebar>

          <main className="w-full px-4 sm:px-6 lg:px-8 py-8">

            <h2 className={`text-2xl font-semibold text-red-600 mb-6`}>Error: {error}</h2>

          </main>

        </Sidebar>

      </ProtectedRoute>

    );

  }



  return (

    <ProtectedRoute requiredRole="ADMIN">

      <Sidebar>

        {/* Main Content */}

        <main className="w-full px-4 sm:px-6 lg:px-8 py-8">

          {/* Stats Overview */}

          <div className="mb-8">

            <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Ringkasan Sistem</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              <div className={`p-6 rounded-xl shadow ${

                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'

              } border`}>

                <div className="flex items-center">

                  <div className={`p-3 rounded-lg ${

                    darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'

                  }`}>

                    <ShoppingBag className="h-6 w-6" />

                  </div>

                  <div className="ml-4">

                    <h3 className={`text-sm font-medium ${

                      darkMode ? 'text-gray-400' : 'text-gray-600'

                    }`}>Total Produk</h3>

                    <p className={`text-2xl font-bold ${

                      darkMode ? 'text-white' : 'text-gray-900'

                    }`}>{totalProductsCount}</p>

                  </div>

                </div>

              </div>

              

              <div className={`p-6 rounded-xl shadow ${

                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'

              } border`}>

                <div className="flex items-center">

                  <div className={`p-3 rounded-lg ${

                    darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'

                  }`}>

                    <UserRound className="h-6 w-6" />

                  </div>

                  <div className="ml-4">

                    <h3 className={`text-sm font-medium ${

                      darkMode ? 'text-gray-400' : 'text-gray-600'

                    }`}>Total Member</h3>

                    <p className={`text-2xl font-bold ${

                      darkMode ? 'text-white' : 'text-gray-900'

                    }`}>{totalMembersCount}</p>

                  </div>

                </div>

              </div>

              

              <div className={`p-6 rounded-xl shadow ${

                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'

              } border`}>

                <div className="flex items-center">

                  <div className={`p-3 rounded-lg ${

                    darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'

                  }`}>

                    <CreditCard className="h-6 w-6" />

                  </div>

                  <div className="ml-4">

                    <h3 className={`text-sm font-medium ${

                      darkMode ? 'text-gray-400' : 'text-gray-600'

                    }`}>Transaksi Hari Ini</h3>

                    <p className={`text-2xl font-bold ${

                      darkMode ? 'text-white' : 'text-gray-900'

                    }`}>{transactionsTodayCount}</p>

                  </div>

                </div>

              </div>

              

              <div className={`p-6 rounded-xl shadow ${

                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'

              } border`}>

                <div className="flex items-center">

                  <div className={`p-3 rounded-lg ${

                    darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-600'

                  }`}>

                    <Users className="h-6 w-6" />

                  </div>

                  <div className="ml-4">

                    <h3 className={`text-sm font-medium ${

                      darkMode ? 'text-gray-400' : 'text-gray-600'

                    }`}>Karyawan Aktif</h3>

                    <p className={`text-2xl font-bold ${

                      darkMode ? 'text-white' : 'text-gray-900'

                    }`}>{activeEmployeesCount}</p>

                  </div>

                </div>

              </div>

            </div>

          </div>



          {/* Chart Section */}

          <div className="mb-8">

            <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Grafik Penjualan</h2>

            <div className={`rounded-xl shadow ${

              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'

            } border`}>

              <div className="p-6">

                <SalesChart darkMode={darkMode} salesData={dashboardSalesChartData} />

              </div>

            </div>

          </div>



          {/* Recent Activity Log */}

          <div>

            <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Log Aktivitas Kasir</h2>

            <div className={`rounded-xl shadow ${

              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'

            } border overflow-hidden`}>

              <table className="min-w-full divide-y divide-gray-200">

                <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>

                  <tr>

                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${

                      darkMode ? 'text-gray-300' : 'text-gray-500'

                    }`}>

                      Waktu

                    </th>

                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${

                      darkMode ? 'text-gray-300' : 'text-gray-500'

                    }`}>

                      Kasir

                    </th>

                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${

                      darkMode ? 'text-gray-300' : 'text-gray-500'

                    }`}>

                      Transaksi

                    </th>

                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${

                      darkMode ? 'text-gray-300' : 'text-gray-500'

                    }`}>

                      Jumlah

                    </th>

                  </tr>

                </thead>

                <tbody className={darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}>

                  {recentActivitiesData.length === 0 ? (

                    <tr>

                      <td colSpan="4" className={`px-6 py-4 text-center text-sm ${

                        darkMode ? 'text-gray-400' : 'text-gray-500'

                      }`}>

                        Tidak ada aktivitas terbaru.

                      </td>

                    </tr>

                  ) : (

                    recentActivitiesData.map((activity) => (

                      <tr key={activity.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>

                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${

                          darkMode ? 'text-gray-300' : 'text-gray-500'

                        }`}>

                          {new Date(activity.date).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}

                        </td>

                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${

                          darkMode ? 'text-white' : 'text-gray-900'

                        }`}>

                          {activity.cashierName}

                        </td>

                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${

                          darkMode ? 'text-gray-400' : 'text-gray-500'

                        }`}>

                          #{activity.id.substring(0, 8)}

                        </td>

                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${

                          darkMode ? 'text-white' : 'text-gray-900'

                        }`}>

                          Rp {activity.totalAmount.toLocaleString('id-ID')}

                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </main>

      </Sidebar>

    </ProtectedRoute>

  );

}