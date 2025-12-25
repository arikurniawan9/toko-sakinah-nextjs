// components/admin/Dashboard.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { subDays, format } from 'date-fns';

import { useUserTheme } from '../UserThemeContext';
import useDashboardData from '../../lib/hooks/useDashboardData';
import StatCard from './StatCard';
import RecentActivityTable from './RecentActivityTable';
import BestSellingProductsTable from './BestSellingProductsTable';
import SalesChart from './SalesChart'; // Import the new chart
import {
  ShoppingBag,
  Users,
  CreditCard,
  UserRound,
  DollarSign,
  TrendingUp,
  CalendarIcon,
  Package,
} from 'lucide-react';
import NotificationDropdown from '../notifications/NotificationDropdown';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (session.user.role !== 'ADMIN' || !session.user.storeId) {
        window.location.href = '/unauthorized';
      }
    }
  }, [status, session]);

  const [startDate, setStartDate] = useState(subDays(new Date(), 6));
  const [endDate, setEndDate] = useState(new Date());
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    if (startDate && endDate && startDate > endDate) {
      setDateError('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
    } else {
      setDateError('');
    }
  }, [startDate, endDate]);

  const [pendingDistributions, setPendingDistributions] = useState(0);
  const [pendingDistributionsLoading, setPendingDistributionsLoading] = useState(true);

  const {
    totalSales,
    totalProfit,
    totalTransactions,
    totalProductsCount,
    totalMembersCount,
    activeEmployeesCount,
    recentActivitiesData,
    bestSellingProducts,
    salesData, // Assuming useDashboardData returns salesData for the chart
    loading,
    error,
  } = useDashboardData(startDate, endDate);

  useEffect(() => {
    const fetchPendingDistributions = async () => {
      try {
        setPendingDistributionsLoading(true);
        const response = await fetch('/api/admin/distributions/pending-count');
        const data = await response.json();
        if (response.ok) {
          setPendingDistributions(data.pendingDistributions || 0);
        }
      } catch (err) {
        console.error('Error fetching pending distributions:', err);
      } finally {
        setPendingDistributionsLoading(false);
      }
    };

    if (status === 'authenticated' && session?.user?.storeId) {
      fetchPendingDistributions();
    }
  }, [status, session]);

  if (error) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold text-red-500">Gagal memuat data</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">{error.message || 'Terjadi kesalahan saat memuat data dashboard'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Muat Ulang
        </button>
      </div>
    );
  }

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Dasbor Analitik
        </h2>
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-4 sm:mt-0">
          <NotificationDropdown />
          <div className="flex items-center">
            <CalendarIcon className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              className={`p-2 rounded-md border w-32 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              dateFormat="dd/MM/yyyy"
            />
            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>-</span>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              className={`p-2 rounded-md border w-32 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              dateFormat="dd/MM/yyyy"
            />
          </div>
        </div>
      </div>

      {dateError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {dateError}
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard title="Total Penjualan" value={formatCurrency(totalSales)} icon={DollarSign} darkMode={darkMode} loading={loading} />
            <StatCard title="Total Keuntungan" value={formatCurrency(totalProfit)} icon={TrendingUp} darkMode={darkMode} loading={loading} />
            <StatCard title="Total Transaksi" value={totalTransactions} icon={CreditCard} darkMode={darkMode} loading={loading} />
          </div>
          <SalesChart salesData={salesData} loading={loading} darkMode={darkMode} />
          <BestSellingProductsTable products={bestSellingProducts} darkMode={darkMode} loading={loading} />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            <StatCard title="Total Produk" value={totalProductsCount} icon={ShoppingBag} darkMode={darkMode} href="/admin/produk" loading={loading} />
            <StatCard title="Total Member" value={totalMembersCount} icon={UserRound} darkMode={darkMode} href="/admin/member" loading={loading} />
            <StatCard title="Karyawan Aktif" value={activeEmployeesCount} icon={Users} darkMode={darkMode} href="/admin/pelayan" loading={loading} />
            <StatCard
              title="Distribusi Tertunda"
              value={pendingDistributions}
              icon={Package}
              darkMode={darkMode}
              href="/admin/distributions/pending"
              loading={pendingDistributionsLoading}
              warning={pendingDistributions > 0}
            />
          </div>
          <RecentActivityTable recentActivitiesData={recentActivitiesData} darkMode={darkMode} loading={loading} />
        </div>
      </div>
    </main>
  );
}
