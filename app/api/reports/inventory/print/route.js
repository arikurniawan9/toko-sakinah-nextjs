// app/api/reports/inventory/print/route.js
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!storeId) {
      return new Response('Store ID is required', { status: 400 });
    }

    // Validasi rentang tanggal untuk histori perubahan stok
    let stockMovementWhereClause = {
      storeId: storeId
    };

    if (startDate && endDate) {
      stockMovementWhereClause.movedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else if (startDate) {
      stockMovementWhereClause.movedAt = {
        gte: new Date(startDate)
      };
    } else if (endDate) {
      stockMovementWhereClause.movedAt = {
        lte: new Date(endDate)
      };
    }

    // Ambil data produk untuk laporan inventaris
    const products = await prisma.product.findMany({
      where: {
        storeId: storeId
      },
      include: {
        category: {
          select: {
            name: true
          }
        },
        supplier: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Ambil histori perubahan stok (jika ada tabel movement)
    const stockMovements = await prisma.stockMovement?.findMany({
      where: stockMovementWhereClause,
      include: {
        product: {
          select: {
            name: true
          }
        }
      }
    }) || [];

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
      products: products,
      stockMovements: stockMovements,
      totalProducts: products.length,
      period: {
        start: startDate || '',
        end: endDate || new Date().toISOString().split('T')[0]
      }
    };

    // Hasilkan laporan dalam format HTML untuk dicetak
    const htmlContent = generateInventoryReportHTML(reportData);

    // Return HTML content
    return new Response(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="laporan-inventaris-${storeId}-${new Date().toISOString().split('T')[0]}.html"`
      }
    });
  } catch (error) {
    console.error('Error generating inventory report:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Fungsi untuk menghasilkan HTML laporan inventaris
function generateInventoryReportHTML(data) {
  const { store, products, stockMovements, totalProducts, period } = data;

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
      <title>Laporan Inventaris - ${store.name}</title>
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
        .inventory-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .inventory-table th, .inventory-table td { border: 1px solid #000; padding: 4px; text-align: left; font-size: 9px; }
        .inventory-table th { background-color: #f2f2f2; }
        .inventory-table .text-right { text-align: right; }
        .inventory-table .text-center { text-align: center; }
        .summary-section { margin-top: 10px; }
        .stock-status-low { color: red; font-weight: bold; }
        .stock-status-medium { color: orange; font-weight: bold; }
        .stock-status-good { color: green; }
        .page-break { page-break-before: always; }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="store-info">
          <div class="report-title">LAPORAN INVENTARIS</div>
          <div>Nama Toko: ${store.name}</div>
          <div>Alamat: ${store.address || '-'}</div>
          <div>Telepon: ${store.phone || '-'}</div>
        </div>
        <div class="report-period">
          Periode: ${period.start ? period.start : 'Awal'} - ${period.end}
        </div>
        <div class="report-meta">
          Dicetak pada: ${formatDate(new Date().toISOString())} oleh: Manager System
        </div>
      </div>

      <table class="inventory-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Produk</th>
            <th>Kode Produk</th>
            <th>Kategori</th>
            <th>Supplier</th>
            <th>Stok</th>
            <th>Harga Beli</th>
            <th>Nilai Stok</th>
            <th>Status Stok</th>
          </tr>
        </thead>
        <tbody>
          ${products.map((product, index) => {
            const stockValue = product.stock * product.purchasePrice;
            let stockStatus = '<span class="stock-status-good">Normal</span>';
            if (product.stock === 0) {
              stockStatus = '<span class="stock-status-low">Habis</span>';
            } else if (product.stock <= 5) {
              stockStatus = '<span class="stock-status-medium">Rendah</span>';
            }
            
            return `
              <tr>
                <td>${index + 1}</td>
                <td>${product.name}</td>
                <td>${product.productCode}</td>
                <td>${product.category?.name || 'Umum'}</td>
                <td>${product.supplier?.name || 'Tidak Ada'}</td>
                <td class="text-center">${product.stock}</td>
                <td class="text-right">${formatCurrency(product.purchasePrice)}</td>
                <td class="text-right">${formatCurrency(stockValue)}</td>
                <td>${stockStatus}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="summary-section">
        <div>Total Produk: ${totalProducts}</div>
        <div>Total Nilai Inventaris: ${formatCurrency(products.reduce((sum, product) => sum + (product.stock * product.purchasePrice), 0))}</div>
      </div>

      ${stockMovements.length > 0 ? `
        <div class="summary-section">
          <h3>Riwayat Perubahan Stok:</h3>
          <ul>
            ${stockMovements.map(movement => `
              <li>
                ${formatDate(movement.movedAt)} - ${movement.product?.name || 'Produk Tidak Dikenal'}: 
                ${movement.quantityChange > 0 ? 'Masuk' : 'Keluar'} ${Math.abs(movement.quantityChange)} - 
                ${movement.description || 'Perubahan Stok'}
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

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