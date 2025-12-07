// components/ManagementDashboard.js
'use client';

import { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { useDashboardCustomization } from './DashboardCustomizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { 
  DollarSign, TrendingUp, Users, Package, 
  Eye, EyeOff, Settings, RotateCcw, Calendar,
  UserCheck, ShoppingCart, Tag
} from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ManagementDashboard({ initialLevel = 'executive', dashboardData, loading }) {
  const {
    currentLevel,
    layouts,
    visibleWidgets,
    isEditing,
    setLevel,
    toggleEditing,
    updateLayout,
    toggleWidget,
    resetLayout
  } = useDashboardCustomization();

  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const currentLayout = layouts[currentLevel] || [];
  const currentWidgets = visibleWidgets[currentLevel] || [];

  // Ambil data yang sesuai dengan level
  const getDataByLevel = () => {
    if (!dashboardData) return {};
    
    switch (currentLevel) {
      case 'executive':
        return dashboardData.executive || dashboardData.data || {};
      case 'operational':
        return dashboardData.operational || dashboardData.data || {};
      case 'tactical':
        return dashboardData.tactical || dashboardData.data || {};
      default:
        return dashboardData.data || {};
    }
  };

  const dashboardDataByLevel = getDataByLevel();

  // Handler untuk mengubah layout
  const onLayoutChange = (currentLayout, allLayouts) => {
    updateLayout(currentLayout);
  };

  // Widget untuk Executive Dashboard
  const ExecutiveWidgets = {
    'revenue-chart': () => (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendapatan Harian</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardDataByLevel.dailyTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    ),

    'performance-kpi': () => (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">KPI Kinerja</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold">
                {dashboardDataByLevel.financial?.totalRevenue ? 
                  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(dashboardDataByLevel.financial.totalRevenue) : 
                  'Rp 0'}
              </div>
              <div className="text-xs text-green-600">Total Pendapatan</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold">{dashboardDataByLevel.financial?.totalTransactions || 0}</div>
              <div className="text-xs text-blue-600">Total Transaksi</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold">
                {dashboardDataByLevel.financial?.avgTransactionValue ? 
                  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(dashboardDataByLevel.financial.avgTransactionValue) : 
                  'Rp 0'}
              </div>
              <div className="text-xs text-yellow-600">Rata-rata Transaksi</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold">{dashboardDataByLevel.inventory?.lowStockProducts || 0}</div>
              <div className="text-xs text-purple-600">Stok Rendah</div>
            </div>
          </div>
        </CardContent>
      </Card>
    ),

    'top-products': () => (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Produk Terlaris</CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(dashboardDataByLevel.topProducts || []).slice(0, 5).map((product, index) => (
              <div key={index} className="flex justify-between items-center py-1 border-b">
                <span className="text-sm">{product.name}</span>
                <span className="text-sm font-medium">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.revenue)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ),

    'low-stock-alert': () => (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Peringatan Stok Rendah</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboardDataByLevel.inventory?.lowStockProducts || 0}</div>
          <p className="text-xs text-muted-foreground">Produk dengan stok < 5</p>
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
            {(dashboardDataByLevel.lowStockProducts || []).slice(0, 5).map((product, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span>{product.name}</span>
                <span className="text-red-600 font-medium">{product.stock} tersisa</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  };

  // Widget untuk Operational Dashboard
  const OperationalWidgets = {
    'daily-sales': () => (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Penjualan Harian</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardDataByLevel.inventory?.dailyMovement || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    ),

    'staff-performance': () => (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Kinerja Staf</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h4 className="font-medium">Kasir</h4>
            {(dashboardDataByLevel.staff?.cashiers || []).slice(0, 3).map((cashier, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm">{cashier.name}</span>
                <span className="text-sm font-medium">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(cashier.totalSales)}
                </span>
              </div>
            ))}
            
            <h4 className="font-medium mt-4">Pelayan</h4>
            {(dashboardDataByLevel.staff?.attendants || []).slice(0, 3).map((attendant, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm">{attendant.name}</span>
                <span className="text-sm font-medium">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(attendant.totalSales)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ),

    'inventory-movement': () => (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pergerakan Inventaris</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardDataByLevel.inventory?.topMovingProducts || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantitySold" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    )
  };

  // Widget untuk Tactical Dashboard
  const TacticalWidgets = {
    'category-performance': () => (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Kinerja Kategori</CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardDataByLevel.performance?.revenuePerCategory || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="subtotal"
                >
                  {dashboardDataByLevel.performance?.revenuePerCategory?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    ),

    'product-analysis': () => (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Analisis Produk</CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h4 className="font-medium">Produk Terbaik</h4>
            {(dashboardDataByLevel.performance?.topPerformingProducts || []).slice(0, 3).map((product, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span>{product.name}</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.revenue)}
                </span>
              </div>
            ))}
            
            <h4 className="font-medium mt-4">Produk Terburuk</h4>
            {(dashboardDataByLevel.performance?.lowPerformingProducts || []).slice(0, 3).map((product, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span>{product.name}</span>
                <span className="text-red-600 font-medium">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.revenue)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ),

    'customer-insights': () => (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Wawasan Pelanggan</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h4 className="font-medium">Pelanggan dengan Pengeluaran Tertinggi</h4>
            {(dashboardDataByLevel.customerInsights?.topSpendingCustomers || []).slice(0, 5).map((customer, index) => (
              <div key={index} className="flex justify-between items-center py-1 border-b">
                <span className="text-sm">{customer.name}</span>
                <span className="text-sm font-medium">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(customer.totalSpent)}
                </span>
              </div>
            ))}
            
            <div className="pt-2 mt-4 border-t">
              <div className="flex justify-between text-sm">
                <span>Rata-rata Pengeluaran Pelanggan:</span>
                <span className="font-medium">
                  {dashboardDataByLevel.customerInsights?.avgCustomerSpending ? 
                    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(dashboardDataByLevel.customerInsights.avgCustomerSpending) : 
                    'Rp 0'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  };

  // Fungsi untuk mendapatkan widget berdasarkan level
  const getWidgets = () => {
    switch (currentLevel) {
      case 'executive':
        return ExecutiveWidgets;
      case 'operational':
        return OperationalWidgets;
      case 'tactical':
        return TacticalWidgets;
      default:
        return ExecutiveWidgets;
    }
  };

  const widgets = getWidgets();

  return (
    <div className="space-y-6">
      {/* Header dan kontrol */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2">
            <Button
              variant={currentLevel === 'executive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLevel('executive')}
            >
              Eksekutif
            </Button>
            <Button
              variant={currentLevel === 'operational' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLevel('operational')}
            >
              Operasional
            </Button>
            <Button
              variant={currentLevel === 'tactical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLevel('tactical')}
            >
              Taktis
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 ml-2">
            <Button
              variant={isEditing ? 'default' : 'outline'}
              size="sm"
              onClick={toggleEditing}
              className="flex items-center"
            >
              {isEditing ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
              {isEditing ? 'Selesai' : 'Edit'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetLayout}
              className="flex items-center"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={selectedDateRange.startDate}
            onChange={(e) => setSelectedDateRange({...selectedDateRange, startDate: e.target.value})}
            className="text-sm border rounded px-2 py-1"
          />
          <span>s/d</span>
          <input
            type="date"
            value={selectedDateRange.endDate}
            onChange={(e) => setSelectedDateRange({...selectedDateRange, endDate: e.target.value})}
            className="text-sm border rounded px-2 py-1"
          />
          <Button size="sm" className="flex items-center">
            <Settings className="h-4 w-4 mr-1" />
            Filter
          </Button>
        </div>
      </div>

      {/* Widget selector untuk mode edit */}
      {isEditing && (
        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
          {Object.keys(widgets).map((widgetId) => (
            <Button
              key={widgetId}
              variant={currentWidgets.includes(widgetId) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleWidget(widgetId)}
            >
              {widgetId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </Button>
          ))}
        </div>
      )}

      {/* Layout dashboard */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: currentLayout }}
        onLayoutChange={onLayoutChange}
        rowHeight={100}
        isDraggable={isEditing}
        isResizable={isEditing}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
        measureBeforeMount={false}
        useCSSTransforms={true}
        draggableHandle=".react-grid-drag-handle"
      >
        {currentWidgets.map((widgetId) => (
          <div key={widgetId} className="bg-white rounded-lg shadow p-2">
            <div className="react-grid-drag-handle cursor-move flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-500">
                {widgetId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </span>
            </div>
            {widgets[widgetId] && widgets[widgetId]()}
          </div>
        ))}
      </ResponsiveGridLayout>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      )}

      {/* Empty state */}
      {!loading && currentWidgets.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">Tidak ada widget yang ditampilkan</div>
          <Button onClick={resetLayout}>Atur Ulang Layout</Button>
        </div>
      )}
    </div>
  );
}