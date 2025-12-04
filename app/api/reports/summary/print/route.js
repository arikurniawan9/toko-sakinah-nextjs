// app/api/reports/summary/print/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!storeId) {
      return new Response('Store ID is required', { status: 400 });
    }

    // Validasi rentang tanggal
    let whereClause = {
      storeId: storeId,
      status: 'PAID' // Hanya ambil penjualan yang sudah dibayar
    };

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else if (startDate) {
      whereClause.date = {
        gte: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.date = {
        lte: new Date(endDate)
      };
    }

    // Ambil data penjualan
    const sales = await prisma.sale.findMany({
      where: whereClause,
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        discount: true,
        tax: true,
        payment: true,
        change: true,
        status: true,
        paymentMethod: true,
        date: true,
        cashierId: true,
        attendantId: true,
        saleDetails: {
          select: {
            quantity: true,
            price: true,
            subtotal: true,
            product: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Ambil data pengeluaran
    const expensesWhereClause = {
      storeId: storeId
    };

    if (startDate && endDate) {
      expensesWhereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else if (startDate) {
      expensesWhereClause.date = {
        gte: new Date(startDate)
      };
    } else if (endDate) {
      expensesWhereClause.date = {
        lte: new Date(endDate)
      };
    }

    const expenses = await prisma.expense.findMany({
      where: expensesWhereClause,
      select: {
        id: true,
        amount: true,
        description: true,
        date: true,
        category: {
          select: {
            name: true
          }
        }
      }
    });

    // Ambil informasi toko
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        name: true,
        address: true,
        phone: true,
        email: true,
        status: true
      }
    });

    // Hitung statistik
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalPayment = sales.reduce((sum, sale) => sum + sale.payment, 0);
    const totalChange = sales.reduce((sum, sale) => sum + sale.change, 0);
    const totalQuantity = sales.reduce((sum, sale) => {
      return sum + sale.saleDetails.reduce((detailSum, detail) => detailSum + detail.quantity, 0);
    }, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netRevenue = totalRevenue - totalExpenses;

    // Ambil beberapa informasi tambahan
    const cashSales = sales.filter(sale => sale.paymentMethod === 'CASH').length;
    const nonCashSales = sales.filter(sale => sale.paymentMethod !== 'CASH').length;
    const mostSoldProduct = getMostSoldProduct(sales);

    // Siapkan data untuk laporan
    const reportData = {
      store: store,
      sales: sales,
      expenses: expenses,
      summary: {
        totalSales,
        totalRevenue,
        totalPayment,
        totalChange,
        totalQuantity,
        totalExpenses,
        netRevenue,
        cashSales,
        nonCashSales,
        mostSoldProduct
      },
      period: {
        start: startDate || '',
        end: endDate || new Date().toISOString().split('T')[0]
      }
    };

    // Hasilkan laporan dalam format HTML untuk dicetak
    const htmlContent = generateSummaryReportHTML(reportData);

    // Return HTML content
    return new Response(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="laporan-ringkasan-${storeId}-${new Date().toISOString().split('T')[0]}.html"`
      }
    });
  } catch (error) {
    console.error('Error generating summary report:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Fungsi untuk mendapatkan produk terlaris
function getMostSoldProduct(sales) {
  const productMap = {};
  
  sales.forEach(sale => {
    sale.saleDetails.forEach(detail => {
      if (!productMap[detail.product.name]) {
        productMap[detail.product.name] = {
          name: detail.product.name,
          quantity: 0,
          count: 0
        };
      }
      productMap[detail.product.name].quantity += detail.quantity;
      productMap[detail.product.name].count++;
    });
  });
  
  const entries = Object.entries(productMap);
  if (entries.length === 0) return null;
  
  return entries.reduce((max, current) => 
    current[1].quantity > max[1].quantity ? current : max
  )[1];
}

// Fungsi untuk menghasilkan HTML laporan ringkasan
function generateSummaryReportHTML(data) {
  const { store, sales, expenses, summary, period } = data;

  // Format tanggal
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Format angka uang
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Laporan Ringkasan - ${store.name}</title>
      <style>
        @media print {
          @page {
            size: A4 landscape;
            margin: 0.5cm;
          }
        }
        body {
          font-family: Arial, sans-serif;
          margin: 10px;
          font-size: 10px;
        }
        .header { text-align: center; margin-bottom: 10px; }
        .store-info { margin-bottom: 5px; }
        .report-title { font-size: 16px; font-weight: bold; margin-bottom: 3px; }
        .report-period { font-size: 12px; color: #666; margin-bottom: 5px; }
        .report-meta { font-size: 10px; color: #888; margin-bottom: 10px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 8px; margin-bottom: 10px; }
        .summary-card { padding: 8px; border: 1px solid #eee; border-radius: 3px; text-align: center; }
        .summary-title { font-size: 9px; color: #666; }
        .summary-value { font-size: 12px; font-weight: bold; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-bottom: 10px; }
        .metric-card { padding: 8px; border: 1px solid #ddd; border-radius: 3px; }
        .metric-title { font-size: 10px; color: #666; margin-bottom: 3px; }
        .metric-value { font-size: 14px; font-weight: bold; }
        .chart-placeholder { height: 100px; background-color: #f9f9f9; display: flex; align-items: center; justify-content: center; margin: 5px 0; border: 1px dashed #ccc; font-size: 9px; }
        .section-title { font-size: 12px; font-weight: bold; margin: 5px 0; }
        .sales-table, .expenses-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .sales-table th, .sales-table td, .expenses-table th, .expenses-table td { border: 1px solid #000; padding: 4px; text-align: left; font-size: 9px; }
        .sales-table th, .expenses-table th { background-color: #f2f2f2; }
        .sales-table .text-right, .expenses-table .text-right { text-align: right; }
        .total-section { margin-top: 10px; border-top: 2px solid #333; padding-top: 5px; text-align: right; font-weight: bold; }
        .highlight { background-color: #e8f4fd; }
        .page-break { page-break-before: always; }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="store-info">
          <div class="report-title">LAPORAN RINGKASAN</div>
          <div>Nama Toko: ${store.name}</div>
          <div>Alamat: ${store.address || '-'}</div>
          <div>Telepon: ${store.phone || '-'}</div>
        </div>
        <div class="report-period">
          Periode: ${period.start ? formatDate(period.start + 'T00:00:00') : 'Awal'} - ${formatDate(period.end + 'T23:59:59')}
        </div>
        <div class="report-meta">
          Dicetak pada: ${new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })} oleh: Manager System
        </div>
      </div>

      <!-- Ringkasan Metrik -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-title">Total Transaksi</div>
          <div class="metric-value">${summary.totalSales}</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Total Item Terjual</div>
          <div class="metric-value">${summary.totalQuantity}</div>
        </div>
        <div class="metric-card highlight">
          <div class="metric-title">Total Pendapatan</div>
          <div class="metric-value">${formatCurrency(summary.totalRevenue)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Total Biaya</div>
          <div class="metric-value">${formatCurrency(summary.totalExpenses)}</div>
        </div>
        <div class="metric-card highlight">
          <div class="metric-title">Pendapatan Bersih</div>
          <div class="metric-value">${formatCurrency(summary.netRevenue)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Pembayaran Tunai</div>
          <div class="metric-value">${summary.cashSales}</div>
        </div>
      </div>

      <!-- Produk Terlaris -->
      ${summary.mostSoldProduct ? `
        <div class="metric-card">
          <div class="metric-title">Produk Terlaris</div>
          <div class="metric-value">${summary.mostSoldProduct.name}</div>
          <div>Terjual: ${summary.mostSoldProduct.quantity} pcs (${summary.mostSoldProduct.count} transaksi)</div>
        </div>
      ` : ''}

      <!-- Statistik Tambahan -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-title">Rata-rata per Transaksi</div>
          <div class="summary-value">${summary.totalSales > 0 ? formatCurrency(summary.totalRevenue / summary.totalSales) : formatCurrency(0)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Rata-rata Item per Transaksi</div>
          <div class="summary-value">${summary.totalSales > 0 ? (summary.totalQuantity / summary.totalSales).toFixed(1) : 0}</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Persentase Tunai</div>
          <div class="summary-value">${summary.totalSales > 0 ? ((summary.cashSales / summary.totalSales) * 100).toFixed(1) + '%' : '0%'}</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Pembayaran Non-Tunai</div>
          <div class="summary-value">${summary.nonCashSales}</div>
        </div>
      </div>

      <!-- Grafik Placeholder -->
      <div class="section-title">GRAFIK KINERJA</div>
      <div class="chart-placeholder">
        <div>Diagram Kinerja Penjualan (akan ditampilkan dalam versi lengkap)</div>
      </div>

      <!-- Detail Transaksi -->
      ${sales.length > 0 ? `
        <div class="section-title">TRANSAKSI TERBARU</div>
        <table class="sales-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Faktur</th>
              <th>Tanggal</th>
              <th>Metode</th>
              <th>Item</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${sales.slice(0, 10).map((sale, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${sale.invoiceNumber}</td>
                <td>${sale.date.toLocaleDateString('id-ID')}</td>
                <td>${sale.paymentMethod}</td>
                <td>${sale.saleDetails.reduce((sum, detail) => sum + detail.quantity, 0)}</td>
                <td class="text-right">${formatCurrency(sale.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <!-- Pengeluaran -->
      ${expenses.length > 0 ? `
        <div class="section-title">PENGELUARAN UTAMA</div>
        <table class="expenses-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Kategori</th>
              <th>Deskripsi</th>
              <th>Tanggal</th>
              <th>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map((expense, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${expense.category?.name || 'Umum'}</td>
                <td>${expense.description || '-'}</td>
                <td>${new Date(expense.date).toLocaleDateString('id-ID')}</td>
                <td class="text-right">${formatCurrency(expense.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <!-- Total -->
      <div class="total-section">
        <div>Grand Total Pendapatan: ${formatCurrency(summary.totalRevenue)}</div>
        <div>Total Biaya Operasional: ${formatCurrency(summary.totalExpenses)}</div>
        <div>Net Profit: ${formatCurrency(summary.netRevenue)}</div>
      </div>

      <script>
        // Otomatis cetak saat halaman dimuat
        window.onload = function() {
          window.print();
          // Setelah cetak, tutup tab
          setTimeout(function() {
            window.close();
          }, 1000);
        };
      </script>
    </body>
    </html>
  `;
}