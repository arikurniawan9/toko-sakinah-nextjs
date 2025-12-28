'use client';

import React, { forwardRef } from 'react';
import { useUserTheme } from '../UserThemeContext';

const DistributionInvoice = forwardRef(({ distributionData }, ref) => {
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
          minHeight: '297mm', // A4 height
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

  // If distributionData.items is available (from API with all items), use it.
  // Otherwise, we have a single record that needs to be treated as one item.
  // Handle both individual distribution records and grouped distribution records
  // For individual records, we might have just one item with all the details
  // For grouped records, we have an items array
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
      <div className="text-center mb-8 print:mb-8">
        <h1 className="text-2xl font-bold print:text-2xl mb-2">FAKTUR DISTRIBUSI PRODUK</h1>
        <div className="border-b-2 border-gray-800 dark:border-gray-300 print:border-b-2 print:border-black mb-4"></div>
        <div className="grid grid-cols-2 gap-8">
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

      {/* Invoice Info */}
      <div className="mb-6 print:mb-6">
        <div className="flex flex-wrap justify-between items-start gap-x-8 gap-y-2">
          <div className="flex-grow min-w-[30%]">
            <p><strong>No. Faktur:</strong> {distributionData?.invoiceNumber || 'N/A'}</p>
          </div>
          <div className="flex-grow min-w-[30%]">
            <p><strong>Tanggal:</strong> {distributionData?.distributedAt || distributionData?.createdAt ? formatDate(distributionData.distributedAt || distributionData.createdAt) : 'N/A'}</p>
          </div>
          <div className="flex-grow min-w-[30%]">
            <p><strong>Pelayan:</strong> {distributionData?.distributedByUser?.name || distributionData?.distributedByName || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8 print:mb-8">
        <h2 className="text-lg font-semibold print:text-lg mb-4">DAFTAR PRODUK YANG DIKIRIM</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-400 dark:border-gray-600 print:border-collapse print:border border-black">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 print:bg-gray-200">
                <th className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-4 py-2 text-left">No</th>
                <th className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-4 py-2 text-left">Kode Produk</th>
                <th className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-4 py-2 text-left">Nama Produk</th>
                <th className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-4 py-2 text-right">Jumlah</th>
                <th className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-4 py-2 text-right">Harga Satuan</th>
                <th className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {allItems && allItems.length > 0 ? allItems.map((item, index) => {
                const itemTotal = (item?.quantity || 0) * (item?.unitPrice || 0);
                return (
                  <tr key={index}>
                    <td className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-4 py-2">{index + 1}</td>
                    <td className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-4 py-2">{item?.product?.productCode || item?.productCode || 'N/A'}</td>
                    <td className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-4 py-2">{item?.product?.name || item?.productName || item?.name || 'Produk Tidak Dikenal'}</td>
                    <td className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-4 py-2 text-right">{(item?.quantity || 0).toLocaleString('id-ID')}</td>
                    <td className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-4 py-2 text-right">Rp {(item?.unitPrice || 0).toLocaleString('id-ID')}</td>
                    <td className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-4 py-2 text-right">Rp {itemTotal.toLocaleString('id-ID')}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="border border-gray-300 dark:border-gray-600 print:border print:border-black px-4 py-2 text-center">Tidak ada item dalam distribusi ini</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-8 print:mb-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold mb-2">Catatan:</h3>
            <div className="border border-gray-300 dark:border-gray-600 print:border print:border-black p-4 min-h-[80px]">
              {distributionData?.notes || '-'}
            </div>
          </div>
          <div>
            <div className="space-y-2">
              <div className="flex justify-between border-b border-gray-300 dark:border-gray-600 print:border-b print:border-black pb-1">
                <span>Total Barang:</span>
                <span>{allItems && allItems.length > 0 ? allItems.reduce((sum, item) => sum + (item?.quantity || 0), 0).toLocaleString('id-ID') : '0'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-300 dark:border-gray-600 print:border-b print:border-black pb-1">
                <span>Jumlah Item:</span>
                <span>{allItems && allItems.length > 0 ? allItems.length : '0'}</span>
              </div>
              <div className="flex justify-between font-bold text-lg print:text-lg pt-2">
                <span>Total Harga:</span>
                <span>Rp {allItems && allItems.length > 0 ? allItems.reduce((sum, item) => sum + ((item?.quantity || 0) * (item?.unitPrice || 0)), 0).toLocaleString('id-ID') : '0'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-12 print:mt-12">
        <div className="grid grid-cols-3 gap-8">
          <div className="text-center">
            <p className="mb-12">Pelayan</p>
            <div className="border-t border-gray-800 dark:border-gray-300 print:border-t print:border-black pt-1">
              {distributionData?.distributedByUser?.name || distributionData?.distributedByName || 'N/A'}
            </div>
          </div>
          <div className="text-center">
            <p className="mb-12">Penerima</p>
            <div className="border-t border-gray-800 dark:border-gray-300 print:border-t print:border-black pt-1">
              _________________
            </div>
          </div>
          <div className="text-center">
            <p className="mb-12">Mengetahui</p>
            <div className="border-t border-gray-800 dark:border-gray-300 print:border-t print:border-black pt-1">
              _________________
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm print:mt-8 print:text-sm">
        <p>Terima kasih atas kerjasama yang baik</p>
        <p className="mt-2">Dicetak: {formatDate(new Date().toISOString())}</p>
        <p className="mt-4 text-xs print:text-xs">Faktur ini merupakan bukti pengiriman barang yang sah</p>
      </div>
    </div>
  );
});

DistributionInvoice.displayName = 'DistributionInvoice';

export default DistributionInvoice;