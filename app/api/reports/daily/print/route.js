// app/api/reports/daily/print/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!storeId) {
      return new Response('Store ID is required', { status: 400 });
    }

    // Parse tanggal
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    // Buat tanggal untuk akhir hari
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Buat where clause untuk data harian
    const dailyWhereClause = {
      storeId: storeId,
      date: {
        gte: selectedDate,
        lt: nextDay
      }
    };

    // Ambil data harian
    const [sales, expenses] = await Promise.all([
      prisma.sale.findMany({
        where: dailyWhereClause,
        include: {
          cashier: {
            select: {
              name: true
            }
          },
          attendant: {
            select: {
              name: true
            }
          },
          saleDetails: {
            include: {
              product: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      }),
      prisma.expense.findMany({
        where: {
          storeId: storeId,
          date: {
            gte: selectedDate,
            lt: nextDay
          }
        },
        include: {
          category: true,
          user: {
            select: {
              name: true
            }
          }
        }
      })
    ]);

    // Ambil informasi toko
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        name: true,
        address: true,
        phone: true,
        email: true
      }
    });

    // Hitung ringkasan data
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalPayment = sales.reduce((sum, sale) => sum + sale.payment, 0);
    const totalChange = sales.reduce((sum, sale) => sum + sale.change, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netRevenue = totalRevenue - totalExpenses;

    // Siapkan data untuk laporan
    const reportData = {
      store: store,
      date: selectedDate,
      sales: sales,
      expenses: expenses,
      summary: {
        totalSales,
        totalRevenue,
        totalPayment,
        totalChange,
        totalExpenses,
        netRevenue
      }
    };

    // Hasilkan laporan dalam format HTML untuk dicetak
    const htmlContent = generateDailyReportHTML(reportData);

    // Return HTML content
    return new Response(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="laporan-harian-${storeId}-${date}.html"`
      }
    });
  } catch (error) {
    console.error('Error generating daily report:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Fungsi untuk menghasilkan HTML laporan harian
function generateDailyReportHTML(data) {
  const { store, date, sales, expenses, summary } = data;

  // Format tanggal
  const formatDate = (dateObj) => {
    return dateObj.toLocaleDateString('id-ID', {
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
      <title>Laporan Harian - ${store.name}</title>
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
        .report-date { font-size: 12px; color: #666; margin-bottom: 5px; }
        .report-meta { font-size: 10px; color: #888; margin-bottom: 10px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-bottom: 10px; }
        .summary-card { padding: 8px; border: 1px solid #eee; border-radius: 3px; }
        .summary-title { font-size: 10px; color: #666; }
        .summary-value { font-size: 12px; font-weight: bold; }
        .section-title { font-size: 12px; font-weight: bold; margin: 5px 0; }
        .sales-table, .expenses-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .sales-table th, .sales-table td, .expenses-table th, .expenses-table td { border: 1px solid #000; padding: 4px; text-align: left; font-size: 9px; }
        .sales-table th, .expenses-table th { background-color: #f2f2f2; }
        .sales-table .text-right, .expenses-table .text-right { text-align: right; }
        .total-section { margin-top: 10px; border-top: 2px solid #333; padding-top: 5px; text-align: right; font-weight: bold; }
        .page-break { page-break-before: always; }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="store-info">
          <div class="report-title">LAPORAN HARIAN</div>
          <div>Nama Toko: ${store.name}</div>
          <div>Alamat: ${store.address || '-'}</div>
          <div>Telepon: ${store.phone || '-'}</div>
        </div>
        <div class="report-date">
          Tanggal: ${formatDate(date)}
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

      <!-- Ringkasan -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-title">Total Transaksi</div>
          <div class="summary-value">${summary.totalSales}</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Total Pendapatan</div>
          <div class="summary-value">${formatCurrency(summary.totalRevenue)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Total Pembayaran</div>
          <div class="summary-value">${formatCurrency(summary.totalPayment)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Total Kembalian</div>
          <div class="summary-value">${formatCurrency(summary.totalChange)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Total Biaya</div>
          <div class="summary-value">${formatCurrency(summary.totalExpenses)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Pendapatan Bersih</div>
          <div class="summary-value">${formatCurrency(summary.netRevenue)}</div>
        </div>
      </div>

      <!-- Penjualan -->
      <div class="section-title">RIWAYAT PENJUALAN</div>
      <table class="sales-table">
        <thead>
          <tr>
            <th>No</th>
            <th>No Faktur</th>
            <th>Jam</th>
            <th>Cashier</th>
            <th>Attendant</th>
            <th>Item</th>
            <th>Total</th>
            <th>Bayar</th>
            <th>Kembali</th>
            <th>Metode</th>
          </tr>
        </thead>
        <tbody>
          ${sales.map((sale, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${sale.invoiceNumber}</td>
              <td>${sale.date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
              <td>${sale.cashier?.name || '-'}</td>
              <td>${sale.attendant?.name || '-'}</td>
              <td>${sale.saleDetails?.length || 0} item</td>
              <td class="text-right">${formatCurrency(sale.total)}</td>
              <td class="text-right">${formatCurrency(sale.payment)}</td>
              <td class="text-right">${formatCurrency(sale.change)}</td>
              <td>${sale.paymentMethod}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Pengeluaran -->
      ${expenses.length > 0 ? `
        <div class="section-title">PENGELUARAN HARIAN</div>
        <table class="expenses-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Kategori</th>
              <th>Deskripsi</th>
              <th>Nama Staff</th>
              <th>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map((expense, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${expense.category?.name || 'Umum'}</td>
                <td>${expense.description || '-'}</td>
                <td>${expense.user?.name || expense.createdBy}</td>
                <td class="text-right">${formatCurrency(expense.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <!-- Total -->
      <div class="total-section">
        <div>Grand Total Pendapatan: ${formatCurrency(summary.totalRevenue)}</div>
        <div>Total Biaya: ${formatCurrency(summary.totalExpenses)}</div>
        <div>Net Income: ${formatCurrency(summary.netRevenue)}</div>
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