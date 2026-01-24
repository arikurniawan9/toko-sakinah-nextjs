import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import 'jspdf-barcode';

// Fungsi untuk menghasilkan PDF kartu member yang lebih elegan
export const generateMemberCardPDF = (member, options = {}) => {
  const {
    cardWidth = 53.98,  // Lebar kartu dalam mm (diubah untuk potrait)
    cardHeight = 85.6, // Tinggi kartu dalam mm (diubah untuk potrait)
    margin = 20,         // Margin dalam mm
    fontSize = 10,       // Ukuran font dalam pt
    darkMode = false,
  } = options;

  // Membuat dokumen PDF baru
  const doc = new jsPDF({
    orientation: 'portrait', // Portrait untuk tata letak kartu
    unit: 'mm',
    format: 'a4'
  });

  // Mendapatkan dimensi halaman
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Gambar satu kartu member
  let currentX = (pageWidth - cardWidth) / 2; // Posisi horizontal agar kartu berada di tengah
  let currentY = margin; // Posisi vertikal dengan margin dari atas

  // Gradient background effect using solid color
  doc.setFillColor(147, 51, 234); // Purple-500
  doc.roundedRect(currentX, currentY, cardWidth, cardHeight, 5, 5, 'F'); // Rounded rectangle with purple background

  // Inner white content area
  doc.setFillColor(255, 255, 255); // Putih
  doc.roundedRect(currentX + 3, currentY + 3, cardWidth - 6, cardHeight - 6, 3, 3, 'F'); // Inner white rounded rectangle

  // Elegant header with logo placeholder
  doc.setFillColor(147, 51, 234); // Purple-500
  doc.rect(currentX + 3, currentY + 3, cardWidth - 6, 15, 'F'); // Header bar lebih tinggi

  // Add "MEMBER CARD" text in elegant style
  doc.setFontSize(fontSize + 3);
  doc.setTextColor(255, 255, 255); // Putih
  doc.setFont('helvetica', 'bold');
  doc.text('KARTU MEMBER', currentX + cardWidth / 2, currentY + 12, { align: 'center' });

  // Reset font
  doc.setFont('helvetica', 'normal');

  // Add member's name in elegant style
  doc.setTextColor(0, 0, 0); // Hitam
  doc.setFontSize(fontSize + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(member.name, currentX + cardWidth / 2, currentY + 30, { align: 'center' });

  // Reset font
  doc.setFont('helvetica', 'normal');

  // Add membership type
  doc.setFontSize(fontSize + 1);
  doc.setTextColor(100, 100, 100); // Abu-abu gelap
  doc.text(`Tipe: ${member.membershipType || 'REGULER'}`, currentX + cardWidth / 2, currentY + 38, { align: 'center' });

  // Add member code if exists
  if (member.code) {
    doc.setFontSize(fontSize + 1);
    doc.setTextColor(100, 100, 100); // Abu-abu gelap
    doc.text(`Kode: ${member.code}`, currentX + cardWidth / 2, currentY + 44, { align: 'center' });
  }

  // Reset font and color
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0); // Hitam

  // Add expiry date if exists
  if (member.expiryDate) {
    doc.setFontSize(fontSize);
    doc.setTextColor(100, 100, 100); // Abu-abu gelap
    doc.text(`Berlaku s/d: ${new Date(member.expiryDate).toLocaleDateString('id-ID')}`, currentX + cardWidth / 2, currentY + 50, { align: 'center' });
  }

  // Add barcode for member code using jspdf-barcode
  if (member.code) {
    try {
      // Using jspdf-barcode plugin
      doc.addBarcode(member.code, currentX + 5, currentY + 58, {
        width: 0.5,
        height: 15,
        fontsize: 8,
        textPosition: 'bottom'
      });
    } catch (error) {
      console.error('Error generating barcode:', error);
      // Fallback: show code as text if barcode fails
      doc.setFontSize(fontSize);
      doc.setTextColor(0, 0, 0); // Hitam
      doc.text(`Kode: ${member.code}`, currentX + cardWidth / 2, currentY + 60, { align: 'center' });
    }
  }

  // Add company logo/text at bottom
  doc.setFontSize(fontSize);
  doc.setTextColor(100, 100, 100); // Abu-abu gelap
  doc.text('TOKO SAKINAH', currentX + cardWidth / 2, currentY + cardHeight - 5, { align: 'center' });

  // Simpan file PDF
  doc.save(`kartu-member-${member.code || 'unknown'}.pdf`);
};

// Fungsi untuk menghasilkan PDF dengan beberapa kartu member sekaligus
export const generateMultipleMemberCardsPDF = (members, options = {}) => {
  const {
    cardWidth = 53.98,  // Lebar kartu dalam mm (diubah untuk potrait)
    cardHeight = 85.6, // Tinggi kartu dalam mm (diubah untuk potrait)
    margin = 20,         // Margin dalam mm
    fontSize = 10,       // Ukuran font dalam pt
    darkMode = false,
  } = options;

  // Membuat dokumen PDF baru
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Mendapatkan dimensi halaman
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Hitung berapa banyak kartu per halaman (hanya 1 kolom karena potrait)
  const cols = 1; // Hanya 1 kolom karena kartu sekarang lebih tinggi
  const rows = Math.floor((pageHeight - 2 * margin) / (cardHeight + margin));

  // Loop untuk setiap member
  for (let i = 0; i < members.length; i++) {
    const member = members[i];

    // Jika kita mencapai batas kartu per halaman, tambah halaman baru
    if (i > 0 && i % (cols * rows) === 0) {
      doc.addPage('a4', 'portrait');
    }

    // Hitung indeks kartu dalam halaman saat ini
    const indexInPage = i % (cols * rows);
    const colIndex = indexInPage % cols;
    const rowIndex = Math.floor(indexInPage / cols);

    // Posisi kartu
    const currentX = (pageWidth - cardWidth) / 2; // Posisi horizontal agar kartu berada di tengah
    const currentY = margin + (rowIndex * (cardHeight + margin)); // Posisi vertikal dengan margin dari atas

    // Gradient background effect using solid color
    doc.setFillColor(147, 51, 234); // Purple-500
    doc.roundedRect(currentX, currentY, cardWidth, cardHeight, 5, 5, 'F'); // Rounded rectangle with purple background

    // Inner white content area
    doc.setFillColor(255, 255, 255); // Putih
    doc.roundedRect(currentX + 3, currentY + 3, cardWidth - 6, cardHeight - 6, 3, 3, 'F'); // Inner white rounded rectangle

    // Elegant header with logo placeholder
    doc.setFillColor(147, 51, 234); // Purple-500
    doc.rect(currentX + 3, currentY + 3, cardWidth - 6, 15, 'F'); // Header bar lebih tinggi

    // Add "MEMBER CARD" text in elegant style
    doc.setFontSize(fontSize + 3);
    doc.setTextColor(255, 255, 255); // Putih
    doc.setFont('helvetica', 'bold');
    doc.text('KARTU MEMBER', currentX + cardWidth / 2, currentY + 12, { align: 'center' });

    // Reset font
    doc.setFont('helvetica', 'normal');

    // Add member's name in elegant style
    doc.setTextColor(0, 0, 0); // Hitam
    doc.setFontSize(fontSize + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(member.name, currentX + cardWidth / 2, currentY + 30, { align: 'center' });

    // Reset font
    doc.setFont('helvetica', 'normal');

    // Add membership type
    doc.setFontSize(fontSize + 1);
    doc.setTextColor(100, 100, 100); // Abu-abu gelap
    doc.text(`Tipe: ${member.membershipType || 'REGULER'}`, currentX + cardWidth / 2, currentY + 38, { align: 'center' });

    // Add member code if exists
    if (member.code) {
      doc.setFontSize(fontSize + 1);
      doc.setTextColor(100, 100, 100); // Abu-abu gelap
      doc.text(`Kode: ${member.code}`, currentX + cardWidth / 2, currentY + 44, { align: 'center' });
    }

    // Reset font and color
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0); // Hitam

    // Add expiry date if exists
    if (member.expiryDate) {
      doc.setFontSize(fontSize);
      doc.setTextColor(100, 100, 100); // Abu-abu gelap
      doc.text(`Berlaku s/d: ${new Date(member.expiryDate).toLocaleDateString('id-ID')}`, currentX + cardWidth / 2, currentY + 50, { align: 'center' });
    }

    // Add barcode for member code using jspdf-barcode
    if (member.code) {
      try {
        // Using jspdf-barcode plugin
        doc.addBarcode(member.code, currentX + 5, currentY + 58, {
          width: 0.5,
          height: 15,
          fontsize: 8,
          textPosition: 'bottom'
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
        // Fallback: show code as text if barcode fails
        doc.setFontSize(fontSize);
        doc.setTextColor(0, 0, 0); // Hitam
        doc.text(`Kode: ${member.code}`, currentX + cardWidth / 2, currentY + 60, { align: 'center' });
      }
    }

    // Add company logo/text at bottom
    doc.setFontSize(fontSize);
    doc.setTextColor(100, 100, 100); // Abu-abu gelap
    doc.text('TOKO SAKINAH', currentX + cardWidth / 2, currentY + cardHeight - 5, { align: 'center' });
  }

  // Simpan file PDF
  doc.save(`kartu-member-multiple.pdf`);
};