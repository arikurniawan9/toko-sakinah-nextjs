'use client';

import React, { forwardRef } from 'react';
import { useUserTheme } from '../UserThemeContext';

const DistributionReceipt = forwardRef(({ distributionData }, ref) => {
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;

  if (!distributionData) {
    return null;
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
  const items = distributionData.items || [];
  // If no items array but we have a single record, create an array with just that record
  const allItems = items.length > 0 ? items : [distributionData];

  return (
    <div
      ref={ref}
      className={`max-w-2xl mx-auto p-6 ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} print:bg-white print:text-black print:p-8`}
      style={{
        fontFamily: 'monospace',
        maxWidth: '80mm',
        margin: '0 auto',
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact'
      }}
    >
      {/* Header */}
      <div className="text-center mb-4 print:mb-4">
        <h1 className="text-lg font-bold print:text-lg">STRUK DISTRIBUSI PRODUK</h1>
        <p className="text-xs print:text-xs">Toko SAKINAH</p>
        <p className="text-xs print:text-xs">Jl. Raya No. 123, Kota Anda</p>
        <p className="text-xs print:text-xs">Telp: 0812-3456-7890</p>
      </div>

      {/* Distribution Info */}
      <div className="mb-4 print:mb-4 border-t border-b border-gray-300 pt-2 pb-2 print:border-t print:border-b print:border-black">
        <div className="grid grid-cols-2 gap-1 text-sm print:text-sm">
          <div>No. Distribusi</div>
          <div className="text-right">{distributionData.id}</div>
        </div>
        <div className="grid grid-cols-2 gap-1 text-sm print:text-sm">
          <div>Tanggal</div>
          <div className="text-right">{formatDate(distributionData.distributedAt || distributionData.createdAt)}</div>
        </div>
        <div className="grid grid-cols-2 gap-1 text-sm print:text-sm">
          <div>Gudang</div>
          <div className="text-right">{distributionData.warehouse?.name || 'Gudang Pusat'}</div>
        </div>
        <div className="grid grid-cols-2 gap-1 text-sm print:text-sm">
          <div>Toko Tujuan</div>
          <div className="text-right">{distributionData.store?.name || distributionData.storeName}</div>
        </div>
        <div className="grid grid-cols-2 gap-1 text-sm print:text-sm">
          <div>Pelayan Gudang</div>
          <div className="text-right">
            {distributionData.distributedByUser?.name || distributionData.distributedByName || 'N/A'}
            {distributionData.distributedByUser?.code && ` (${distributionData.distributedByUser.code})`}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1 text-sm print:text-sm">
          <div>Status</div>
          <div className="text-right">
            {distributionData.status === 'PENDING_ACCEPTANCE' ? 'Menunggu Konfirmasi' :
             distributionData.status === 'ACCEPTED' ? 'Diterima' :
             distributionData.status === 'REJECTED' ? 'Ditolak' : distributionData.status}
          </div>
        </div>
      </div>

      {/* Items - If we can't get items as an array from the distribution, we'll try to handle the single item case */}
      <div className="mb-4 print:mb-4">
        <h2 className="font-bold text-sm print:text-sm mb-2">DAFTAR PRODUK</h2>
        <div className="space-y-1">
          {allItems.map((item, index) => {
            const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
            return (
              <div key={index} className="flex justify-between text-xs print:text-xs">
                <div className="flex-1">
                  <div>{item.product?.name || item.productName || item.name || 'Produk Tidak Dikenal'}</div>
                  <div className="text-gray-500 dark:text-gray-400 print:text-gray-600">
                    {item.product?.productCode || item.productCode || 'N/A'}
                  </div>
                </div>
                <div className="text-right">
                  <div>{item.quantity?.toLocaleString('id-ID')} x Rp {(item.unitPrice || 0).toLocaleString('id-ID')}</div>
                  <div className="font-bold">Rp {itemTotal.toLocaleString('id-ID')}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Total - Calculate based on available data */}
      <div className="border-t border-gray-300 pt-2 print:border-t print:border-black">
        <div className="flex justify-between font-bold">
          <span>Total Barang:</span>
          <span>
            {allItems.reduce((sum, item) => sum + (item.quantity || 0), 0).toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex justify-between font-bold text-lg print:text-lg">
          <span>Total Harga:</span>
          <span>
            Rp {allItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0).toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Notes */}
      {distributionData.notes && (
        <div className="mt-4 pt-2 border-t border-gray-300 print:mt-4 print:pt-2 print:border-t print:border-black">
          <div className="text-xs print:text-xs">
            <strong>Catatan:</strong> {distributionData.notes}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-xs print:mt-6 print:text-xs">
        <p>Terima kasih atas kepercayaan Anda</p>
        <p className="mt-2">Dicetak: {formatDate(new Date().toISOString())}</p>
      </div>
    </div>
  );
});

DistributionReceipt.displayName = 'DistributionReceipt';

export default DistributionReceipt;