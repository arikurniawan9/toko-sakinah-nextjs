// components/admin/SalesChart.js
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useUserTheme } from '../UserThemeContext';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

const CustomTooltip = ({ active, payload, label }) => {
    const { userTheme } = useUserTheme();
    const darkMode = userTheme.darkMode;

    if (active && payload && payload.length) {
      return (
        <div className={`p-4 shadow-lg rounded-md ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <p className={`label font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{`Tanggal : ${label}`}</p>
          <p className="intro text-blue-500">{`Penjualan : ${formatCurrency(payload[0].value)}`}</p>
          <p className="intro text-green-500">{`Keuntungan : ${formatCurrency(payload[1].value)}`}</p>
        </div>
      );
    }

    return null;
  };

const SalesChart = ({ salesData, loading, darkMode }) => {

    if (loading) {
        return (
          <div className={`p-6 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'} h-80 animate-pulse`}>
             <div className="h-full bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
        );
      }

  if (!salesData || salesData.length === 0) {
    return (
        <div className={`p-6 rounded-xl shadow flex items-center justify-center h-80 ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
        Tidak ada data untuk ditampilkan.
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Grafik Penjualan & Keuntungan</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={salesData}>
          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4A5568' : '#E2E8F0'} />
          <XAxis dataKey="date" stroke={darkMode ? '#A0AEC0' : '#4A5568'} />
          <YAxis
            tickFormatter={(value) => new Intl.NumberFormat('id-ID').format(value)}
            stroke={darkMode ? '#A0AEC0' : '#4A5568'}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line type="monotone" dataKey="totalSales" name="Penjualan" stroke="#3b82f6" strokeWidth={2} />
          <Line type="monotone" dataKey="totalProfit" name="Keuntungan" stroke="#22c55e" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;
