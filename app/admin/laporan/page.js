// app/admin/laporan/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useDarkMode } from '../../../components/DarkModeContext';
import { Download, Calendar, Search, FileText, TrendingUp, Users, CreditCard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function ReportDashboard() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('daily');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [totalSalesAmount, setTotalSalesAmount] = useState(0);
  const [totalTransactionsCount, setTotalTransactionsCount] = useState(0);
  const [averageTransactionValue, setAverageTransactionValue] = useState(0);
  const [chartSalesData, setChartSalesData] = useState([]);
  const [chartProductSalesData, setChartProductSalesData] = useState([]);
  const [recentTransactionsData, setRecentTransactionsData] = useState([]);

  const COLORS = ['#C084FC', '#A78BFA', '#8B5CF6', '#7C3AED', '#6D28D9']; // Added one more color for consistency

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/laporan?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&type=${reportType}`);
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data laporan');
      }
      
      const data = await response.json();
      setTotalSalesAmount(data.totalSales);
      setTotalTransactionsCount(data.totalTransactions);
      setAverageTransactionValue(data.averageTransaction);
      setChartSalesData(data.dailySalesData);
      setChartProductSalesData(data.productSalesData);
      setRecentTransactionsData(data.recentTransactions);

    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sales data when dependencies change
  useEffect(() => {
    fetchSales();
  }, [reportType, dateRange]);

  const handleFilter = () => {
    fetchSales();
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Laporan Penjualan</h1>
          <div className="flex flex-wrap gap-2">
            <button
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                darkMode 
                  ? 'bg-pastel-purple-600 hover:bg-pastel-purple-700' 
                  : 'bg-pastel-purple-600 hover:bg-pastel-purple-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-purple-500 min-w-[100px]`}
            >
              <Download className="h-4 w-4 mr-1" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Report Filters */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-pastel-purple-200'} shadow rounded-lg p-4 sm:p-6 mb-6 border`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Tipe Laporan
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-pastel-purple-500 focus:border-pastel-purple-500 sm:text-sm ${
                  darkMode 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-pastel-purple-300 bg-white text-gray-900'
                }`}
              >
                <option className={`${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`} value="daily">Harian</option>
                <option className={`${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`} value="weekly">Mingguan</option>
                <option className={`${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`} value="monthly">Bulanan</option>
                <option className={`${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`} value="yearly">Tahunan</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Tanggal Awal
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-pastel-purple-500 focus:border-pastel-purple-500 sm:text-sm ${
                  darkMode 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-pastel-purple-300 bg-white text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-pastel-purple-500 focus:border-pastel-purple-500 sm:text-sm ${
                  darkMode 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-pastel-purple-300 bg-white text-gray-900'
                }`}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleFilter}
                className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                  darkMode 
                    ? 'bg-pastel-purple-600 text-white hover:bg-pastel-purple-700' 
                    : 'bg-pastel-purple-600 text-white hover:bg-pastel-purple-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-purple-500`}
              >
                <Search className="h-4 w-4 inline mr-1" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-xl shadow ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border`}>
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${
                darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'
              }`}>
                <CreditCard className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className={`text-sm font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Total Penjualan</h3>
                <p className={`text-2xl font-bold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Rp {totalSalesAmount.toLocaleString('id-ID')}</p>
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
                <FileText className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className={`text-sm font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Total Transaksi</h3>
                <p className={`text-2xl font-bold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>{totalTransactionsCount}</p>
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
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className={`text-sm font-medium ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Rata-rata/Transaksi</h3>
                <p className={`text-2xl font-bold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Rp {averageTransactionValue.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sales Chart */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Grafik Penjualan</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartSalesData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4B5563' : '#E5E7EB'} />
                  <XAxis 
                    dataKey="name" 
                    stroke={darkMode ? '#D1D5DB' : '#6B7280'} 
                  />
                  <YAxis 
                    stroke={darkMode ? '#D1D5DB' : '#6B7280'} 
                    tickFormatter={(value) => `Rp${(value / 1000000).toFixed(1)}Jt`} 
                  />
                  <Tooltip 
                    formatter={(value) => [`Rp${value.toLocaleString('id-ID')}`, 'Penjualan']}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0 && payload[0].payload.fullDate) {
                        return `Tanggal: ${new Date(payload[0].payload.fullDate).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`;
                      }
                      return `Hari: ${label}`;
                    }}
                    contentStyle={darkMode ? { 
                      backgroundColor: '#1F2937', 
                      borderColor: '#374151', 
                      color: 'white' 
                    } : {}}
                    itemStyle={darkMode ? { color: 'white' } : {}}
                    labelStyle={darkMode ? { color: 'white', fontWeight: 'bold' } : {}}
                  />
                  <Legend />
                  <Bar dataKey="sales" name="Penjualan" fill={darkMode ? '#C084FC' : '#C084FC'} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Product Sales Chart */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl shadow border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Produk Terlaris</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartProductSalesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    labelStyle={darkMode ? { fill: 'white' } : {}}
                  >
                    {chartProductSalesData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={darkMode ? COLORS[index % COLORS.length] : COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} item`, 'Jumlah']}
                    contentStyle={darkMode ? { 
                      backgroundColor: '#1F2937', 
                      borderColor: '#374151', 
                      color: 'white' 
                    } : {}}
                    itemStyle={darkMode ? { color: 'white' } : {}}
                    labelStyle={darkMode ? { color: 'white', fontWeight: 'bold' } : {}}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow border overflow-hidden`}>
          <div className={`px-6 py-5 border-b ${
            darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
          }`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Transaksi Terbaru</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    ID Transaksi
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Kasir
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Tanggal
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Total
                  </th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    darkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Metode
                  </th>
                </tr>
              </thead>
              <tbody className={darkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}>
                {recentTransactionsData.map((transaction, index) => (
                  <tr key={transaction.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      #{transaction.id.substring(0, 8)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {transaction.cashierName}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {new Date(transaction.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Rp {transaction.totalAmount.toLocaleString('id-ID')}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {transaction.paymentMethod}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}