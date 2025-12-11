import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';

// Fungsi untuk menghasilkan PDF dengan barcode produk dalam format standar
export const generateProductBarcodePDF = (products, options = {}) => {
  const {
    barcodeWidth = 38,  // Lebar barcode dalam mm (diperkecil)
    barcodeHeight = 15, // Tinggi barcode dalam mm
    labelWidth = 50,    // Lebar label dalam mm (diperkecil)
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
    // Membuat teks nama produk (jika diperlukan)
    let yPos = currentY; // Mulai dari posisi currentY

    if (includeProductName) {
      doc.setFontSize(fontSize - 2); // Ukuran font lebih kecil untuk nama produk

      // Ambil nama produk dan batasi maksimal 2 baris
      const productName = product.name;
      const maxWidth = labelWidth - 4; // Kurangi sedikit margin

      // Pisahkan teks menjadi dua baris maksimum
      const words = productName.split(' ');
      const lines = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textSize = doc.getTextWidth(testLine);

        // Jika testLine melebihi lebar maksimum, maka pindahkan ke baris baru
        if (textSize > maxWidth && currentLine !== '') {
          lines.push(currentLine);
          if (lines.length >= 1) { // Batasi ke 2 baris maksimal (kita baru menambahkan 1 baris)
            currentLine = word;
            break; // Kita hanya akan punya maksimal 2 baris
          }
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      // Tambahkan baris terakhir
      if (currentLine) {
        lines.push(currentLine);
      }

      // Jika lebih dari 2 baris, gabungkan sisa teks ke baris kedua dengan ellipsis
      if (lines.length > 2) {
        lines[1] = lines.slice(1).join(' ') + '...';
        lines.splice(2); // Hanya ambil 2 baris pertama
      }

      // Teks nama produk diposisikan di atas barcode
      doc.text(
        lines,
        currentX + labelWidth / 2,
        yPos,
        { align: 'center' }
      );

      // Tambahkan jarak berdasarkan jumlah baris teks
      const lineHeight = 5; // Jarak antar baris
      const linesCount = lines.length;
      yPos += (lineHeight * linesCount) - 2; // Kurangi sedikit agar tetap rapat
    }

    // Gambar barcode standar menggunakan JsBarcode
    drawStandardBarcodeInPDF(doc, product.productCode,
      currentX + (labelWidth - barcodeWidth) / 2, // Center barcode secara horizontal
      yPos, // Posisi Y untuk barcode
      barcodeWidth,
      barcodeHeight
    );

    yPos += barcodeHeight + 3; // Jarak antara barcode dan kode produk (ditambahkan)

    // Tambahkan kode produk di bawah barcode jika diperlukan
    if (includeProductCode) {
      doc.setFontSize(fontSize); // Ukuran font untuk kode produk
      doc.text(
        product.productCode,
        currentX + labelWidth / 2,
        yPos,
        { align: 'center' }
      );
    }

  } catch (error) {
    console.error('Error generating barcode for product:', product, error);
    // Jika gagal membuat barcode, tampilkan teks sebagai alternatif
    doc.setFontSize(fontSize);
    doc.setTextColor(0); // Hitam

    let yPos = currentY; // Mulai dari posisi currentY

    // Tambahkan nama produk di atas (jika diminta)
    if (includeProductName) {
      doc.setFontSize(fontSize - 2); // Ukuran font lebih kecil untuk nama produk

      // Ambil nama produk dan batasi maksimal 2 baris
      const productName = product.name;
      const maxWidth = labelWidth - 4; // Kurangi sedikit margin

      // Pisahkan teks menjadi dua baris maksimum
      const words = productName.split(' ');
      const lines = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textSize = doc.getTextWidth(testLine);

        // Jika testLine melebihi lebar maksimum, maka pindahkan ke baris baru
        if (textSize > maxWidth && currentLine !== '') {
          lines.push(currentLine);
          if (lines.length >= 1) { // Batasi ke 2 baris maksimal (kita baru menambahkan 1 baris)
            currentLine = word;
            break; // Kita hanya akan punya maksimal 2 baris
          }
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      // Tambahkan baris terakhir
      if (currentLine) {
        lines.push(currentLine);
      }

      // Jika lebih dari 2 baris, gabungkan sisa teks ke baris kedua dengan ellipsis
      if (lines.length > 2) {
        lines[1] = lines.slice(1).join(' ') + '...';
        lines.splice(2); // Hanya ambil 2 baris pertama
      }

      doc.text(
        lines,
        currentX + labelWidth / 2,
        yPos,
        { align: 'center' }
      );

      // Tambahkan jarak berdasarkan jumlah baris teks
      const lineHeight = 5; // Jarak antar baris
      const linesCount = lines.length;
      yPos += (lineHeight * linesCount) - 2; // Kurangi sedikit agar tetap rapat
    }

    // Tambahkan kotak sebagai pengganti barcode
    doc.setDrawColor(0); // Hitam
    doc.setFillColor(255); // Putih
    doc.rect(currentX, yPos, labelWidth, labelHeight * 0.5, 'FD'); // Gambar kotak putih dengan border

    yPos += labelHeight * 0.5 + 3; // Jarak antara kotak barcode dan teks kode produk (ditingkatkan)

    // Tambahkan teks kode produk
    if (includeProductCode) {
      doc.setFontSize(fontSize - 1); // Sedikit lebih kecil dari nama produk
      doc.text(
        product.productCode,
        currentX + labelWidth / 2,
        yPos,
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

// Fungsi untuk menggambar barcode standar langsung di PDF
const drawStandardBarcodeInPDF = (doc, code, x, y, width, height) => {
  // Buat elemen canvas sementara untuk menggambar barcode
  const canvas = document.createElement('canvas');

  try {
    // Konversi mm ke px untuk canvas (72 dpi standar)
    // 1 mm = 2.834645669 px (72 dpi / 25.4 mm per inch)
    const mmToPx = 2.834645669;

    // Pilih format barcode berdasarkan karakter dalam kode
    let format = 'CODE128'; // Default ke CODE128 karena mendukung semua karakter ASCII

    // Jika kode hanya berisi angka dan panjangnya 13 digit, gunakan EAN-13
    if (/^\d{13}$/.test(code)) {
      format = 'EAN13';
    }
    // Jika kode hanya berisi angka dan panjangnya 12 digit, gunakan EAN-12 (UPC-A)
    else if (/^\d{12}$/.test(code)) {
      format = 'EAN12';
    }
    // Jika kode hanya berisi angka dan panjangnya 8 digit, gunakan EAN-8
    else if (/^\d{8}$/.test(code)) {
      format = 'EAN8';
    }
    // Jika kode hanya berisi angka, gunakan CODE39
    else if (/^\d+$/.test(code)) {
      format = 'CODE39';
    }
    // Jika kode mengandung karakter alfanumerik dan simbol khusus, tetap gunakan CODE128
    else if (/^[0-9A-Za-z\-\.\$\/\+\%]+$/.test(code)) {
      format = 'CODE128';
    }

    // Generate barcode menggunakan JsBarcode dengan format yang sesuai
    JsBarcode(canvas, code, {
      format: format,      // Format barcode yang ditentukan berdasarkan isi kode
      width: 1,         // Lebar bar
      height: height * mmToPx, // Tinggi barcode dalam px
      displayValue: false, // Kita akan menambahkan teks secara manual
      fontOptions: '',
      fontSize: 10,
      textMargin: 0,
      margin: 0,
      marginWidth: 0,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0
    });

    // Gambar barcode dari canvas ke PDF
    if (canvas.width > 0 && canvas.height > 0) {
      // Gambar barcode ke PDF
      doc.addImage(canvas.toDataURL(), 'PNG', x, y, width, height);
    } else {
      // Fallback jika canvas kosong - buat barcode manual sederhana
      drawFallbackBarcode(doc, code, x, y, width, height);
    }
  } catch (error) {
    console.error('Error drawing barcode with JsBarcode:', error);
    // Jika JsBarcode gagal, gunakan fallback
    drawFallbackBarcode(doc, code, x, y, width, height);
  }
};

// Fallback untuk menggambar barcode jika JsBarcode gagal
const drawFallbackBarcode = (doc, code, x, y, width, height) => {
  doc.setFillColor(0); // Warna hitam untuk barcode

  // Fallback sederhana: hanya gambar beberapa bar hitam dan putih
  const codeStr = code.toString();
  const barCount = 20; // Jumlah bar dalam fallback
  const barWidth = width / barCount;

  for (let i = 0; i < barCount; i++) {
    // Tentukan apakah ini bar hitam atau spasi putih berdasarkan pola dari kode
    const codeIndex = i % codeStr.length;
    const charValue = codeStr.charCodeAt(codeIndex);
    const isBar = (i + charValue) % 2 === 0;

    if (isBar) {
      // Gambar bar hitam
      doc.rect(x + i * barWidth, y, barWidth * 0.8, height, 'F');
    }
  }
};

// Fungsi untuk menghasilkan PDF barcode untuk satu produk dengan jumlah yang bisa ditentukan
export const generateSingleProductBarcodePDF = (product, quantity = 1, options = {}) => {
  const {
    barcodeWidth = 38,  // Lebar barcode dalam mm (diperkecil)
    barcodeHeight = 15, // Tinggi barcode dalam mm
    labelWidth = 50,    // Lebar label dalam mm (diperkecil)
    labelHeight = 25,   // Tinggi label dalam mm
    margin = 5,         // Margin dalam mm
    fontSize = 8,       // Ukuran font dalam pt
    darkMode = false,
    includeProductName = true,
    includeProductCode = true
  } = options;

  // Membuat array produk dengan jumlah sesuai quantity
  const products = Array(quantity).fill(product);

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

  // Loop untuk setiap produk (sudah diisi dengan jumlah sesuai quantity)
  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    // Jika kita mencapai batas bawah halaman, buat halaman baru
    if (currentY + labelHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      currentX = margin;
    }

    try {
    // Membuat teks nama produk (jika diperlukan)
    let yPos = currentY; // Mulai dari posisi currentY

    if (includeProductName) {
      doc.setFontSize(fontSize - 2); // Ukuran font lebih kecil untuk nama produk

      // Ambil nama produk dan batasi maksimal 2 baris
      const productName = product.name;
      const maxWidth = labelWidth - 4; // Kurangi sedikit margin

      // Pisahkan teks menjadi dua baris maksimum
      const words = productName.split(' ');
      const lines = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textSize = doc.getTextWidth(testLine);

        // Jika testLine melebihi lebar maksimum, maka pindahkan ke baris baru
        if (textSize > maxWidth && currentLine !== '') {
          lines.push(currentLine);
          if (lines.length >= 1) { // Batasi ke 2 baris maksimal (kita baru menambahkan 1 baris)
            currentLine = word;
            break; // Kita hanya akan punya maksimal 2 baris
          }
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      // Tambahkan baris terakhir
      if (currentLine) {
        lines.push(currentLine);
      }

      // Jika lebih dari 2 baris, gabungkan sisa teks ke baris kedua dengan ellipsis
      if (lines.length > 2) {
        lines[1] = lines.slice(1).join(' ') + '...';
        lines.splice(2); // Hanya ambil 2 baris pertama
      }

      // Teks nama produk diposisikan di atas barcode
      doc.text(
        lines,
        currentX + labelWidth / 2,
        yPos,
        { align: 'center' }
      );

      // Tambahkan jarak berdasarkan jumlah baris teks
      const lineHeight = 5; // Jarak antar baris
      const linesCount = lines.length;
      yPos += (lineHeight * linesCount) - 2; // Kurangi sedikit agar tetap rapat
    }

    // Gambar barcode standar menggunakan JsBarcode
    drawStandardBarcodeInPDF(doc, product.productCode,
      currentX + (labelWidth - barcodeWidth) / 2, // Center barcode secara horizontal
      yPos, // Posisi Y untuk barcode
      barcodeWidth,
      barcodeHeight
    );

    yPos += barcodeHeight + 3; // Jarak antara barcode dan kode produk (ditambahkan)

    // Tambahkan kode produk di bawah barcode jika diperlukan
    if (includeProductCode) {
      doc.setFontSize(fontSize); // Ukuran font untuk kode produk
      doc.text(
        product.productCode,
        currentX + labelWidth / 2,
        yPos,
        { align: 'center' }
      );
    }

  } catch (error) {
    console.error('Error generating barcode for product:', product, error);
    // Jika gagal membuat barcode, tampilkan teks sebagai alternatif
    doc.setFontSize(fontSize);
    doc.setTextColor(0); // Hitam

    let yPos = currentY; // Mulai dari posisi currentY

    // Tambahkan nama produk di atas (jika diminta)
    if (includeProductName) {
      doc.setFontSize(fontSize - 2); // Ukuran font lebih kecil untuk nama produk

      // Ambil nama produk dan batasi maksimal 2 baris
      const productName = product.name;
      const maxWidth = labelWidth - 4; // Kurangi sedikit margin

      // Pisahkan teks menjadi dua baris maksimum
      const words = productName.split(' ');
      const lines = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textSize = doc.getTextWidth(testLine);

        // Jika testLine melebihi lebar maksimum, maka pindahkan ke baris baru
        if (textSize > maxWidth && currentLine !== '') {
          lines.push(currentLine);
          if (lines.length >= 1) { // Batasi ke 2 baris maksimal (kita baru menambahkan 1 baris)
            currentLine = word;
            break; // Kita hanya akan punya maksimal 2 baris
          }
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      // Tambahkan baris terakhir
      if (currentLine) {
        lines.push(currentLine);
      }

      // Jika lebih dari 2 baris, gabungkan sisa teks ke baris kedua dengan ellipsis
      if (lines.length > 2) {
        lines[1] = lines.slice(1).join(' ') + '...';
        lines.splice(2); // Hanya ambil 2 baris pertama
      }

      doc.text(
        lines,
        currentX + labelWidth / 2,
        yPos,
        { align: 'center' }
      );

      // Tambahkan jarak berdasarkan jumlah baris teks
      const lineHeight = 5; // Jarak antar baris
      const linesCount = lines.length;
      yPos += (lineHeight * linesCount) - 2; // Kurangi sedikit agar tetap rapat
    }

    // Tambahkan kotak sebagai pengganti barcode
    doc.setDrawColor(0); // Hitam
    doc.setFillColor(255); // Putih
    doc.rect(currentX, yPos, labelWidth, labelHeight * 0.5, 'FD'); // Gambar kotak putih dengan border

    yPos += labelHeight * 0.5 + 3; // Jarak antara kotak barcode dan teks kode produk (ditingkatkan)

    // Tambahkan teks kode produk
    if (includeProductCode) {
      doc.setFontSize(fontSize - 1); // Sedikit lebih kecil dari nama produk
      doc.text(
        product.productCode,
        currentX + labelWidth / 2,
        yPos,
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
  doc.save(`barcode-${product.productCode}-${new Date().toISOString().slice(0, 10)}.pdf`);
};