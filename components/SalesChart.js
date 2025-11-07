// components/SalesChart.js
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const SalesChart = ({ darkMode = false }) => {
  // Data untuk chart penjualan harian
  const dailySalesData = [
    { name: 'Sen', sales: 1200000 },
    { name: 'Sel', sales: 1900000 },
    { name: 'Rab', sales: 1500000 },
    { name: 'Kam', sales: 2100000 },
    { name: 'Jum', sales: 2800000 },
    { name: 'Sab', sales: 3200000 },
    { name: 'Min', sales: 2600000 },
  ];

  // Data untuk chart penjualan produk terlaris
  const productSalesData = [
    { name: 'Kemeja', value: 400 },
    { name: 'Celana', value: 300 },
    { name: 'Jaket', value: 200 },
    { name: 'Aksesoris', value: 100 },
  ];

  const COLORS = ['#C084FC', '#A78BFA', '#8B5CF6', '#7C3AED'];

  // Warna untuk mode gelap
  const darkColors = ['#C084FC', '#A78BFA', '#8B5CF6', '#7C3AED'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Chart Penjualan Harian */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Penjualan Harian (7 Hari Terakhir)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dailySalesData}
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
                tickFormatter={(value) => `Rp${value/1000000}Jt`} 
              />
              <Tooltip 
                formatter={(value) => [`Rp${value.toLocaleString('id-ID')}`, 'Penjualan']}
                labelFormatter={(label) => `Hari: ${label}`}
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

      {/* Chart Produk Terlaris */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-xl`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Produk Terlaris</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={productSalesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                labelStyle={darkMode ? { fill: 'white' } : {}}
              >
                {productSalesData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={darkMode ? darkColors[index % darkColors.length] : COLORS[index % COLORS.length]} 
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
  );
};

export default SalesChart;