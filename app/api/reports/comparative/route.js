// app/api/reports/comparative/route.js
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
    const period1Start = searchParams.get('period1Start');
    const period1End = searchParams.get('period1End'); 
    const period2Start = searchParams.get('period2Start');
    const period2End = searchParams.get('period2End');
    const reportType = searchParams.get('type') || 'sales'; // sales, profit, etc.

    if (!period1Start || !period1End || !period2Start || !period2End) {
      return NextResponse.json({ 
        error: 'Missing required parameters: period1Start, period1End, period2Start, period2End' 
      }, { status: 400 });
    }

    // Parse dates
    const p1Start = new Date(period1Start);
    const p1End = new Date(period1End);
    const p2Start = new Date(period2Start);
    const p2End = new Date(period2End);

    // Validasi: period2 harus berada setelah period1
    if (p2Start < p1End) {
      return NextResponse.json({ 
        error: 'Period 2 must start after period 1 ends' 
      }, { status: 400 });
    }

    // Ambil storeId dari session
    const storeId = session.user.storeId;
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID not found in session' }, { status: 400 });
    }

    let reportData = {};

    switch (reportType) {
      case 'sales':
        reportData = await getSalesComparativeReport(storeId, p1Start, p1End, p2Start, p2End);
        break;
      case 'profit':
        reportData = await getProfitComparativeReport(storeId, p1Start, p1End, p2Start, p2End);
        break;
      case 'products':
        reportData = await getProductsComparativeReport(storeId, p1Start, p1End, p2Start, p2End);
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      reportType,
      period1: { start: p1Start, end: p1End },
      period2: { start: p2Start, end: p2End },
      data: reportData
    });
  } catch (error) {
    console.error('Error generating comparative report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Fungsi untuk laporan penjualan komparatif
async function getSalesComparativeReport(storeId, p1Start, p1End, p2Start, p2End) {
  const [period1Sales, period2Sales, period1Count, period2Count] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        storeId,
        date: {
          gte: p1Start,
          lte: p1End
        }
      },
      _sum: {
        total: true,
      },
      _count: true
    }),
    prisma.sale.aggregate({
      where: {
        storeId,
        date: {
          gte: p2Start,
          lte: p2End
        }
      },
      _sum: {
        total: true,
      },
      _count: true
    }),
    prisma.sale.count({
      where: {
        storeId,
        date: {
          gte: p1Start,
          lte: p1End
        }
      }
    }),
    prisma.sale.count({
      where: {
        storeId,
        date: {
          gte: p2Start,
          lte: p2End
        }
      }
    })
  ]);

  const period1Total = period1Sales._sum.total || 0;
  const period2Total = period2Sales._sum.total || 0;

  const growthPercentage = period1Total > 0 
    ? ((period2Total - period1Total) / period1Total) * 100 
    : period2Total > 0 ? 100 : 0;

  return {
    period1: {
      total: period1Total,
      count: period1Count,
      avgPerTransaction: period1Count > 0 ? period1Total / period1Count : 0
    },
    period2: {
      total: period2Total,
      count: period2Count,
      avgPerTransaction: period2Count > 0 ? period2Total / period2Count : 0
    },
    comparison: {
      totalGrowth: period2Total - period1Total,
      growthPercentage: parseFloat(growthPercentage.toFixed(2)),
      growthDirection: period2Total > period1Total ? 'increase' : 
                      period2Total < period1Total ? 'decrease' : 'same'
    }
  };
}

// Fungsi untuk laporan keuntungan komparatif
async function getProfitComparativeReport(storeId, p1Start, p1End, p2Start, p2End) {
  // Untuk sementara, anggap keuntungan = total - biaya produk
  const [period1Sales, period2Sales, period1ProductCosts, period2ProductCosts] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        storeId,
        date: {
          gte: p1Start,
          lte: p1End
        }
      },
      _sum: {
        total: true,
      }
    }),
    prisma.sale.aggregate({
      where: {
        storeId,
        date: {
          gte: p2Start,
          lte: p2End
        }
      },
      _sum: {
        total: true,
      }
    }),
    prisma.saleDetail.aggregate({
      where: {
        product: {
          storeId
        },
        sale: {
          date: {
            gte: p1Start,
            lte: p1End
          }
        }
      },
      _sum: {
        subtotal: true
      }
    }),
    prisma.saleDetail.aggregate({
      where: {
        product: {
          storeId
        },
        sale: {
          date: {
            gte: p2Start,
            lte: p2End
          }
        }
      },
      _sum: {
        subtotal: true
      }
    })
  ]);

  const period1Total = period1Sales._sum.total || 0;
  const period2Total = period2Sales._sum.total || 0;
  
  // Dalam implementasi sebenarnya, kita butuh harga pokok penjualan
  const period1Cost = period1ProductCosts._sum.subtotal || 0;
  const period2Cost = period2ProductCosts._sum.subtotal || 0;
  
  const period1Profit = period1Total - period1Cost;
  const period2Profit = period2Total - period2Cost;

  const growthPercentage = period1Profit !== 0 
    ? ((period2Profit - period1Profit) / Math.abs(period1Profit)) * 100 
    : period2Profit > 0 ? 100 : 0;

  return {
    period1: {
      revenue: period1Total,
      cost: period1Cost,
      profit: period1Profit,
      profitMargin: period1Total > 0 ? (period1Profit / period1Total) * 100 : 0
    },
    period2: {
      revenue: period2Total,
      cost: period2Cost,
      profit: period2Profit,
      profitMargin: period2Total > 0 ? (period2Profit / period2Total) * 100 : 0
    },
    comparison: {
      profitGrowth: period2Profit - period1Profit,
      growthPercentage: parseFloat(growthPercentage.toFixed(2)),
      growthDirection: period2Profit > period1Profit ? 'increase' : 
                      period2Profit < period1Profit ? 'decrease' : 'same'
    }
  };
}

// Fungsi untuk laporan produk komparatif
async function getProductsComparativeReport(storeId, p1Start, p1End, p2Start, p2End) {
  const [period1Products, period2Products] = await Promise.all([
    prisma.saleDetail.groupBy({
      by: ['productId'],
      where: {
        product: {
          storeId
        },
        sale: {
          date: {
            gte: p1Start,
            lte: p1End
          }
        }
      },
      _sum: {
        quantity: true,
        subtotal: true
      }
    }),
    prisma.saleDetail.groupBy({
      by: ['productId'],
      where: {
        product: {
          storeId
        },
        sale: {
          date: {
            gte: p2Start,
            lte: p2End
          }
        }
      },
      _sum: {
        quantity: true,
        subtotal: true
      }
    })
  ]);

  // Mapping produk untuk period1
  const period1Map = new Map();
  period1Products.forEach(detail => {
    period1Map.set(detail.productId, {
      quantity: detail._sum.quantity,
      subtotal: detail._sum.subtotal
    });
  });

  // Mapping produk untuk period2
  const period2Map = new Map();
  period2Products.forEach(detail => {
    period2Map.set(detail.productId, {
      quantity: detail._sum.quantity,
      subtotal: detail._sum.subtotal
    });
  });

  // Gabungkan data untuk semua produk
  const allProductIds = new Set([
    ...period1Map.keys(),
    ...period2Map.keys()
  ]);

  const productComparisons = [];
  for (const productId of allProductIds) {
    const period1Data = period1Map.get(productId) || { quantity: 0, subtotal: 0 };
    const period2Data = period2Map.get(productId) || { quantity: 0, subtotal: 0 };

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    const quantityGrowth = period2Data.quantity - period1Data.quantity;
    const quantityGrowthPercentage = period1Data.quantity > 0 
      ? (quantityGrowth / period1Data.quantity) * 100 
      : period2Data.quantity > 0 ? 100 : 0;

    const revenueGrowth = period2Data.subtotal - period1Data.subtotal;
    const revenueGrowthPercentage = period1Data.subtotal > 0 
      ? (revenueGrowth / period1Data.subtotal) * 100 
      : period2Data.subtotal > 0 ? 100 : 0;

    productComparisons.push({
      productId,
      productName: product?.name || 'Unknown Product',
      period1: {
        quantity: period1Data.quantity,
        revenue: period1Data.subtotal
      },
      period2: {
        quantity: period2Data.quantity,
        revenue: period2Data.subtotal
      },
      comparison: {
        quantityGrowth,
        quantityGrowthPercentage: parseFloat(quantityGrowthPercentage.toFixed(2)),
        revenueGrowth,
        revenueGrowthPercentage: parseFloat(revenueGrowthPercentage.toFixed(2)),
        quantityGrowthDirection: quantityGrowth > 0 ? 'increase' : 
                                  quantityGrowth < 0 ? 'decrease' : 'same',
        revenueGrowthDirection: revenueGrowth > 0 ? 'increase' : 
                                revenueGrowth < 0 ? 'decrease' : 'same'
      }
    });
  }

  // Urutkan berdasarkan peningkatan penjualan tertinggi
  productComparisons.sort((a, b) => b.comparison.revenueGrowth - a.comparison.revenueGrowth);

  return {
    topGainers: productComparisons.slice(0, 10), // 10 produk dengan peningkatan terbesar
    topLosers: [...productComparisons].reverse().slice(0, 10), // 10 produk dengan penurunan terbesar
    totalProducts: productComparisons.length
  };
}