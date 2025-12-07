// app/api/reports/historical-trends/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const interval = searchParams.get('interval') || 'daily'; // daily, weekly, monthly
    const reportType = searchParams.get('type') || 'sales'; // sales, profit, products, etc.

    if (!startDate || !endDate) {
      return NextResponse.json({ 
        error: 'Missing required parameters: startDate, endDate' 
      }, { status: 400 });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Ambil storeId dari session
    const storeId = session.user.storeId;
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID not found in session' }, { status: 400 });
    }

    let reportData = {};

    switch (reportType) {
      case 'sales':
        reportData = await getSalesTrendReport(storeId, start, end, interval);
        break;
      case 'profit':
        reportData = await getProfitTrendReport(storeId, start, end, interval);
        break;
      case 'products':
        reportData = await getProductsTrendReport(storeId, start, end, interval);
        break;
      case 'revenue':
        reportData = await getRevenueTrendReport(storeId, start, end, interval);
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      reportType,
      interval,
      startDate: start,
      endDate: end,
      data: reportData
    });
  } catch (error) {
    console.error('Error generating historical trends report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Fungsi untuk laporan tren penjualan
async function getSalesTrendReport(storeId, startDate, endDate, interval) {
  // Query untuk mendapatkan data penjualan harian
  const sales = await prisma.sale.groupBy({
    by: ['date'],
    where: {
      storeId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    _sum: {
      total: true,
      payment: true,
    },
    _count: true
  });

  // Konversi tanggal ke interval yang sesuai (hari, minggu, bulan)
  const intervalData = {};
  
  sales.forEach(record => {
    const dateKey = getIntervalKey(new Date(record.date), interval);
    if (!intervalData[dateKey]) {
      intervalData[dateKey] = {
        date: dateKey,
        total: 0,
        payment: 0,
        count: 0
      };
    }
    
    intervalData[dateKey].total += record._sum.total || 0;
    intervalData[dateKey].payment += record._sum.payment || 0;
    intervalData[dateKey].count += record._count;
  });

  // Konversi ke array dan urutkan berdasarkan tanggal
  const trendData = Object.values(intervalData).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  // Hitung rata-rata
  const totalSales = trendData.reduce((sum, item) => sum + item.total, 0);
  const avgSales = trendData.length ? totalSales / trendData.length : 0;

  // Hitung tren menggunakan linear regression
  let slope = 0;
  if (trendData.length > 1) {
    slope = calculateTrendSlope(trendData);
  }

  return {
    data: trendData,
    summary: {
      totalSales,
      avgSales: parseFloat(avgSales.toFixed(2)),
      trendDirection: slope > 0 ? 'upward' : slope < 0 ? 'downward' : 'stable',
      trendStrength: Math.abs(slope) > 1000 ? 'strong' : Math.abs(slope) > 100 ? 'moderate' : 'weak'
    }
  };
}

// Fungsi untuk laporan tren keuntungan
async function getProfitTrendReport(storeId, startDate, endDate, interval) {
  const [sales, productCosts] = await Promise.all([
    prisma.sale.groupBy({
      by: ['date'],
      where: {
        storeId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        total: true,
      }
    }),
    prisma.saleDetail.groupBy({
      by: ['saleId'],
      where: {
        product: {
          storeId
        },
        sale: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      _sum: {
        subtotal: true
      }
    })
  ]);

  // Gabungkan data penjualan dan biaya
  const salesWithCosts = {};
  
  sales.forEach(sale => {
    const dateKey = getIntervalKey(new Date(sale.date), interval);
    if (!salesWithCosts[dateKey]) {
      salesWithCosts[dateKey] = {
        revenue: 0,
        cost: 0
      };
    }
    salesWithCosts[dateKey].revenue += sale._sum.total || 0;
  });

  // Proses biaya produk
  const saleIdToCost = {};
  productCosts.forEach(cost => {
    saleIdToCost[cost.saleId] = cost._sum.subtotal;
  });

  // Kita perlu query tambahan untuk mendapatkan tanggal penjualan untuk setiap ID
  const salesForCost = await prisma.sale.findMany({
    where: {
      storeId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      id: true,
      date: true
    }
  });

  salesForCost.forEach(sale => {
    if (saleIdToCost[sale.id]) {
      const dateKey = getIntervalKey(new Date(sale.date), interval);
      if (salesWithCosts[dateKey]) {
        salesWithCosts[dateKey].cost += saleIdToCost[sale.id] || 0;
      }
    }
  });

  // Konversi ke array tren
  const intervalData = {};
  Object.keys(salesWithCosts).forEach(dateKey => {
    intervalData[dateKey] = {
      date: dateKey,
      revenue: salesWithCosts[dateKey].revenue,
      cost: salesWithCosts[dateKey].cost,
      profit: salesWithCosts[dateKey].revenue - salesWithCosts[dateKey].cost
    };
  });

  const trendData = Object.values(intervalData).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  const totalProfit = trendData.reduce((sum, item) => sum + item.profit, 0);
  const avgProfit = trendData.length ? totalProfit / trendData.length : 0;

  let slope = 0;
  if (trendData.length > 1) {
    slope = calculateTrendSlope(trendData, 'profit');
  }

  return {
    data: trendData,
    summary: {
      totalProfit,
      avgProfit: parseFloat(avgProfit.toFixed(2)),
      trendDirection: slope > 0 ? 'upward' : slope < 0 ? 'downward' : 'stable',
      trendStrength: Math.abs(slope) > 1000 ? 'strong' : Math.abs(slope) > 100 ? 'moderate' : 'weak'
    }
  };
}

// Fungsi untuk laporan tren produk
async function getProductsTrendReport(storeId, startDate, endDate, interval) {
  const products = await prisma.saleDetail.groupBy({
    by: ['productId', 'sale.date'],
    where: {
      product: {
        storeId
      },
      sale: {
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    },
    _sum: {
      quantity: true,
      subtotal: true
    }
  });

  // Kelompokkan berdasarkan produk dan interval waktu
  const productTrends = {};

  products.forEach(item => {
    const dateKey = getIntervalKey(new Date(item.date), interval);
    const productId = item.productId;
    
    if (!productTrends[productId]) {
      productTrends[productId] = {
        productId,
        name: '', // Akan diisi nanti
        intervals: {}
      };
    }
    
    if (!productTrends[productId].intervals[dateKey]) {
      productTrends[productId].intervals[dateKey] = {
        date: dateKey,
        quantity: 0,
        revenue: 0
      };
    }
    
    productTrends[productId].intervals[dateKey].quantity += item._sum.quantity || 0;
    productTrends[productId].intervals[dateKey].revenue += item._sum.subtotal || 0;
  });

  // Ambil nama produk
  const productIds = Object.keys(productTrends);
  const productDetails = await prisma.product.findMany({
    where: {
      id: {
        in: productIds
      }
    },
    select: {
      id: true,
      name: true
    }
  });

  const productDetailMap = {};
  productDetails.forEach(product => {
    productDetailMap[product.id] = product.name;
  });

  // Konversi ke format yang lebih mudah digunakan
  const result = [];
  Object.values(productTrends).forEach(productTrend => {
    productTrend.name = productDetailMap[productTrend.productId] || 'Unknown Product';
    
    // Konversi intervals ke array dan urutkan
    const intervalsArray = Object.values(productTrend.intervals).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    // Hitung tren
    let quantitySlope = 0;
    let revenueSlope = 0;
    if (intervalsArray.length > 1) {
      quantitySlope = calculateTrendSlope(intervalsArray, 'quantity');
      revenueSlope = calculateTrendSlope(intervalsArray, 'revenue');
    }
    
    result.push({
      ...productTrend,
      intervals: intervalsArray,
      trend: {
        quantity: {
          direction: quantitySlope > 0 ? 'upward' : quantitySlope < 0 ? 'downward' : 'stable',
          strength: Math.abs(quantitySlope) > 10 ? 'strong' : Math.abs(quantitySlope) > 1 ? 'moderate' : 'weak'
        },
        revenue: {
          direction: revenueSlope > 0 ? 'upward' : revenueSlope < 0 ? 'downward' : 'stable',
          strength: Math.abs(revenueSlope) > 1000 ? 'strong' : Math.abs(revenueSlope) > 100 ? 'moderate' : 'weak'
        }
      }
    });
  });

  // Urutkan berdasarkan total penjualan
  result.sort((a, b) => {
    const totalA = a.intervals.reduce((sum, interval) => sum + interval.revenue, 0);
    const totalB = b.intervals.reduce((sum, interval) => sum + interval.revenue, 0);
    return totalB - totalA;
  });

  return {
    data: result.slice(0, 20), // Ambil 20 produk teratas
    summary: {
      totalTrackedProducts: result.length,
      topSellingProducts: result.slice(0, 5).map(p => ({ id: p.productId, name: p.name }))
    }
  };
}

// Fungsi untuk laporan tren pendapatan
async function getRevenueTrendReport(storeId, startDate, endDate, interval) {
  const sales = await prisma.sale.groupBy({
    by: ['date'],
    where: {
      storeId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    _sum: {
      total: true,
      discount: true,
      tax: true
    }
  });

  const intervalData = {};
  
  sales.forEach(record => {
    const dateKey = getIntervalKey(new Date(record.date), interval);
    if (!intervalData[dateKey]) {
      intervalData[dateKey] = {
        date: dateKey,
        revenue: 0,
        discount: 0,
        tax: 0
      };
    }
    
    intervalData[dateKey].revenue += record._sum.total || 0;
    intervalData[dateKey].discount += record._sum.discount || 0;
    intervalData[dateKey].tax += record._sum.tax || 0;
  });

  const trendData = Object.values(intervalData).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  const totalRevenue = trendData.reduce((sum, item) => sum + item.revenue, 0);
  const avgRevenue = trendData.length ? totalRevenue / trendData.length : 0;

  let slope = 0;
  if (trendData.length > 1) {
    slope = calculateTrendSlope(trendData, 'revenue');
  }

  return {
    data: trendData,
    summary: {
      totalRevenue,
      avgRevenue: parseFloat(avgRevenue.toFixed(2)),
      totalDiscount: trendData.reduce((sum, item) => sum + item.discount, 0),
      totalTax: trendData.reduce((sum, item) => sum + item.tax, 0),
      trendDirection: slope > 0 ? 'upward' : slope < 0 ? 'downward' : 'stable',
      trendStrength: Math.abs(slope) > 1000 ? 'strong' : Math.abs(slope) > 100 ? 'moderate' : 'weak'
    }
  };
}

// Fungsi pembantu untuk mendapatkan kunci interval
function getIntervalKey(date, interval) {
  const d = new Date(date);
  switch (interval) {
    case 'daily':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    case 'weekly':
      // Mendapatkan minggu dalam tahun
      const year = d.getFullYear();
      const week = getWeekNumber(d);
      return `${year}-W${String(week).padStart(2, '0')}`;
    case 'monthly':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    default:
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

// Fungsi untuk mendapatkan nomor minggu
function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Fungsi untuk menghitung slope tren menggunakan linear regression
function calculateTrendSlope(data, valueField = 'total') {
  if (data.length < 2) return 0;
  
  // Konversi tanggal ke nilai numerik
  const xValues = data.map((_, index) => index);
  const yValues = data.map(item => item[valueField] || 0);
  
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += xValues[i];
    sumY += yValues[i];
    sumXY += xValues[i] * yValues[i];
    sumXX += xValues[i] * xValues[i];
  }
  
  // Rumus slope (m) dalam linear regression: m = (n*sumXY - sumX*sumY) / (n*sumXX - sumX*sumX)
  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return 0;
  
  return (n * sumXY - sumX * sumY) / denominator;
}