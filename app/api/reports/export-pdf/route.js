// app/api/reports/export-pdf/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      reportType,           // 'sales', 'products', 'comparative', 'historical'
      startDate, 
      endDate, 
      storeId: inputStoreId,
      template = 'standard', // 'standard', 'detailed', 'summary', 'executive'
      includeCharts = false,
      includeComparativeData = false,
      format = 'A4',        // 'A4', 'A3', 'letter'
      orientation = 'portrait', // 'portrait', 'landscape'
      filters = {}
    } = body;

    // Ambil storeId dari session jika tidak disediakan di body
    const storeId = inputStoreId || session.user.storeId;
    if (!storeId) {
      return NextResponse.json({ error: 'Store ID not found in session or request' }, { status: 400 });
    }

    // Generate PDF berdasarkan jenis laporan
    let reportData;
    switch (reportType) {
      case 'sales':
        reportData = await generateSalesReportData(storeId, startDate, endDate, filters);
        break;
      case 'products':
        reportData = await generateProductsReportData(storeId, startDate, endDate, filters);
        break;
      case 'comparative':
        reportData = await generateComparativeReportData(storeId, startDate, endDate, filters);
        break;
      case 'historical':
        reportData = await generateHistoricalReportData(storeId, startDate, endDate, filters);
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    // Buat PDF
    const pdfBuffer = await createReportPDF(reportData, reportType, template, {
      format,
      orientation,
      includeCharts,
      includeComparativeData
    });

    // Return PDF sebagai response
    const response = new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });

    return response;
  } catch (error) {
    console.error('Error generating PDF report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Fungsi untuk menghasilkan data laporan penjualan
async function generateSalesReportData(storeId, startDate, endDate, filters) {
  const sales = await prisma.sale.findMany({
    where: {
      storeId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    },
    include: {
      cashier: true,
      attendant: true,
      member: true,
      saleDetails: {
        include: {
          product: true
        }
      }
    },
    orderBy: { date: 'desc' }
  });

  // Hitung ringkasan
  const summary = {
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, sale) => sum + (sale.total || 0), 0),
    totalDiscount: sales.reduce((sum, sale) => sum + (sale.discount || 0), 0),
    avgTransactionValue: sales.length ? 
      (sales.reduce((sum, sale) => sum + (sale.total || 0), 0) / sales.length) : 0
  };

  // Tambahkan data untuk produk terlaris jika diperlukan
  const topProducts = calculateTopProducts(sales);

  return {
    type: 'sales',
    title: 'Laporan Penjualan',
    period: { start: startDate, end: endDate },
    storeId,
    data: sales,
    summary,
    topProducts
  };
}

// Fungsi untuk menghasilkan data laporan produk
async function generateProductsReportData(storeId, startDate, endDate, filters) {
  const saleDetails = await prisma.saleDetail.findMany({
    where: {
      product: {
        storeId
      },
      sale: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    },
    include: {
      product: true,
      sale: true
    }
  });

  // Kelompokkan berdasarkan produk
  const productDataMap = {};
  saleDetails.forEach(detail => {
    const productId = detail.productId;
    if (!productDataMap[productId]) {
      productDataMap[productId] = {
        product: detail.product,
        totalQuantity: 0,
        totalRevenue: 0,
        transactions: 0
      };
    }
    productDataMap[productId].totalQuantity += detail.quantity;
    productDataMap[productId].totalRevenue += detail.subtotal;
    productDataMap[productId].transactions += 1;
  });

  const productData = Object.values(productDataMap);
  
  // Hitung ringkasan
  const summary = {
    totalProducts: productData.length,
    totalQuantitySold: productData.reduce((sum, product) => sum + product.totalQuantity, 0),
    totalRevenue: productData.reduce((sum, product) => sum + product.totalRevenue, 0),
    avgRevenuePerProduct: productData.length ? 
      (productData.reduce((sum, product) => sum + product.totalRevenue, 0) / productData.length) : 0
  };

  // Urutkan berdasarkan kuantitas atau pendapatan
  const sortBy = filters.sortBy || 'revenue';
  productData.sort((a, b) => sortBy === 'quantity' ? 
    b.totalQuantity - a.totalQuantity : 
    b.totalRevenue - a.totalRevenue);

  return {
    type: 'products',
    title: 'Laporan Produk',
    period: { start: startDate, end: endDate },
    storeId,
    data: productData,
    summary
  };
}

// Fungsi untuk menghasilkan data laporan komparatif
async function generateComparativeReportData(storeId, startDate, endDate, filters) {
  // Ini akan menjadi kompleks karena membandingkan dua periode
  // Kita asumsikan endDate adalah akhir dari periode 2
  // dan startDate adalah awal dari periode 1
  // Untuk contoh, buat dua periode dengan durasi yang sama
  const period1End = new Date(startDate);
  const period2End = new Date(endDate);
  
  // Hitung durasi antara startDate dan endDate
  const diffTime = Math.abs(period2End - period1End);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const period1Start = new Date(period1End);
  period1Start.setDate(period1Start.getDate() - diffDays);
  
  const period2Start = new Date(period1End);

  // Ambil data untuk kedua periode
  const [period1Data, period2Data] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        storeId,
        date: {
          gte: period1Start,
          lte: period1End
        }
      },
      _sum: {
        total: true,
        discount: true
      },
      _count: true
    }),
    prisma.sale.aggregate({
      where: {
        storeId,
        date: {
          gte: period2Start,
          lte: period2End
        }
      },
      _sum: {
        total: true,
        discount: true
      },
      _count: true
    })
  ]);

  const period1Total = period1Data._sum.total || 0;
  const period2Total = period2Data._sum.total || 0;
  
  const growthPercentage = period1Total > 0 
    ? ((period2Total - period1Total) / period1Total) * 100 
    : period2Total > 0 ? 100 : 0;

  return {
    type: 'comparative',
    title: 'Laporan Komparatif',
    periods: {
      period1: { start: period1Start, end: period1End },
      period2: { start: period2Start, end: period2End }
    },
    data: {
      period1: {
        total: period1Total,
        count: period1Data._count,
        avgPerTransaction: period1Data._count > 0 ? period1Total / period1Data._count : 0
      },
      period2: {
        total: period2Total,
        count: period2Data._count,
        avgPerTransaction: period2Data._count > 0 ? period2Total / period2Data._count : 0
      },
      comparison: {
        totalGrowth: period2Total - period1Total,
        growthPercentage: parseFloat(growthPercentage.toFixed(2)),
        growthDirection: period2Total > period1Total ? 'increase' : 
                        period2Total < period1Total ? 'decrease' : 'same'
      }
    }
  };
}

// Fungsi untuk menghasilkan data laporan historis
async function generateHistoricalReportData(storeId, startDate, endDate, filters) {
  const interval = filters.interval || 'daily';
  
  // Ambil data harian
  const sales = await prisma.sale.groupBy({
    by: ['date'],
    where: {
      storeId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    },
    _sum: {
      total: true,
      payment: true,
    },
    _count: true
  });

  // Kelompokkan ke interval
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

  // Konversi ke array dan urutkan
  const trendData = Object.values(intervalData).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  // Hitung statistik
  const totalSales = trendData.reduce((sum, item) => sum + item.total, 0);
  const avgSales = trendData.length ? totalSales / trendData.length : 0;
  const maxSales = trendData.length ? Math.max(...trendData.map(item => item.total)) : 0;
  const minSales = trendData.length ? Math.min(...trendData.map(item => item.total)) : 0;

  return {
    type: 'historical',
    title: 'Laporan Tren Historis',
    period: { start: startDate, end: endDate },
    interval,
    data: trendData,
    summary: {
      totalSales,
      avgSales: parseFloat(avgSales.toFixed(2)),
      maxSales: parseFloat(maxSales.toFixed(2)),
      minSales: parseFloat(minSales.toFixed(2)),
      totalDays: trendData.length
    }
  };
}

// Fungsi pembantu untuk menghitung produk terlaris
function calculateTopProducts(sales) {
  const productMap = {};
  
  sales.forEach(sale => {
    sale.saleDetails.forEach(detail => {
      if (!productMap[detail.productId]) {
        productMap[detail.productId] = {
          product: detail.product,
          totalQuantity: 0,
          totalRevenue: 0
        };
      }
      productMap[detail.productId].totalQuantity += detail.quantity;
      productMap[detail.productId].totalRevenue += detail.subtotal;
    });
  });

  return Object.values(productMap)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10); // Ambil 10 produk terlaris
}

// Fungsi pembantu untuk mendapatkan kunci interval
function getIntervalKey(date, interval) {
  const d = new Date(date);
  switch (interval) {
    case 'daily':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    case 'weekly':
      const year = d.getFullYear();
      const week = getWeekNumber(d);
      return `${year}-W${String(week).padStart(2, '0')}`;
    case 'monthly':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    default:
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Fungsi untuk membuat PDF dari data laporan
async function createReportPDF(reportData, reportType, template, options) {
  const { format = 'A4', orientation = 'portrait', includeCharts = false, includeComparativeData = false } = options;
  
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format
  });

  // Tambahkan header
  doc.setFontSize(18);
  doc.text(reportData.title, 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Periode: ${formatDate(reportData.period?.start)} - ${formatDate(reportData.period?.end)}`, 20, 30);
  doc.text(`Dibuat pada: ${new Date().toLocaleString('id-ID')}`, 20, 36);

  let currentY = 45;

  // Tambahkan ringkasan tergantung template
  if (template === 'summary' || template === 'executive') {
    currentY = addSummaryToPDF(doc, reportData, currentY);
  } else {
    // Untuk template detailed, tambahkan semua data
    currentY = addDetailedDataToPDF(doc, reportData, reportType, currentY, template);
  }

  // Tambahkan informasi tambahan tergantung template
  if (template === 'executive') {
    doc.setFontSize(14);
    doc.text('Ringkasan Eksekutif', 20, currentY);
    currentY += 10;
    
    // Tambahkan insight penting
    const insights = generateExecutiveInsights(reportData);
    insights.forEach(insight => {
      doc.setFontSize(12);
      doc.text(`• ${insight}`, 25, currentY);
      currentY += 8;
    });
  }

  // Tambahkan footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Halaman ${i}/${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    doc.text('Laporan Sistem Toko Sakinah', 20, doc.internal.pageSize.height - 10);
  }

  return doc.output('arraybuffer');
}

// Fungsi untuk menambahkan ringkasan ke PDF
function addSummaryToPDF(doc, reportData, startY) {
  const { summary } = reportData;
  if (!summary) return startY;

  doc.setFontSize(14);
  doc.text('Ringkasan', 20, startY);
  startY += 8;

  doc.setFontSize(12);
  let itemY = startY;
  
  for (const [key, value] of Object.entries(summary)) {
    if (typeof value === 'number') {
      doc.text(`${formatReportLabel(key)}: ${formatCurrency(value)}`, 25, itemY);
    } else {
      doc.text(`${formatReportLabel(key)}: ${value}`, 25, itemY);
    }
    itemY += 6;
  }

  return itemY + 5;
}

// Fungsi untuk menambahkan data lengkap ke PDF
function addDetailedDataToPDF(doc, reportData, reportType, startY, template) {
  let currentY = startY;
  
  switch (reportType) {
    case 'sales':
      return addSalesDataToPDF(doc, reportData, currentY, template);
    case 'products':
      return addProductsDataToPDF(doc, reportData, currentY, template);
    case 'comparative':
      return addComparativeDataToPDF(doc, reportData, currentY);
    case 'historical':
      return addHistoricalDataToPDF(doc, reportData, currentY);
    default:
      return currentY;
  }
}

// Fungsi untuk menambahkan data penjualan ke PDF
function addSalesDataToPDF(doc, reportData, startY, template) {
  const { data, summary, topProducts } = reportData;
  let currentY = startY;

  if (template !== 'summary') {
    // Tambahkan tabel penjualan
    doc.setFontSize(14);
    doc.text('Detail Penjualan', 20, currentY);
    currentY += 10;

    // Gunakan autoTable untuk tabel
    const tableColumn = ['No Invoice', 'Tanggal', 'Kasir', 'Pelanggan', 'Total', 'Status'];
    const tableRows = data.slice(0, 50).map(sale => [
      sale.invoiceNumber,
      formatDate(sale.date),
      sale.cashier?.name || 'N/A',
      sale.member?.name || 'Umum',
      formatCurrency(sale.total),
      sale.status
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: currentY,
      theme: 'grid',
      styles: { 
        fontSize: 8,
        cellPadding: 2 
      },
      headStyles: { 
        fillColor: [64, 64, 64] 
      }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // Tambahkan produk terlaris
  if (topProducts && topProducts.length > 0) {
    doc.setFontSize(14);
    doc.text('Produk Terlaris', 20, currentY);
    currentY += 8;

    const topProductsColumn = ['Nama Produk', 'Jumlah Terjual', 'Pendapatan'];
    const topProductsRows = topProducts.map(product => [
      product.product.name,
      product.totalQuantity.toString(),
      formatCurrency(product.totalRevenue)
    ]);

    doc.autoTable({
      head: [topProductsColumn],
      body: topProductsRows,
      startY: currentY,
      theme: 'grid',
      styles: { 
        fontSize: 8,
        cellPadding: 2 
      },
      headStyles: { 
        fillColor: [64, 64, 64] 
      }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  return currentY;
}

// Fungsi untuk menambahkan data produk ke PDF
function addProductsDataToPDF(doc, reportData, startY) {
  const { data, summary } = reportData;
  let currentY = startY;

  // Tambahkan tabel produk
  doc.setFontSize(14);
  doc.text('Statistik Produk', 20, currentY);
  currentY += 10;

  const tableColumn = ['Nama Produk', 'Kategori', 'Jumlah Terjual', 'Pendapatan', 'Transaksi'];
  const tableRows = data.slice(0, 50).map(product => [
    product.product.name,
    product.product.category || 'N/A',
    product.totalQuantity.toString(),
    formatCurrency(product.totalRevenue),
    product.transactions.toString()
  ]);

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: currentY,
    theme: 'grid',
    styles: { 
      fontSize: 8,
      cellPadding: 2 
    },
    headStyles: { 
      fillColor: [64, 64, 64] 
    }
  });

  currentY = doc.lastAutoTable.finalY + 10;

  return currentY;
}

// Fungsi untuk menambahkan data komparatif ke PDF
function addComparativeDataToPDF(doc, reportData, startY) {
  const { periods, data } = reportData;
  let currentY = startY;

  doc.setFontSize(14);
  doc.text('Perbandingan Periode', 20, currentY);
  currentY += 8;

  // Tambahkan informasi periode
  doc.setFontSize(12);
  doc.text(`Periode 1: ${formatDate(periods.period1.start)} - ${formatDate(periods.period1.end)}`, 25, currentY);
  currentY += 6;
  doc.text(`Periode 2: ${formatDate(periods.period2.start)} - ${formatDate(periods.period2.end)}`, 25, currentY);
  currentY += 10;

  // Tabel perbandingan
  const comparisonColumn = ['Metrik', 'Periode 1', 'Periode 2', 'Perbedaan', 'Perubahan (%)'];
  const comparisonRows = [
    [
      'Total Penjualan',
      formatCurrency(data.period1.total),
      formatCurrency(data.period2.total),
      formatCurrency(data.comparison.totalGrowth),
      `${data.comparison.growthPercentage.toFixed(2)}%`
    ],
    [
      'Jumlah Transaksi',
      data.period1.count.toString(),
      data.period2.count.toString(),
      (data.period2.count - data.period1.count).toString(),
      data.period1.count > 0 ? `${(((data.period2.count - data.period1.count) / data.period1.count) * 100).toFixed(2)}%` : 'N/A'
    ],
    [
      'Rata-rata Per Transaksi',
      formatCurrency(data.period1.avgPerTransaction),
      formatCurrency(data.period2.avgPerTransaction),
      formatCurrency(data.period2.avgPerTransaction - data.period1.avgPerTransaction),
      data.period1.avgPerTransaction > 0 ? `${(((data.period2.avgPerTransaction - data.period1.avgPerTransaction) / data.period1.avgPerTransaction) * 100).toFixed(2)}%` : 'N/A'
    ]
  ];

  doc.autoTable({
    head: [comparisonColumn],
    body: comparisonRows,
    startY: currentY,
    theme: 'grid',
    styles: { 
      fontSize: 10,
      cellPadding: 3 
    },
    headStyles: { 
      fillColor: [64, 64, 64] 
    }
  });

  currentY = doc.lastAutoTable.finalY + 10;
  return currentY;
}

// Fungsi untuk menambahkan data historis ke PDF
function addHistoricalDataToPDF(doc, reportData, startY) {
  const { data, summary, interval } = reportData;
  let currentY = startY;

  doc.setFontSize(14);
  doc.text(`Tren ${interval.charAt(0).toUpperCase() + interval.slice(1)}`, 20, currentY);
  currentY += 10;

  // Ambil data sample (misalnya hanya 20 data pertama untuk menghindari tabel terlalu panjang)
  const displayData = data.slice(0, 20);
  const tableColumn = [`${interval.charAt(0).toUpperCase() + interval.slice(1)}`, 'Total', 'Jumlah Transaksi', 'Rata-rata'];
  const tableRows = displayData.map(item => [
    item.date,
    formatCurrency(item.total),
    item.count.toString(),
    formatCurrency(item.total / item.count || 0)
  ]);

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: currentY,
    theme: 'grid',
    styles: { 
      fontSize: 8,
      cellPadding: 2 
    },
    headStyles: { 
      fillColor: [64, 64, 64] 
    }
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // Tambahkan ringkasan statistik
  if (summary) {
    doc.setFontSize(14);
    doc.text('Statistik', 20, currentY);
    currentY += 8;

    doc.setFontSize(12);
    doc.text(`Total Penjualan: ${formatCurrency(summary.totalSales)}`, 25, currentY);
    currentY += 6;
    doc.text(`Rata-rata Harian: ${formatCurrency(summary.avgSales)}`, 25, currentY);
    currentY += 6;
    doc.text(`Tertinggi: ${formatCurrency(summary.maxSales)}`, 25, currentY);
    currentY += 6;
    doc.text(`Terendah: ${formatCurrency(summary.minSales)}`, 25, currentY);
    currentY += 10;
  }

  return currentY;
}

// Fungsi pembantu untuk format tanggal
function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('id-ID');
}

// Fungsi pembantu untuk format mata uang
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

// Fungsi pembantu untuk mengonversi label laporan
function formatReportLabel(label) {
  const labelMap = {
    totalSales: 'Total Penjualan',
    totalRevenue: 'Total Pendapatan',
    totalDiscount: 'Total Diskon',
    avgTransactionValue: 'Rata-rata Nilai Transaksi',
    totalProducts: 'Total Produk',
    totalQuantitySold: 'Total Kuantitas Terjual',
    avgRevenuePerProduct: 'Rata-rata Pendapatan Per Produk',
    totalDays: 'Total Hari',
    maxSales: 'Pendapatan Tertinggi',
    minSales: 'Pendapatan Terendah'
  };

  return labelMap[label] || label;
}

// Fungsi untuk menghasilkan insight eksekutif
function generateExecutiveInsights(reportData) {
  const insights = [];
  
  if (reportData.summary) {
    // Untuk laporan penjualan
    if (reportData.summary.totalRevenue !== undefined) {
      insights.push(`Total pendapatan: ${formatCurrency(reportData.summary.totalRevenue)}`);
      insights.push(`Rata-rata transaksi harian: ${formatCurrency(reportData.summary.avgTransactionValue)}`);
    }
    
    // Untuk laporan produk
    if (reportData.summary.totalQuantitySold !== undefined) {
      insights.push(`Total produk terjual: ${reportData.summary.totalQuantitySold}`);
      insights.push(`Rata-rata pendapatan per produk: ${formatCurrency(reportData.summary.avgRevenuePerProduct)}`);
    }
  }
  
  // Tambahkan insight lain tergantung jenis laporan
  if (reportData.type === 'comparative' && reportData.data?.comparison) {
    const { growthPercentage, growthDirection } = reportData.data.comparison;
    insights.push(`Perubahan pendapatan: ${growthDirection === 'increase' ? '+' : ''}${growthPercentage.toFixed(2)}%`);
  }
  
  return insights;
}