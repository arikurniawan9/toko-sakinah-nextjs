// utils/thermalPrint.js
export const printThermalReceipt = async (receiptData) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Format currency function
      const formatCurrencyForPrint = (amount) => {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount).replace('Rp', 'Rp. ');
      };

      // Limit text function
      const limitTextForPrint = (text, maxLength) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
      };

      // Gunakan informasi toko dari receiptData jika tersedia, jika tidak ambil dari API
      let storeInfo = {
        name: receiptData.storeName || 'TOKO SAKINAH',
        address: receiptData.storeAddress || 'Jl. Raya No. 123, Kota Anda',
        phone: receiptData.storePhone || '0812-3456-7890',
      };

      // Jika informasi toko belum tersedia dari receiptData, ambil dari API
      if (!receiptData.storeName || !receiptData.storeAddress || !receiptData.storePhone) {
        try {
          const response = await fetch('/api/stores/current');
          if (response.ok) {
            const data = await response.json();
            storeInfo = {
              name: data.name || process.env.NEXT_PUBLIC_SHOP_NAME || 'TOKO SAKINAH',
              address: data.address || process.env.NEXT_PUBLIC_SHOP_ADDRESS || 'Jl. Raya No. 123, Kota Anda',
              phone: data.phone || process.env.NEXT_PUBLIC_SHOP_PHONE || '0812-3456-7890',
            };
          } else {
            // Coba endpoint lama sebagai fallback
            const settingResponse = await fetch('/api/setting');
            if (settingResponse.ok) {
              const settingData = await settingResponse.json();
              storeInfo = {
                name: settingData.shopName || process.env.NEXT_PUBLIC_SHOP_NAME || 'TOKO SAKINAH',
                address: settingData.address || process.env.NEXT_PUBLIC_SHOP_ADDRESS || 'Jl. Raya No. 123, Kota Anda',
                phone: settingData.phone || process.env.NEXT_PUBLIC_SHOP_PHONE || '0812-3456-7890',
              };
            }
          }
        } catch (error) {
          console.error('Error fetching store info for receipt:', error);
          // Gunakan environment variables atau default jika API gagal
          storeInfo = {
            name: process.env.NEXT_PUBLIC_SHOP_NAME || 'TOKO SAKINAH',
            address: process.env.NEXT_PUBLIC_SHOP_ADDRESS || 'Jl. Raya No. 123, Kota Anda',
            phone: process.env.NEXT_PUBLIC_SHOP_PHONE || '0812-3456-7890',
          };
        }
      }

      // Buat jendela baru untuk cetak thermal
      const printWindow = window.open('', '_blank', 'width=300,height=600');

      // HTML untuk thermal receipt dengan ukuran kertas 72mm
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Struk Transaksi - ${receiptData.id}</title>
          <style>
            @media print {
              @page {
                size: 72mm auto;
                margin: 2mm;
              }
              body {
                margin: 0;
                padding: 2mm;
                font-family: monospace;
                font-size: 12px;
                line-height: 1.1;
              }
            }
            body {
              font-family: monospace;
              font-size: 12px;
              line-height: 1.1;
              width: 72mm;
              margin: 0 auto;
              padding: 2mm;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-xs { font-size: 10px; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .my-1 { margin: 4px 0; }
            .my-2 { margin: 8px 0; }
            .pt-1 { padding-top: 2px; }
            .border-t { border-top: 1px solid black; }
            .border-b { border-bottom: 1px solid black; }
            .py-1 { padding: 2px 0; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-center { align-items: center; }
            .w-full { width: 100%; }
            .w-16 { width: 60px; }
            .w-24 { width: 80px; }
            .italic { font-style: italic; }
            .uppercase { text-transform: uppercase; }
            hr { border: 0; border-top: 1px solid black; margin: 4px 0; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h2 class="text-lg font-bold uppercase">${storeInfo.name}</h2>
            <p class="text-xs">${storeInfo.address}</p>
            <p class="text-xs">${storeInfo.phone}</p>
          </div>

          <div class="my-2 border-t border-b py-1">
            <div class="flex justify-between text-xs">
              <span>No. Invoice: ${receiptData.invoiceNumber}</span>
              <span>${new Date(receiptData.date).toLocaleString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span>Kasir: ${limitTextForPrint(receiptData.cashier?.name || 'N/A', 10)}</span>
              <span>Pelayan: ${limitTextForPrint(receiptData.attendant?.name || 'N/A', 10)}</span>
            </div>
            ${receiptData.customer && receiptData.customer.name && receiptData.customer.name !== 'Umum' && receiptData.customer.name !== 'Pelanggan Umum' ? `
              <div class="text-xs mt-1">
                <span>Member: ${limitTextForPrint(receiptData.customer.name, 15)}</span>
              </div>
            ` : ''}
          </div>

          <div class="my-2">
            ${receiptData.items.map(item => `
              <div class="text-xs mb-1">
                <div class="flex justify-between">
                  <span class="flex-1">${item.name || ''}</span>
                  <span class="w-16 text-right">${item.quantity}x</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-right">@${formatCurrencyForPrint(item.originalPrice || 0)}</span>
                  <span class="w-16 text-right">${formatCurrencyForPrint(item.originalPrice * item.quantity || 0)}</span>
                </div>
                ${item.originalPrice !== item.priceAfterItemDiscount ?
                  `<div class="flex justify-between text-right text-xs italic">
                    <span></span>
                    <span class="text-right">Pot:${formatCurrencyForPrint(item.originalPrice - item.priceAfterItemDiscount)}</span>
                  </div>` : ''}
              </div>
            `).join('')}
          </div>

          <div class="my-2 border-t pt-1">
            <div class="flex justify-between text-sm font-semibold">
              <span>Subtotal</span>
              <span>${formatCurrencyForPrint(receiptData.subTotal || 0)}</span>
            </div>

            <!-- Detail Diskon -->
            ${receiptData.itemDiscount > 0 ? `
              <div class="flex justify-between text-sm">
                <span>Diskon Item</span>
                <span>-${formatCurrencyForPrint(receiptData.itemDiscount || 0)}</span>
              </div>
            ` : ''}
            ${receiptData.memberDiscount > 0 ? `
              <div class="flex justify-between text-sm">
                <span>Diskon Member</span>
                <span>-${formatCurrencyForPrint(receiptData.memberDiscount || 0)}</span>
              </div>
            ` : ''}
            ${receiptData.additionalDiscount > 0 ? `
              <div class="flex justify-between text-sm">
                <span>Diskon Tambahan</span>
                <span>-${formatCurrencyForPrint(receiptData.additionalDiscount || 0)}</span>
              </div>
            ` : ''}
            ${receiptData.totalDiscount > 0 ? `
              <div class="flex justify-between text-sm border-t border-black pt-1">
                <span>Total Diskon</span>
                <span>-${formatCurrencyForPrint(receiptData.totalDiscount || 0)}</span>
              </div>
            ` : ''}
            <div class="flex justify-between text-sm font-bold border-t border-black py-1">
              <span>Total</span>
              <span>${formatCurrencyForPrint(receiptData.grandTotal || 0)}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span>Bayar</span>
              <span>${formatCurrencyForPrint(receiptData.payment || 0)}</span>
            </div>
            <!-- Tampilkan status pembayaran -->
            <div class="flex justify-between text-sm font-bold">
              ${receiptData.status === 'UNPAID' ? '<span class="text-red-500">Status: HUTANG</span>' :
                receiptData.status === 'PARTIALLY_PAID' ? '<span class="text-yellow-500">Status: DP</span>' :
                '<span class="text-green-500">Status: LUNAS</span>'}
              <span></span>
            </div>

            <!-- Tampilkan sisa hutang jika statusnya hutang -->
            ${receiptData.payment < receiptData.grandTotal && receiptData.grandTotal > 0 ? `
              <div class="flex justify-between text-sm">
                <span>Sisa Hutang</span>
                <span>${formatCurrencyForPrint(Math.max(0, receiptData.grandTotal - receiptData.payment))}</span>
              </div>
            ` : ''}
            <div class="flex justify-between text-sm">
              <span>Kembali</span>
              <span>${formatCurrencyForPrint(receiptData.change || 0)}</span>
            </div>
          </div>

          <div class="my-2 border-t pt-1">
            <div class="text-xs text-center">
              <div class="mb-1">Metode: ${receiptData.paymentMethod || 'CASH'}</div>
              <!-- Tampilkan nomor referensi jika metode pembayaran bukan tunai -->
              ${receiptData.paymentMethod && receiptData.paymentMethod !== 'CASH' && receiptData.referenceNumber ? `
                <div class="mb-1">No. Ref: ${limitTextForPrint(receiptData.referenceNumber, 20)}</div>
              ` : ''}
              <!-- Tampilkan nomor referensi pembayaran hutang jika ada -->
              ${receiptData.receivableReferenceNumber ?
                receiptData.receivableReferenceNumber.split(',').map((ref, index) =>
                  '<div class="mb-1">No. Ref Hutang: ' + limitTextForPrint(ref.trim(), 20) + '</div>'
                ).join('') : ''}
              <div>Terima kasih telah berbelanja!</div>
              <div class="text-xs mt-1">Barang yg sdh dibeli</div>
              <div class="text-xs">tidak dpt ditukar/dikembalikan</div>
            </div>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(receiptHTML);
      printWindow.document.close();

      // Tunggu sampai dokumen selesai dimuat
      printWindow.onload = () => {
        // Fokus ke jendela cetak
        printWindow.focus();

        // Setelah jendela selesai dimuat, cetak
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
          resolve(true);
        }, 500); // Delay kecil untuk memastikan dokumen siap dicetak
      };

      // Tangani error
      printWindow.onerror = (error) => {
        reject(error);
      };

    } catch (error) {
      reject(error);
    }
  });
};