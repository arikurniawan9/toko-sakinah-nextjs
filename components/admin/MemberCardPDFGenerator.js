import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Fungsi untuk menghasilkan PDF kartu member
export const generateMemberCardPDF = (member, options = {}) => {
  const {
    cardWidth = 85.6,  // Lebar kartu dalam mm (sesuai ukuran kartu ATM)
    cardHeight = 53.98, // Tinggi kartu dalam mm (sesuai ukuran kartu ATM)
    margin = 10,         // Margin dalam mm
    fontSize = 10,       // Ukuran font dalam pt
    darkMode = false,
  } = options;

  // Membuat dokumen PDF baru
  const doc = new jsPDF({
    orientation: 'landscape', // Landscape agar bisa muat kartu dengan orientasi yang benar
    unit: 'mm',
    format: 'a4'
  });

  // Mendapatkan dimensi halaman
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Gambar satu kartu member
  let currentX = margin;
  let currentY = (pageHeight - cardHeight) / 2; // Posisi vertikal agar kartu berada di tengah

  // Pastikan ada minimal satu kartu
  doc.setFontSize(fontSize);
  doc.setTextColor(0); // Hitam

  // Gambar satu kartu member
  // Rectangle sebagai border kartu
  doc.setDrawColor(100); // Abu-abu muda untuk border
  doc.setFillColor(255); // Putih untuk background
  doc.roundedRect(currentX, currentY, cardWidth, cardHeight, 3, 3, 'FD'); // Rounded rectangle

  // Gambar header dengan warna tema
  try {
    // Gunakan warna tema untuk dekorasi
    doc.setFillColor(147, 51, 234); // Purple-500
    doc.rect(currentX, currentY, cardWidth, 8, 'F'); // Garis atas ungu

    // Tambahkan teks "MEMBER CARD"
    doc.setFontSize(fontSize + 1);
    doc.setTextColor(255); // Putih untuk teks di atas garis ungu
    doc.text('KARTU MEMBER', currentX + 10, currentY + 5, { align: 'left' });
  } catch (error) {
    console.error('Error drawing header:', error);
  }

  // Tambahkan nama member
  doc.setTextColor(0); // Hitam
  doc.setFontSize(fontSize + 2);
  doc.text(member.name, currentX + cardWidth / 2, currentY + 25, { align: 'center' });

  // Tambahkan kode member
  doc.setFontSize(fontSize);
  doc.text(`Kode: ${member.code}`, currentX + cardWidth / 2, currentY + 32, { align: 'center' });

  // Tambahkan tipe keanggotaan
  doc.setFontSize(fontSize);
  doc.text(`Tipe: ${member.membershipType || 'REGULER'}`, currentX + cardWidth / 2, currentY + 37, { align: 'center' });

  // Tambahkan diskon
  doc.text(`Diskon: ${member.discount || 0}%`, currentX + cardWidth / 2, currentY + 42, { align: 'center' });

  // Tambahkan tanggal kadaluarsa jika ada
  if (member.expiryDate) {
    doc.setFontSize(fontSize - 1);
    doc.text(`Berlaku s/d: ${new Date(member.expiryDate).toLocaleDateString('id-ID')}`, currentX + cardWidth / 2, currentY + 47, { align: 'center' });
  }

  // Tambahkan placeholder untuk foto atau QR code
  try {
    // Gambar kotak untuk foto/QR
    doc.setDrawColor(0);
    doc.setLineWidth(0.25);
    doc.rect(currentX + cardWidth - 22, currentY + 12, 16, 16); // Kotak di pojok kanan atas

    // Placeholder teks
    doc.setFontSize(fontSize - 2);
    doc.setTextColor(0);
    doc.text('FOTO', currentX + cardWidth - 14, currentY + 20, { align: 'center' });
    doc.text('ATAU', currentX + cardWidth - 14, currentY + 22, { align: 'center' });
    doc.text('QR', currentX + cardWidth - 14, currentY + 24, { align: 'center' });
  } catch (error) {
    console.error('Error drawing photo box:', error);
  }

  // Simpan file PDF
  doc.save(`kartu-member-${member.code || 'unknown'}.pdf`);
};

// Fungsi untuk menghasilkan PDF dengan beberapa kartu member sekaligus
export const generateMultipleMemberCardsPDF = (members, options = {}) => {
  const {
    cardWidth = 85.6,  // Lebar kartu dalam mm
    cardHeight = 53.98, // Tinggi kartu dalam mm
    margin = 10,         // Margin dalam mm
    fontSize = 10,       // Ukuran font dalam pt
    darkMode = false,
  } = options;

  // Membuat dokumen PDF baru
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Mendapatkan dimensi halaman
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Hitung berapa banyak kartu per halaman
  const cols = Math.floor((pageWidth - 2 * margin) / (cardWidth + margin));
  const rows = Math.floor((pageHeight - 2 * margin) / (cardHeight + margin));

  // Loop untuk setiap member
  for (let i = 0; i < members.length; i++) {
    const member = members[i];

    // Jika kita mencapai batas kartu per halaman, tambah halaman baru
    if (i > 0 && i % (cols * rows) === 0) {
      doc.addPage('a4', 'landscape');
    }

    // Hitung indeks kartu dalam halaman saat ini
    const indexInPage = i % (cols * rows);
    const colIndex = indexInPage % cols;
    const rowIndex = Math.floor(indexInPage / cols);

    // Posisi kartu
    const currentX = margin + (colIndex * (cardWidth + margin));
    const currentY = margin + (rowIndex * (cardHeight + margin));

    // Gambar satu kartu member
    doc.setFontSize(fontSize);
    doc.setTextColor(0); // Hitam

    // Rectangle sebagai border kartu
    doc.setDrawColor(100); // Abu-abu muda untuk border
    doc.setFillColor(255); // Putih untuk background
    doc.roundedRect(currentX, currentY, cardWidth, cardHeight, 3, 3, 'FD'); // Rounded rectangle

    // Gambar logo atau header
    try {
      // Gunakan warna tema untuk dekorasi
      doc.setFillColor(147, 51, 234); // Purple-500
      doc.rect(currentX, currentY, cardWidth, 8, 'F'); // Garis atas ungu

      // Tambahkan teks "MEMBER CARD"
      doc.setFontSize(fontSize + 1);
      doc.setTextColor(255); // Putih untuk teks di atas garis ungu
      doc.text('KARTU MEMBER', currentX + 10, currentY + 5, { align: 'left' });
    } catch (error) {
      console.error('Error drawing header:', error);
    }

    // Tambahkan nama member
    doc.setTextColor(0); // Hitam
    doc.setFontSize(fontSize + 2);
    doc.text(member.name, currentX + cardWidth / 2, currentY + 25, { align: 'center' });

    // Tambahkan kode member
    doc.setFontSize(fontSize);
    doc.text(`Kode: ${member.code}`, currentX + cardWidth / 2, currentY + 32, { align: 'center' });

    // Tambahkan tipe keanggotaan
    doc.setFontSize(fontSize);
    doc.text(`Tipe: ${member.membershipType || 'REGULER'}`, currentX + cardWidth / 2, currentY + 37, { align: 'center' });

    // Tambahkan diskon
    doc.text(`Diskon: ${member.discount || 0}%`, currentX + cardWidth / 2, currentY + 42, { align: 'center' });

    // Tambahkan tanggal kadaluarsa jika ada
    if (member.expiryDate) {
      doc.setFontSize(fontSize - 1);
      doc.text(`Berlaku s/d: ${new Date(member.expiryDate).toLocaleDateString('id-ID')}`, currentX + cardWidth / 2, currentY + 47, { align: 'center' });
    }

    // Tambahkan placeholder untuk foto atau QR code
    try {
      // Gambar kotak untuk foto/QR
      doc.setDrawColor(0);
      doc.setLineWidth(0.25);
      doc.rect(currentX + cardWidth - 22, currentY + 12, 16, 16); // Kotak di pojok kanan atas

      // Placeholder teks
      doc.setFontSize(fontSize - 2);
      doc.setTextColor(0);
      doc.text('FOTO', currentX + cardWidth - 14, currentY + 20, { align: 'center' });
      doc.text('ATAU', currentX + cardWidth - 14, currentY + 22, { align: 'center' });
      doc.text('QR', currentX + cardWidth - 14, currentY + 24, { align: 'center' });
    } catch (error) {
      console.error('Error drawing photo box:', error);
    }
  }

  // Simpan file PDF
  doc.save(`kartu-member-multiple.pdf`);
};