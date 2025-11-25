// utils/exportSupplierGridPDF.js
// This utility generates an HTML string for printing supplier data in a grid layout.

export const exportSupplierGridPDF = async (darkMode = false) => {
  try {
    const response = await fetch('/api/supplier/export-grid-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Gagal mengambil data untuk laporan grid supplier');
    }

    const { shopInfo, suppliers, exportDate } = await response.json();

    let supplierCardsHtml = '';
    if (suppliers && suppliers.length > 0) {
      suppliers.forEach((supplier) => {
        supplierCardsHtml += `
          <div class="supplier-card ${darkMode ? 'dark' : ''}">
            <h3>${supplier.name}</h3>
            <p><strong>Kontak:</strong> ${supplier.contactPerson || '-'}</p>
            <p><strong>Telepon:</strong> ${supplier.phone || '-'}</p>
            <p><strong>Email:</strong> ${supplier.email || '-'}</p>
            <p><strong>Alamat:</strong> ${supplier.address || '-'}</p>
          </div>
        `;
      });
    } else {
      supplierCardsHtml = `<p class="${darkMode ? 'text-gray-400' : 'text-gray-600'}">Tidak ada data supplier untuk ditampilkan</p>`;
    }

    // Create the full HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Supplier (Grid View) - ${shopInfo.name || 'Toko'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; ${darkMode ? 'background-color: #1f2937; color: white;' : ''}}
          .header { text-align: center; margin-bottom: 20px; }
          .shop-info { margin-bottom: 15px; }
          .grid-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); /* Adjust card width as needed */
            gap: 20px;
            margin-top: 20px;
          }
          .supplier-card {
            border: 1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}; /* border-gray-600 or border-gray-200 */
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            background-color: ${darkMode ? '#2d3748' : '#ffffff'}; /* bg-gray-800 or bg-white */
            color: ${darkMode ? '#cbd5e0' : '#2d3748'}; /* text-gray-300 or text-gray-800 */
          }
          .supplier-card h3 {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 10px;
            color: ${darkMode ? '#ffffff' : '#1a202c'};
          }
          .supplier-card p {
            font-size: 0.9em;
            margin-bottom: 5px;
            line-height: 1.4;
          }
          .footer { margin-top: 20px; text-align: right; font-size: 12px; }
          @media print {
            body { margin: 0; }
            .grid-container {
              grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
              gap: 15px;
            }
            .supplier-card {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Laporan Supplier (Grid View)</h1>
          <h2>${shopInfo.name || 'Nama Toko'}</h2>
        </div>
        <div class="shop-info">
          <p><strong>Alamat:</strong> ${shopInfo.address || '-'}</p>
          <p><strong>Telepon:</strong> ${shopInfo.phone || '-'}</p>
          <p><strong>Tanggal Cetak:</strong> ${exportDate}</p>
        </div>
        <div class="grid-container">
          ${supplierCardsHtml}
        </div>
        <div class="footer">
          Dicetak pada ${new Date().toLocaleString('id-ID')}
        </div>
        <script>
          setTimeout(() => {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          }, 500);
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (error) {
    console.error('Error saat membuat laporan grid supplier:', error);
    throw error;
  }
};
