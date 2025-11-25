import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportSupplierPDF = async (data, darkMode) => {
  const doc = new jsPDF('p', 'pt', 'a4'); // 'p' for portrait, 'pt' for points, 'a4' for A4 size

  // Add header
  doc.setFontSize(18);
  doc.text('Laporan Data Supplier', 40, 60);

  doc.setFontSize(10);
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 40, 80);

  let yPos = 120; // Starting Y position for the table content

  // Table Headers
  const headers = [
    'No.', 'Nama Supplier', 'Nama Kontak', 'Telepon', 'Email', 'Alamat'
  ];

  const tableColumn = headers.map(header => ({
    header: header,
    dataKey: header.replace(/ /g, '').toLowerCase().replace('.', '') // Simple conversion for dataKey
  }));

  const tableRows = [];
  data.forEach((supplier, index) => {
    const row = {
      'no': index + 1,
      'namasupplier': supplier.name,
      'namakontak': supplier.contactPerson,
      'telepon': supplier.phone,
      'email': supplier.email,
      'alamat': supplier.address || '-',
    };
    tableRows.push(row);
  });
  
  doc.autoTable({
    head: [headers],
    body: tableRows.map(row => Object.values(row)),
    startY: yPos,
    theme: 'grid', // You can change the theme (e.g., 'striped', 'grid', 'plain')
    styles: {
      fontSize: 8,
      cellPadding: 4,
      fillColor: darkMode ? [45, 55, 72] : [255, 255, 255], // bg-gray-800 or bg-white
      textColor: darkMode ? [226, 232, 240] : [26, 32, 44], // text-gray-200 or text-gray-900
      lineColor: darkMode ? [74, 85, 104] : [229, 231, 235], // border-gray-700 or border-gray-200
    },
    headStyles: {
      fillColor: darkMode ? [31, 41, 55] : [249, 250, 251], // bg-gray-900 or bg-gray-50
      textColor: darkMode ? [255, 255, 255] : [75, 85, 99], // text-white or text-gray-700
      fontStyle: 'bold',
    },
    didDrawPage: function (data) {
      // Footer
      doc.setFontSize(8);
      const pageCount = doc.internal.getNumberOfPages();
      doc.text(`Halaman ${data.pageNumber} dari ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 30);
    }
  });

  doc.save('laporan_supplier.pdf');
};
