// components/admin/MemberSpendingReportPDFGenerator.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateMemberSpendingReportPDF = (member, transactions) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.text('LAPORAN PEMBELANJAAN MEMBER', 105, 20, null, null, 'center');
  
  // Member Info
  doc.setFontSize(12);
  doc.text(`Nama: ${member.name}`, 20, 40);
  doc.text(`Nomor Telepon: ${member.phone}`, 20, 48);
  doc.text(`Jenis Membership: ${member.membershipType}`, 20, 56);
  if (member.code) {
    doc.text(`Kode Member: ${member.code}`, 20, 64);
    doc.text(`Tanggal Registrasi: ${new Date(member.createdAt).toLocaleDateString('id-ID')}`, 20, 72);
  } else {
    doc.text(`Tanggal Registrasi: ${new Date(member.createdAt).toLocaleDateString('id-ID')}`, 20, 64);
  }

  // Summary Stats
  const totalTransactions = transactions.length;
  const totalSpent = transactions.length > 0
    ? transactions.reduce((sum, t) => sum + t.total, 0)
    : 0;
  const avgTransaction = totalTransactions > 0
    ? totalSpent / totalTransactions
    : 0;
  const paidTransactions = transactions.filter(t => t.status === 'PAID').length;

  // Adjust positions based on whether member code is displayed
  const statsStartY = member.code ? 72 : 64;
  doc.text(`Total Transaksi: ${totalTransactions}`, 120, statsStartY);
  doc.text(`Total Pembelian: Rp ${totalSpent.toLocaleString()}`, 120, statsStartY + 8);
  doc.text(`Rata-rata Transaksi: Rp ${Math.round(avgTransaction).toLocaleString()}`, 120, statsStartY + 16);
  doc.text(`Transaksi Lunas: ${paidTransactions}/${totalTransactions}`, 120, statsStartY + 24);

  // Transactions Table
  if (transactions.length > 0) {
    const startY = member.code ? 90 : 80;

    // Title for transactions table
    doc.setFontSize(14);
    doc.text('RIWAYAT TRANSAKSI', 20, startY);

    // Table
    const tableColumn = ['No. Invoice', 'Tanggal', 'Total', 'Pembayaran', 'Status'];
    const tableRows = transactions.map(transaction => [
      transaction.invoiceNumber,
      new Date(transaction.date).toLocaleDateString('id-ID'),
      `Rp ${transaction.total.toLocaleString()}`,
      `${transaction.paymentMethod} - Rp ${transaction.payment.toLocaleString()}`,
      transaction.status
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: startY + 5,
      styles: {
        fontSize: 10,
        cellPadding: 5
      },
      headStyles: {
        fillColor: [100, 100, 100]
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      }
    });
  } else {
    const noTransactionsY = member.code ? 90 : 80;
    doc.text('Tidak ada riwayat transaksi untuk member ini.', 20, noTransactionsY);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Halaman ${i} dari ${pageCount}`, 20, doc.internal.pageSize.height - 10);
  }

  // Save the PDF
  doc.save(`Laporan-Pembelanjaan-${member.name.replace(/\s+/g, '_')}.pdf`);
};