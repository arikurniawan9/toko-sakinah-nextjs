// app/api/reports/combined/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'MANAGER') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const reportType = searchParams.get('type') || 'sales';

    // Tentukan rentang waktu berdasarkan timeRange
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '90d':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '365d':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    let reportData = {};

    if (reportType === 'sales') {
      // Ambil data penjualan keseluruhan
      const salesData = await prisma.sale.groupBy({
        by: ['storeId'],
        where: {
          date: {
            gte: startDate
          }
        },
        _sum: {
          total: true
        },
        _count: {
          id: true
        }
      });

      // Ambil data penjualan harian untuk grafik sesuai dengan rentang waktu
      const dailySales = await prisma.sale.groupBy({
        by: ['date'],
        where: {
          date: {
            gte: startDate
          }
        },
        _sum: {
          total: true
        },
        _count: {
          id: true
        }
      });

      // Ambil toko untuk nama
      const stores = await prisma.store.findMany({
        where: {
          status: 'ACTIVE'
        }
      });

      // Gabungkan data
      const storeSalesData = salesData.map(sale => {
        const store = stores.find(s => s.id === sale.storeId);
        return {
          storeId: sale.storeId,
          storeName: store ? store.name : 'Toko Tidak Dikenal',
          totalSales: sale._count.id,
          totalRevenue: sale._sum.total
        };
      });

      // Ambil data produk terjual untuk menghitung total item yang terjual
      const totalProductsSold = await prisma.saleDetail.aggregate({
        where: {
          sale: {
            date: {
              gte: startDate
            }
          }
        },
        _sum: {
          quantity: true
        }
      });

      // Ambil informasi produk yang paling banyak terjual
      const topProducts = await prisma.saleDetail.groupBy({
        by: ['productId'],
        where: {
          sale: {
            date: {
              gte: startDate
            }
          }
        },
        _sum: {
          quantity: true,
          subtotal: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      });

      // Ambil nama produk untuk top products
      const topProductIds = topProducts.map(item => item.productId);
      const productDetails = await prisma.product.findMany({
        where: {
          id: {
            in: topProductIds
          }
        },
        select: {
          id: true,
          name: true
        }
      });

      // Gabungkan data produk
      const topProductsData = topProducts.map(item => {
        const product = productDetails.find(p => p.id === item.productId);
        return {
          productName: product ? product.name : 'Produk Tidak Dikenal',
          quantity: item._sum.quantity,
          revenue: item._sum.subtotal
        };
      });

      reportData = {
        globalStats: {
          totalRevenue: salesData.reduce((sum, sale) => sum + (sale._sum.total || 0), 0),
          totalSales: salesData.reduce((sum, sale) => sum + sale._count.id, 0),
          totalProductsSold: totalProductsSold._sum.quantity || 0,
          activeStores: stores.length
        },
        salesData: dailySales.map(day => ({
          date: day.date.toISOString().split('T')[0],
          sales: day._count.id,
          revenue: day._sum.total
        })),
        storePerformance: storeSalesData,
        topProducts: topProductsData
      };
    } else if (reportType === 'inventory') {
      // Data inventaris
      const totalProducts = await prisma.product.count();
      const lowStockProducts = await prisma.product.count({
        where: {
          stock: { lte: 5 }
        }
      });
      const outOfStockProducts = await prisma.product.count({
        where: {
          stock: 0
        }
      });

      // Ambil data stok untuk setiap produk
      const inventoryDataWithRelations = await prisma.product.findMany({
        include: {
          store: true,
          category: true,
          supplier: true
        },
        orderBy: {
          stock: 'asc' // Urutkan dari stok terendah
        },
        take: 10 // Ambil 10 produk terendah
      });

      // Transformasi data untuk menghindari masalah jika relasi tidak ditemukan
      const inventoryData = inventoryDataWithRelations.map(item => ({
        id: item.id,
        name: item.name || 'Nama Produk Tidak Dikenal',
        productCode: item.productCode || 'Kode Produk Tidak Dikenal',
        stock: item.stock,
        storeName: item.store ? item.store.name : 'Toko Tidak Dikenal',
        categoryName: item.category ? item.category.name : 'Kategori Tidak Dikenal',
        supplierName: item.supplier ? item.supplier.name : 'Supplier Tidak Dikenal',
        purchasePrice: item.purchasePrice || 0,
        price: item.priceTiers && item.priceTiers.length > 0 ? item.priceTiers[0].price : 0,
      }));

      reportData = {
        globalStats: {
          totalProducts,
          lowStockProducts,
          outOfStockProducts,
          totalStores: await prisma.store.count()
        },
        inventoryData: inventoryData
      };
    } else if (reportType === 'financial') {
      // Data keuangan
      const salesTotal = await prisma.sale.aggregate({
        where: {
          date: {
            gte: startDate
          }
        },
        _sum: {
          total: true
        }
      });

      const expensesTotal = await prisma.expense.aggregate({
        where: {
          date: {
            gte: startDate
          }
        },
        _sum: {
          amount: true
        }
      });

      // Ambil detail pengeluaran berdasarkan kategori
      const expensesByCategory = await prisma.expense.groupBy({
        by: ['expenseCategoryId'],
        where: {
          date: {
            gte: startDate
          }
        },
        _sum: {
          amount: true
        }
      });

      // Ambil nama kategori pengeluaran
      const expenseCategoryIds = expensesByCategory.map(item => item.expenseCategoryId);
      const expenseCategories = await prisma.expenseCategory.findMany({
        where: {
          id: {
            in: expenseCategoryIds
          }
        },
        select: {
          id: true,
          name: true
        }
      });

      // Gabungkan data kategori pengeluaran
      const expensesByCategoryData = expensesByCategory.map(item => {
        const category = expenseCategories.find(cat => cat.id === item.expenseCategoryId);
        return {
          categoryName: category ? category.name : 'Kategori Tidak Dikenal',
          amount: item._sum.amount
        };
      });

      // Ambil data pembelian dalam periode yang sama untuk menghitung laba kotor
      const purchasesTotal = await prisma.purchase.aggregate({
        where: {
          purchaseDate: {
            gte: startDate
          }
        },
        _sum: {
          totalAmount: true
        }
      });

      // Hitung laba kotor (total penjualan - total pembelian)
      const grossProfit = (salesTotal._sum.total || 0) - (purchasesTotal._sum.totalAmount || 0);

      reportData = {
        globalStats: {
          totalRevenue: salesTotal._sum.total || 0,
          totalExpenses: expensesTotal._sum.amount || 0,
          netProfit: (salesTotal._sum.total || 0) - (expensesTotal._sum.amount || 0),
          grossProfit: grossProfit,
          totalPurchases: purchasesTotal._sum.totalAmount || 0
        },
        financialData: {
          expensesByCategory: expensesByCategoryData
        }
      };
    }

    return new Response(JSON.stringify(reportData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching combined reports:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}