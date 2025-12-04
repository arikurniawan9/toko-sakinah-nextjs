// app/api/reports/sales/print/route.js
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
      include: {
        cashier: {
          select: {
            name: true,
            username: true
          }
        },
        attendant: {
          select: {
            name: true,
            username: true
          }
        },
        saleDetails: {
          include: {
            product: {
              select: {
                name: true,
                productCode: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

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

    // Siapkan data untuk laporan
    const reportData = {
      store: store,
      sales: sales,
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
      period: {
        start: startDate || '',
        end: endDate || new Date().toISOString().split('T')[0]
      }
    };

    // Hasilkan laporan dalam format HTML untuk dicetak
    const htmlContent = generateSalesReportHTML(reportData);

    // Return HTML content
    return new Response(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="laporan-penjualan-${storeId}-${new Date().toISOString().split('T')[0]}.html"`
      }
    });
  } catch (error) {
    console.error('Error generating sales report:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Fungsi untuk menghasilkan HTML laporan penjualan
function generateSalesReportHTML(data) {
  const { store, sales, totalSales, totalRevenue, period } = data;

  // Format tanggal
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
      <title>Laporan Penjualan - ${store.name}</title>
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
        .sales-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .sales-table th, .sales-table td { border: 1px solid #000; padding: 4px; text-align: left; font-size: 9px; }
        .sales-table th { background-color: #f2f2f2; }
        .total-section { margin-top: 10px; text-align: right; }
        .total-amount { font-size: 14px; font-weight: bold; }
        .page-break { page-break-before: always; }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="store-info">
          <div class="report-title">LAPORAN PENJUALAN</div>
          <div>Nama Toko: ${store.name}</div>
          <div>Alamat: ${store.address || '-'}</div>
          <div>Telepon: ${store.phone || '-'}</div>
        </div>
        <div class="report-period">
          Periode: ${period.start ? formatDate(period.start + 'T00:00:00') : 'Awal'} - ${formatDate(period.end + 'T23:59:59')}
        </div>
        <div class="report-meta">
          Dicetak pada: ${formatDate(new Date().toISOString())} oleh: Manager System
        </div>
      </div>

      <table class="sales-table">
        <thead>
          <tr>
            <th>No</th>
            <th>No Faktur</th>
            <th>Tanggal</th>
            <th>Kasir</th>
            <th>Pelayan</th>
            <th>Total</th>
            <th>Metode Pembayaran</th>
          </tr>
        </thead>
        <tbody>
          ${sales.map((sale, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${sale.invoiceNumber}</td>
              <td>${formatDate(sale.date)}</td>
              <td>${sale.cashier ? sale.cashier.name : 'Tidak Ada'}</td>
              <td>${sale.attendant ? sale.attendant.name : 'Tidak Ada'}</td>
              <td>${formatCurrency(sale.total)}</td>
              <td>${sale.paymentMethod}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-section">
        <div>Total Transaksi: ${totalSales}</div>
        <div class="total-amount">Total Pendapatan: ${formatCurrency(totalRevenue)}</div>
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