'use client';

import React, { forwardRef } from 'react';
import { useUserTheme } from '../UserThemeContext';

const ITEMS_PER_PAGE = 15; // Jumlah item maksimum per halaman

const DistributionInvoice = forwardRef(({ distributionData, isModalPreview = false }, ref) => {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  if (!distributionData) {
    return (
      <div
        ref={ref}
        className={`max-w-4xl mx-auto p-8 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} print:bg-white print:text-black print-content`}
        style={{
          fontFamily: 'Arial, sans-serif',
          maxWidth: '210mm', // A4 width
          // minHeight: '297mm', // Removed for scrollable preview
          margin: '0 auto',
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact'
        }}
      >
        <div className="text-center">
          <p>Data distribusi tidak tersedia</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle both individual distribution records and grouped distribution records
  let allItems = [];

  if (distributionData.items && Array.isArray(distributionData.items) && distributionData.items.length > 0) {
    // This is a grouped distribution with multiple items
    allItems = distributionData.items;
  } else if (distributionData.items && Array.isArray(distributionData.items) && distributionData.items.length === 0) {
    // This is a grouped distribution but with no items (edge case)
    allItems = [];
  } else {
    // This is an individual distribution record, treat the record itself as an item
    allItems = [distributionData];
  }

  // Calculate number of pages needed
  const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);

  // If it's a modal preview or only one page is needed, render as a single page
  if (isModalPreview || totalPages === 1) {
    const pageItems = allItems;
    const totalItems = pageItems.reduce((sum, item) => sum + (item?.quantity || 0), 0);
    const totalAmount = pageItems.reduce((sum, item) => sum + ((item?.quantity || 0) * (item?.unitPrice || 0)), 0);

    return (
      <div
        ref={ref}
        className={`max-w-4xl mx-auto p-8 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} print:bg-white print:text-black print-content`}
        style={{
          fontFamily: 'Arial, sans-serif',
          maxWidth: '210mm', // A4 width
          minHeight: '297mm', // A4 height
          margin: '0 auto',
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact'
        }}
      >
        {/* Header */}
        <div className="text-center mb-4 print:mb-4">
          <h1 className="text-xl font-bold print:text-xl mb-1">FAKTUR DISTRIBUSI PRODUK</h1>
          <div className="border-b-2 border-gray-800 dark:border-gray-300 print:border-b-2 print:border-black mb-2"></div>
          <div className="grid grid-cols-2 gap-4 text-base">
            <div className="text-left">
              <h2 className="text-base font-semibold print:text-base mb-1">PENGIRIM</h2>
              <p className="font-bold">TOKO SAKINAH - GUDANG PUSAT</p>
              <p>Jl. Raya No. 123, Kota Anda</p>
              <p>Telp: 0812-3456-7890</p>
            </div>
            <div className="text-left">
              <h2 className="text-base font-semibold print:text-base mb-1">PENERIMA</h2>
              <p className="font-bold">{distributionData?.store?.name || distributionData?.storeName || 'N/A'}</p>
              <p>Kode Toko: {distributionData?.store?.code || 'N/A'}</p>
              <p>{distributionData?.store?.address || 'Alamat tidak tersedia'}</p>
              <p>Telp: {distributionData?.store?.phone || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="mb-4 print:mb-4">
          <div className="flex flex-wrap justify-between items-start gap-x-4 gap-y-1 text-base">
            <div className="flex-grow min-w-[25%]">
              <p><strong>No. Faktur:</strong> {distributionData?.invoiceNumber || 'N/A'}</p>
            </div>
            <div className="flex-grow min-w-[25%]">
              <p><strong>Tanggal:</strong> {distributionData?.distributedAt || distributionData?.createdAt ? formatDate(distributionData.distributedAt || distributionData.createdAt) : 'N/A'}</p>
            </div>
            <div className="flex-grow min-w-[25%]">
              <p><strong>Pelayan:</strong> {distributionData?.distributedByUser?.name || distributionData?.distributedByName || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6 print:mb-6">
          <h2 className="text-lg font-semibold print:text-lg mb-2">DAFTAR PRODUK YANG DIKIRIM</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-400 dark:border-gray-600 print:border-collapse print:border border-black">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 print:bg-gray-200">
                  <th className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-2 text-left text-base">No</th>
                  <th className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-2 text-left text-base">Kode Produk</th>
                  <th className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-2 text-left text-base">Nama Produk</th>
                  <th className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-2 text-right text-base">Jumlah</th>
                  <th className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-2 text-right text-base">Harga Satuan</th>
                  <th className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-2 text-right text-base">Total</th>
                </tr>
              </thead>
              <tbody>
                {pageItems && pageItems.length > 0 ? pageItems.map((item, index) => {
                  const itemTotal = (item?.quantity || 0) * (item?.unitPrice || 0);
                  return (
                    <tr key={index}>
                      <td className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-1 text-base">{index + 1}</td>
                      <td className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-1 text-base">{item?.product?.productCode || item?.productCode || 'N/A'}</td>
                      <td className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-1 text-base">{item?.product?.name || item?.productName || item?.name || 'Produk Tidak Dikenal'}</td>
                      <td className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-1 text-base text-right">{(item?.quantity || 0).toLocaleString('id-ID')}</td>
                      <td className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-1 text-base text-right">Rp {(item?.unitPrice || 0).toLocaleString('id-ID')}</td>
                      <td className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-1 text-base text-right">Rp {itemTotal.toLocaleString('id-ID')}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="6" className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-1 text-center text-base">Tidak ada item dalam distribusi ini</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 print:mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-base mb-1">Catatan:</h3>
              <div className="border border-gray-300 dark:border-gray-600 print:border print:border-black p-2 min-h-[60px] text-base">
                {distributionData?.notes || '-'}
              </div>
            </div>
            <div>
              <div className="space-y-1">
                <div className="flex justify-between border-b border-gray-300 dark:border-gray-600 print:border-b print:border-black pb-1 text-base">
                  <span>Total Barang:</span>
                  <span>{totalItems.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 dark:border-gray-600 print:border-b print:border-black pb-1 text-base">
                  <span>Jumlah Item:</span>
                  <span>{pageItems.length}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 text-base">
                  <span>Total Harga:</span>
                  <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-8 print:mt-8">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center text-base">
              <p className="mb-8">Pelayan</p>
              <div className="border-t border-gray-800 dark:border-gray-300 print:border-t print:border-black pt-1">
                {distributionData?.distributedByUser?.name || distributionData?.distributedByName || 'N/A'}
              </div>
            </div>
            <div className="text-center text-base">
              <p className="mb-8">Penerima</p>
              <div className="border-t border-gray-800 dark:border-gray-300 print:border-t print:border-black pt-1">
                _________________
              </div>
            </div>
            <div className="text-center text-base">
              <p className="mb-8">Mengetahui</p>
              <div className="border-t border-gray-800 dark:border-gray-300 print:border-t print:border-black pt-1">
                _________________
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-base print:mt-4 print:text-base">
          <p>Terima kasih atas kerjasama yang baik</p>
          <p className="mt-1">Dicetak: {formatDate(new Date().toISOString())}</p>
          <p className="mt-2 text-sm print:text-sm">Faktur ini merupakan bukti pengiriman barang yang sah</p>
        </div>
      </div>
    );
  } else {
    // Multi-page version
    const pages = [];
    
    // Hitung total keseluruhan hanya sekali
    const totalItems = allItems.reduce((sum, item) => sum + (item?.quantity || 0), 0);
    const totalAmount = allItems.reduce((sum, item) => sum + ((item?.quantity || 0) * (item?.unitPrice || 0)), 0);

    for (let page = 0; page < totalPages; page++) {
      const pageItems = allItems.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
      const pageTotalItems = pageItems.reduce((sum, item) => sum + (item?.quantity || 0), 0);
      const pageTotalAmount = pageItems.reduce((sum, item) => sum + ((item?.quantity || 0) * (item?.unitPrice || 0)), 0);

      pages.push(
        <div
          key={page}
          ref={page === 0 ? ref : null} // Only add ref to first page
          className={`max-w-4xl mx-auto p-8 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} print:bg-white print:text-black print-content`}
          style={{
            fontFamily: 'Arial, sans-serif',
            maxWidth: '210mm', // A4 width
            minHeight: '297mm', // A4 height
            margin: '0 auto',
            printColorAdjust: 'exact',
            WebkitPrintColorAdjust: 'exact',
            pageBreakAfter: page < totalPages - 1 ? 'always' : 'auto', // Add page break except for last page
          }}
        >
          {/* Header only on first page */}
          {page === 0 && (
            <div className="text-center mb-4 print:mb-4">
              <h1 className="text-2xl font-bold print:text-2xl mb-2">FAKTUR DISTRIBUSI PRODUK</h1>
              <div className="border-b-2 border-gray-800 dark:border-gray-300 print:border-b-2 print:border-black mb-4"></div>
              <div className="grid grid-cols-2 gap-8 text-sm">
                <div className="text-left">
                  <h2 className="text-lg font-semibold print:text-lg mb-2">PENGIRIM</h2>
                  <p className="font-bold">TOKO SAKINAH - GUDANG PUSAT</p>
                  <p>Jl. Raya No. 123, Kota Anda</p>
                  <p>Telp: 0812-3456-7890</p>
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-semibold print:text-lg mb-2">PENERIMA</h2>
                  <p className="font-bold">{distributionData?.store?.name || distributionData?.storeName || 'N/A'}</p>
                  <p>Kode Toko: {distributionData?.store?.code || 'N/A'}</p>
                  <p>{distributionData?.store?.address || 'Alamat tidak tersedia'}</p>
                  <p>Telp: {distributionData?.store?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Info - show full info on first page, only page info on other pages */}
          {page === 0 ? (
            <div className="mb-4 print:mb-4">
              <div className="flex flex-wrap justify-between items-start gap-x-4 gap-y-1 text-sm">
                <div className="flex-grow min-w-[20%]">
                  <p><strong>No. Faktur:</strong> {distributionData?.invoiceNumber || 'N/A'}</p>
                </div>
                <div className="flex-grow min-w-[20%]">
                  <p><strong>Tanggal:</strong> {distributionData?.distributedAt || distributionData?.createdAt ? formatDate(distributionData.distributedAt || distributionData.createdAt) : 'N/A'}</p>
                </div>
                <div className="flex-grow min-w-[20%]">
                  <p><strong>Pelayan:</strong> {distributionData?.distributedByUser?.name || distributionData?.distributedByName || 'N/A'}</p>
                </div>
                <div className="flex-grow min-w-[20%]">
                  <p><strong>Halaman:</strong> {page + 1} dari {totalPages}</p>
                </div>
              </div>
            </div>
          ) : (
            // For other pages, only show page info
            <div className="mb-4 print:mb-4">
              <div className="flex justify-end text-sm">
                <p><strong>Halaman:</strong> {page + 1} dari {totalPages}</p>
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="mb-6 print:mb-6">
            <h2 className="text-lg font-semibold print:text-lg mb-2">DAFTAR PRODUK YANG DIKIRIM - Halaman {page + 1}</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-400 dark:border-gray-600 print:border-collapse print:border border-black">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 print:bg-gray-200">
                    <th className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-2 text-left text-sm">No</th>
                    <th className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-2 text-left text-sm">Kode Produk</th>
                    <th className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-2 text-left text-sm">Nama Produk</th>
                    <th className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-2 text-right text-sm">Jumlah</th>
                    <th className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-2 text-right text-sm">Harga Satuan</th>
                    <th className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-2 text-right text-sm">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems && pageItems.length > 0 ? pageItems.map((item, index) => {
                    const itemTotal = (item?.quantity || 0) * (item?.unitPrice || 0);
                    const globalIndex = page * ITEMS_PER_PAGE + index;
                    return (
                      <tr key={globalIndex}>
                        <td className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-1 text-sm">{globalIndex + 1}</td>
                        <td className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-1 text-sm">{item?.product?.productCode || item?.productCode || 'N/A'}</td>
                        <td className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-1 text-sm">{item?.product?.name || item?.productName || item?.name || 'Produk Tidak Dikenal'}</td>
                        <td className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-1 text-sm text-right">{(item?.quantity || 0).toLocaleString('id-ID')}</td>
                        <td className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-1 text-sm text-right">Rp {(item?.unitPrice || 0).toLocaleString('id-ID')}</td>
                        <td className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-1 text-sm text-right">Rp {itemTotal.toLocaleString('id-ID')}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="6" className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-2 py-1 text-center text-sm">Tidak ada item dalam distribusi ini</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary for this page */}
          <div className="mb-6 print:mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm mb-1">Catatan:</h3>
                <div className="border border-gray-300 dark:border-gray-600 print:border print:border-black p-2 min-h-[60px] text-sm">
                  {page === 0 ? (distributionData?.notes || '-') : '-'}
                </div>
              </div>
              <div>
                <div className="space-y-1">
                  <div className="flex justify-between border-b border-gray-300 dark:border-gray-600 print:border-b print:border-black pb-1 text-sm">
                    <span>Total Barang (Hal. {page + 1}):</span>
                    <span>{pageTotalItems.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-300 dark:border-gray-600 print:border-b print:border-black pb-1 text-sm">
                    <span>Jumlah Item (Hal. {page + 1}):</span>
                    <span>{pageItems.length}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 text-sm">
                    <span>Total Harga (Hal. {page + 1}):</span>
                    <span>Rp {pageTotalAmount.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Total keseluruhan hanya ditampilkan di halaman terakhir */}
                  {page === totalPages - 1 && (
                    <>
                      <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 print:border-t print:border-black pt-1 mt-1 text-sm">
                        <span><strong>Total Barang (Keseluruhan):</strong></span>
                        <span><strong>{totalItems.toLocaleString('id-ID')}</strong></span>
                      </div>
                      <div className="flex justify-between border-b border-gray-300 dark:border-gray-600 print:border-b print:border-black pb-1 text-sm">
                        <span><strong>Jumlah Item (Keseluruhan):</strong></span>
                        <span><strong>{allItems.length}</strong></span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 text-base">
                        <span><strong>Total Harga (Keseluruhan):</strong></span>
                        <span><strong>Rp {totalAmount.toLocaleString('id-ID')}</strong></span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer for each page */}
          <div className="mt-auto">
            {/* Signatures only on the last page */}
            {page === totalPages - 1 && (
              <div className="mt-8 print:mt-8">
                <div className="grid grid-cols-3 gap-8">
                  <div className="text-center text-sm">
                    <p className="mb-8">Pelayan</p>
                    <div className="border-t border-gray-800 dark:border-gray-300 print:border-t print:border-black pt-1">
                      {distributionData?.distributedByUser?.name || distributionData?.distributedByName || 'N/A'}
                    </div>
                  </div>
                  <div className="text-center text-sm">
                    <p className="mb-8">Penerima</p>
                    <div className="border-t border-gray-800 dark:border-gray-300 print:border-t print:border-black pt-1">
                      _________________
                    </div>
                  </div>
                  <div className="text-center text-sm">
                    <p className="mb-8">Mengetahui</p>
                    <div className="border-t border-gray-800 dark:border-gray-300 print:border-t print:border-black pt-1">
                      _________________
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Page number for all pages */}
            <div className="mt-4 text-center text-sm print:mt-4 print:text-sm">
              <p>Halaman {page + 1} dari {totalPages}</p>
              {page === totalPages - 1 && (
                <>
                  <p className="mt-2">Terima kasih atas kerjasama yang baik</p>
                  <p className="mt-1">Dicetak: {formatDate(new Date().toISOString())}</p>
                  <p className="mt-2 text-xs print:text-xs">Faktur ini merupakan bukti pengiriman barang yang sah</p>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    return <div className="multi-page-invoice">{pages}</div>;
  }
});

DistributionInvoice.displayName = 'DistributionInvoice';

export default DistributionInvoice;
