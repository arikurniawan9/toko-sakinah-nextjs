// app/api/dashboard/management-summary/route.js
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
    const level = searchParams.get('level') || 'executive'; // 'executive', 'operational', 'tactical'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const storeId = session.user.storeId;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID not found in session' }, { status: 400 });
    }

    // Jika tidak ada tanggal, gunakan hari ini sebagai default
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();
    
    // Atur waktu ke akhir hari
    end.setHours(23, 59, 59, 999);

    // Dapatkan data tergantung level
    let dashboardData = {};
    switch (level) {
      case 'executive':
        dashboardData = await getExecutiveDashboardData(storeId, start, end);
        break;
      case 'operational':
        dashboardData = await getOperationalDashboardData(storeId, start, end);
        break;
      case 'tactical':
        dashboardData = await getTacticalDashboardData(storeId, start, end);
        break;
      default:
        dashboardData = await getExecutiveDashboardData(storeId, start, end);
    }

    return NextResponse.json({
      success: true,
      level,
      period: { start: startDate, end: endDate },
      data: dashboardData
    });
  } catch (error) {
    console.error('Error generating management dashboard:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Fungsi untuk dashboard eksekutif (tingkat strategis)
async function getExecutiveDashboardData(storeId, startDate, endDate) {
  // Data keuangan utama
  const [salesData, productData, customerData, inventoryData] = await Promise.all([
    // Data penjualan
    prisma.sale.aggregate({
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
        payment: true
      },
      _count: true
    }),
    
    // Data produk
    prisma.product.aggregate({
      where: {
        storeId
      },
      _count: true,
      _sum: {
        stock: true
      }
    }),
    
    // Data pelanggan
    prisma.member.count({
      where: {
        storeId
      }
    }),
    
    // Data inventaris
    prisma.product.count({
      where: {
        storeId,
        stock: { lte: 5 } // Produk dengan stok rendah
      }
    })
  ]);

  // Hitung pendapatan rata-rata per hari
  const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 untuk inklusif tanggal
  const avgDailyRevenue = diffDays > 0 ? (salesData._sum.total || 0) / diffDays : 0;

  // Ambil produk terlaris
  const topSellingProducts = await prisma.saleDetail.groupBy({
    by: ['productId'],
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
    },
    orderBy: {
      _sum: {
        subtotal: 'desc'
      }
    },
    take: 5
  });

  // Ambil nama produk
  const productIds = topSellingProducts.map(item => item.productId);
  const productNames = await prisma.product.findMany({
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

  const productNameMap = {};
  productNames.forEach(product => {
    productNameMap[product.id] = product.name;
  });

  const formattedTopProducts = topSellingProducts.map(item => ({
    productId: item.productId,
    name: productNameMap[item.productId] || 'Unknown Product',
    quantity: item._sum.quantity,
    revenue: item._sum.subtotal
  }));

  return {
    financial: {
      totalRevenue: salesData._sum.total || 0,
      totalDiscount: salesData._sum.discount || 0,
      totalTransactions: salesData._count,
      avgDailyRevenue: parseFloat(avgDailyRevenue.toFixed(2)),
      avgTransactionValue: salesData._count > 0 ? 
        parseFloat((salesData._sum.total / salesData._count).toFixed(2)) : 0
    },
    inventory: {
      totalProducts: productData._count,
      totalStock: productData._sum.stock || 0,
      lowStockProducts: inventoryData,
      stockValue: 0 // Nilai stok akan dihitung jika harga pokok tersedia
    },
    customer: {
      totalCustomers: customerData
    },
    topProducts: formattedTopProducts,
    kpi: {
      revenuePerProduct: productData._count > 0 ? 
        parseFloat((salesData._sum.total / productData._count).toFixed(2)) : 0,
      revenuePerCustomer: customerData > 0 ? 
        parseFloat((salesData._sum.total / customerData).toFixed(2)) : 0
    }
  };
}

// Fungsi untuk dashboard operasional (tingkat pelaksanaan)
async function getOperationalDashboardData(storeId, startDate, endDate) {
  // Data operasional
  const [salesData, staffPerformance, inventoryMovement, dailyTrends] = await Promise.all([
    // Data penjualan rinci
    prisma.sale.groupBy({
      by: ['cashierId'],
      where: {
        storeId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        total: true
      },
      _count: true
    }),
    
    // Kinerja staf
    prisma.sale.groupBy({
      by: ['attendantId'],
      where: {
        storeId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        total: true
      },
      _count: true
    }),
    
    // Pergerakan inventaris
    prisma.saleDetail.groupBy({
      by: ['productId'],
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
        quantity: true
      }
    }),
    
    // Tren harian
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
        total: true
      }
    })
  ]);

  // Ambil informasi staf
  const staffIds = [
    ...salesData.map(s => s.cashierId),
    ...staffPerformance.map(s => s.attendantId)
  ];
  
  const staffInfo = await prisma.user.findMany({
    where: {
      id: {
        in: staffIds
      }
    },
    select: {
      id: true,
      name: true,
      role: true
    }
  });

  const staffMap = {};
  staffInfo.forEach(staff => {
    staffMap[staff.id] = staff;
  });

  // Format data kinerja kasir
  const cashierPerformance = salesData.map(sale => ({
    id: sale.cashierId,
    name: staffMap[sale.cashierId]?.name || 'Unknown',
    totalSales: sale._sum.total,
    transactionCount: sale._count,
    avgTransactionValue: sale._count > 0 ? sale._sum.total / sale._count : 0
  }));

  // Format data kinerja pelayan
  const attendantPerformance = staffPerformance.map(sale => ({
    id: sale.attendantId,
    name: staffMap[sale.attendantId]?.name || 'Unknown',
    totalSales: sale._sum.total,
    transactionCount: sale._count,
    avgTransactionValue: sale._count > 0 ? sale._sum.total / sale._count : 0
  }));

  // Produk dengan pergerakan tertinggi
  const topMovingProducts = await prisma.product.findMany({
    where: {
      id: {
        in: inventoryMovement.map(m => m.productId).slice(0, 10)
      }
    },
    select: {
      id: true,
      name: true,
      stock: true
    }
  });

  const productMap = {};
  topMovingProducts.forEach(product => {
    productMap[product.id] = product;
  });

  const formattedMovingProducts = inventoryMovement
    .slice(0, 10)
    .map(movement => ({
      ...productMap[movement.productId],
      quantitySold: movement._sum.quantity
    }));

  return {
    sales: {
      totalRevenue: cashierPerformance.reduce((sum, perf) => sum + perf.totalSales, 0),
      totalTransactions: cashierPerformance.reduce((sum, perf) => sum + perf.transactionCount, 0),
      avgTransactionValue: cashierPerformance.length > 0 ?
        parseFloat((cashierPerformance.reduce((sum, perf) => sum + perf.avgTransactionValue, 0) / cashierPerformance.length).toFixed(2)) : 0
    },
    staff: {
      cashiers: cashierPerformance,
      attendants: attendantPerformance
    },
    inventory: {
      topMovingProducts: formattedMovingProducts,
      dailyMovement: dailyTrends.map(trend => ({
        date: trend.date,
        revenue: trend._sum.total
      }))
    }
  };
}

// Fungsi untuk dashboard taktis (tingkat manajerial menengah)
async function getTacticalDashboardData(storeId, startDate, endDate) {
  // Data untuk pengambilan keputusan taktis
  const [salesData, productPerformance, categoryPerformance, customerTrends] = await Promise.all([
    // Data penjualan dengan detail
    prisma.sale.aggregate({
      where: {
        storeId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        total: true,
        discount: true
      },
      _count: true
    }),
    
    // Kinerja produk individual
    prisma.saleDetail.groupBy({
      by: ['productId'],
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
    }),
    
    // Kinerja kategori produk
    prisma.saleDetail.groupBy({
      by: ['product.category'],
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
        subtotal: true,
        quantity: true
      }
    }),
    
    // Tren pelanggan
    prisma.sale.groupBy({
      by: ['memberId'],
      where: {
        storeId,
        memberId: { not: null },
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        total: true
      },
      _count: true
    })
  ]);

  // Analisis produk berkinerja rendah
  const productIds = productPerformance.map(p => p.productId);
  const allProducts = await prisma.product.findMany({
    where: {
      id: {
        in: productIds
      },
      storeId
    },
    select: {
      id: true,
      name: true,
      category: true,
      stock: true,
      price: true
    }
  });

  const productMap = {};
  allProducts.forEach(product => {
    productMap[product.id] = product;
  });

  // Gabungkan data untuk analisis
  const productAnalysis = productPerformance.map(perf => ({
    ...productMap[perf.productId],
    quantitySold: perf._sum.quantity,
    revenue: perf._sum.subtotal,
    avgPrice: perf._sum.quantity > 0 ? perf._sum.subtotal / perf._sum.quantity : 0
  }));

  // Urutkan untuk mendapatkan produk terbaik dan terburuk
  const topPerformingProducts = [...productAnalysis]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const lowPerformingProducts = [...productAnalysis]
    .sort((a, b) => a.revenue - b.revenue)
    .slice(0, 10);

  // Ambil informasi pelanggan teratas
  const customerIds = customerTrends.map(c => c.memberId);
  const topCustomers = await prisma.member.findMany({
    where: {
      id: {
        in: customerIds
      }
    },
    select: {
      id: true,
      name: true
    }
  });

  const customerMap = {};
  topCustomers.forEach(customer => {
    customerMap[customer.id] = customer;
  });

  const topSpendingCustomers = customerTrends
    .map(c => ({
      ...customerMap[c.memberId],
      totalSpent: c._sum.total,
      transactionCount: c._count
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  return {
    performance: {
      totalRevenue: salesData._sum.total || 0,
      totalDiscount: salesData._sum.discount || 0,
      totalTransactions: salesData._count,
      revenuePerCategory: categoryPerformance,
      topPerformingProducts,
      lowPerformingProducts
    },
    customerInsights: {
      topSpendingCustomers,
      avgCustomerSpending: topSpendingCustomers.length > 0 ?
        parseFloat((topSpendingCustomers.reduce((sum, cust) => sum + cust.totalSpent, 0) / topSpendingCustomers.length).toFixed(2)) : 0
    },
    recommendations: generateTacticalRecommendations({
      topPerformingProducts,
      lowPerformingProducts,
      categoryPerformance,
      topSpendingCustomers
    })
  };
}

// Fungsi untuk menghasilkan rekomendasi taktis
function generateTacticalRecommendations(data) {
  const recommendations = [];

  // Rekomendasi berdasarkan produk terbaik
  if (data.topPerformingProducts.length > 0) {
    recommendations.push({
      type: 'product',
      priority: 'high',
      message: `Produk terlaris: ${data.topPerformingProducts[0].name} - pertimbangkan untuk meningkatkan stok`,
      category: data.topPerformingProducts[0].category
    });
  }

  // Rekomendasi berdasarkan produk terburuk
  if (data.lowPerformingProducts.length > 0) {
    recommendations.push({
      type: 'product',
      priority: 'medium',
      message: `Produk dengan kinerja rendah: ${data.lowPerformingProducts[0].name} - evaluasi strategi pemasaran`,
      category: data.lowPerformingProducts[0].category
    });
  }

  // Rekomendasi berdasarkan kategori
  if (data.revenuePerCategory.length > 0) {
    const topCategory = data.revenuePerCategory.reduce((max, cat) => cat._sum.subtotal > max._sum.subtotal ? cat : max);
    recommendations.push({
      type: 'category',
      priority: 'medium',
      message: `Kategori terbaik: ${topCategory['product.category']} - tingkatkan promosi produk sejenis`,
      category: topCategory['product.category']
    });
  }

  // Rekomendasi berdasarkan pelanggan
  if (data.topSpendingCustomers.length > 0) {
    recommendations.push({
      type: 'customer',
      priority: 'high',
      message: `Pelanggan VIP: ${data.topSpendingCustomers[0].name} - pertahankan loyalitas dengan program khusus`,
      customerId: data.topSpendingCustomers[0].id
    });
  }

  return recommendations;
}