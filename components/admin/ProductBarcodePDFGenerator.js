import { jsPDF } from 'jspdf';

// Fungsi untuk menghasilkan PDF dengan barcode produk
export const generateProductBarcodePDF = (products, options = {}) => {
  const {
    barcodeWidth = 50,  // Lebar barcode dalam mm
    barcodeHeight = 15, // Tinggi barcode dalam mm
    labelWidth = 70,    // Lebar label dalam mm
    labelHeight = 25,   // Tinggi label dalam mm
    margin = 5,         // Margin dalam mm
    fontSize = 8,       // Ukuran font dalam pt
    darkMode = false,
    includeProductName = true,
    includeProductCode = true
  } = options;

  // Membuat dokumen PDF baru
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Mendapatkan dimensi halaman
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Menghitung berapa banyak kolom dan baris label per halaman
  const cols = Math.floor((pageWidth - 2 * margin) / (labelWidth + margin));
  const rows = Math.floor((pageHeight - 2 * margin) / (labelHeight + margin));

  let currentX = margin;
  let currentY = margin;

  // Loop untuk setiap produk
  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    // Jika kita mencapai batas bawah halaman, buat halaman baru
    if (currentY + labelHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      currentX = margin;
    }

    try {
      // Gambar barcode langsung di PDF
      drawBarcodeInPDF(doc, product.productCode,
        currentX + (labelWidth - barcodeWidth) / 2, // Center barcode horizontally
        currentY,
        barcodeWidth,
        barcodeHeight
      );

      // Menambahkan teks produk di bawah barcode
      doc.setFontSize(fontSize);
      doc.setTextColor(0); // Hitam

      if (includeProductName) {
        // Membuat nama produk menjadi lebih pendek jika terlalu panjang
        const productName = product.name.length > 20 ?
          product.name.substring(0, 17) + '...' :
          product.name;

        doc.text(
          productName,
          currentX + labelWidth / 2,
          currentY + barcodeHeight + 5,
          { align: 'center' }
        );
      }

      if (includeProductCode) {
        doc.setFontSize(fontSize - 2); // Sedikit lebih kecil dari nama produk
        doc.text(
          product.productCode,
          currentX + labelWidth / 2,
          currentY + barcodeHeight + 8 + (includeProductName ? 2 : 0),
          { align: 'center' }
        );
      }

    } catch (error) {
      console.error('Error generating barcode for product:', product, error);
      // Jika gagal membuat barcode, tampilkan teks sebagai alternatif
      doc.setFontSize(fontSize);
      doc.setTextColor(0); // Hitam

      // Tambahkan kotak sebagai pengganti barcode
      doc.setDrawColor(0); // Hitam
      doc.setFillColor(255); // Putih
      doc.rect(currentX, currentY, labelWidth, labelHeight * 0.7, 'FD'); // Gambar kotak putih dengan border

      // Tambahkan teks produk
      if (includeProductName) {
        const productName = product.name.length > 20 ?
          product.name.substring(0, 17) + '...' :
          product.name;
        doc.text(
          productName,
          currentX + labelWidth / 2,
          currentY + labelHeight * 0.3,
          { align: 'center' }
        );
      }

      if (includeProductCode) {
        doc.setFontSize(fontSize - 2); // Sedikit lebih kecil dari nama produk
        doc.text(
          product.productCode,
          currentX + labelWidth / 2,
          currentY + labelHeight * 0.5,
          { align: 'center' }
        );
      }
    }

    // Pindah ke posisi berikutnya
    currentX += labelWidth + margin;

    // Jika mencapai batas kanan halaman, pindah ke baris berikutnya
    if ((i + 1) % cols === 0) {
      currentX = margin;
      currentY += labelHeight + margin;
    }
  }

  // Menyimpan file PDF
  doc.save(`barcode-produk-${new Date().toISOString().slice(0, 10)}.pdf`);
};

// Fungsi untuk menggambar barcode langsung di PDF
const drawBarcodeInPDF = (doc, code, x, y, width, height) => {
  // Membuat barcode yang lebih menyerupai barcode nyata
  doc.setFillColor(0); // Warna hitam untuk barcode

  // Buat pola yang menyerupai barcode standar berdasarkan kode produk
  const codeStr = code.toString();

  // Kita gunakan algoritma sederhana untuk membuat pola yang konsisten
  // berdasarkan karakter dalam kode
  const elements = [];
  let patternValue = 1; // Nilai awal untuk pembuatan pola

  // Buat pola berdasarkan setiap karakter dalam kode
  for (let i = 0; i < codeStr.length; i++) {
    const charCode = codeStr.charCodeAt(i);

    // Buat beberapa elemen (bar atau spasi) untuk setiap karakter
    for (let j = 0; j < 4; j++) {
      // Hasilkan jenis elemen (bar atau spasi) dan lebar berdasarkan pola
      const elementValue = (charCode * 7 + j * 11 + patternValue) % 17;
      const isBar = elementValue % 2 === 0;
      const elementWidth = 1 + (elementValue % 3); // Lebar bervariasi antara 1-3
      const elementHeight = height * (0.7 + (elementValue % 4) * 0.1); // Variasi tinggi

      elements.push({
        isBar,
        width: elementWidth,
        height: elementHeight
      });

      // Perbarui patternValue untuk mempengaruhi elemen berikutnya
      patternValue = (patternValue * 3 + elementValue) % 100;
    }
  }

  // Skalakan elemen-elemen ke ukuran yang sesuai dengan lebar yang tersedia
  const totalElementWidth = elements.reduce((sum, el) => sum + el.width, 0);
  const scale = width / totalElementWidth;

  // Gambar setiap elemen
  let currentX = x;
  for (const element of elements) {
    if (element.isBar) {
      // Gambar bar hitam
      const scaledWidth = element.width * scale;
      const scaledHeight = element.height;
      doc.rect(currentX, y, scaledWidth * 0.9, scaledHeight, 'F'); // 0.9 untuk memberi sedikit celah antar bar
    }

    // Pindahkan posisi X tergantung apakah ini bar atau spasi
    currentX += element.width * scale;
  }

  // Tambahkan teks kode di bawah barcode
  doc.setFontSize(6);
  doc.setTextColor(0); // Hitam
  doc.text(code, x + width / 2, y + height + 3, { align: 'center' });
};