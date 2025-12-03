import React, { useEffect } from 'react';

const Receipt = React.forwardRef(({ receiptData, onReadyToPrint }, ref) => {
  useEffect(() => {
    if (receiptData && onReadyToPrint) {
      // Small delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        onReadyToPrint();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [receiptData, onReadyToPrint]);

  if (!receiptData) {
    return null;
  }

  const {
    id,
    invoiceNumber,
    subTotal,
    itemDiscount,
    memberDiscount,
    additionalDiscount,
    grandTotal,
    totalDiscount,
    payment,
    change,
    items,
    cashier,
    attendant,
    date,
    customer,
    paymentMethod,
    referenceNumber,
    status
  } = receiptData;

  // Format currency function for this component
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Store information - ambil dari receiptData jika tersedia, jika tidak gunakan default
  const store = {
    name: receiptData.storeName || 'Toko Sakinah',
    address: receiptData.storeAddress || 'Jl. Raya No. 123, Kota Anda',
    phone: receiptData.storePhone || '0812-3456-7890',
    code: receiptData.storeCode || 'N/A', // Tambahkan storeCode
  };

  return (
    <div ref={ref} className="p-4 bg-white text-black text-xs w-72">
      <div className="text-center">
        <h2 className="text-lg font-bold uppercase">{store.name}</h2>
        <p>Kode Toko: {store.code}</p>
        <p>{store.address}</p>
        <p>{store.phone}</p>
      </div>
      <hr className="my-2 border-black" />
      <div>
        <p>No: {invoiceNumber || id}</p>
        <p>Kasir: {cashier?.name || 'N/A'}</p>
        <p>Pelayan: {attendant?.name || 'N/A'}</p>
        {customer && customer.name && customer.name !== 'Umum' && customer.name !== 'Pelanggan Umum' && (
          <p>Member: {customer.name}</p>
        )}
        <p>Waktu: {new Date(date).toLocaleString('id-ID')}</p>
      </div>
      <hr className="my-2 border-black" />
      <div>
        {items.map((item) => (
          <div key={item.productId || Math.random()} className="flex justify-between">
            <div className="flex-1">
              <div>{item.name}</div>
              <div className="text-xs">{item.quantity} x {formatCurrency(item.originalPrice || 0)}</div>
            </div>
            <div className="text-right">
              {formatCurrency(item.originalPrice * item.quantity || 0)}
            </div>
          </div>
        ))}
      </div>
      <hr className="my-2 border-black" />
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{formatCurrency(subTotal || 0)}</span>
      </div>

      {/* Detail Diskon */}
      {itemDiscount > 0 && (
        <div className="flex justify-between">
          <span>Diskon Item</span>
          <span>-{formatCurrency(itemDiscount || 0)}</span>
        </div>
      )}

      {memberDiscount > 0 && (
        <div className="flex justify-between">
          <span>Diskon Member</span>
          <span>-{formatCurrency(memberDiscount || 0)}</span>
        </div>
      )}

      {additionalDiscount > 0 && (
        <div className="flex justify-between">
          <span>Diskon Tambahan</span>
          <span>-{formatCurrency(additionalDiscount || 0)}</span>
        </div>
      )}

      {totalDiscount > 0 && (
        <div className="flex justify-between font-semibold">
          <span>Total Diskon</span>
          <span>-{formatCurrency(totalDiscount || 0)}</span>
        </div>
      )}

      <div className="flex justify-between font-bold text-sm">
        <span>Total</span>
        <span>{formatCurrency(grandTotal || 0)}</span>
      </div>
      <hr className="my-2 border-black" />
      <div className="flex justify-between">
        <span>Metode Bayar</span>
        <span>{paymentMethod}</span>
      </div>

      {/* Tampilkan nomor referensi jika metode pembayaran bukan tunai */}
      {paymentMethod && paymentMethod !== 'CASH' && referenceNumber && (
        <div className="flex justify-between">
          <span>No. Ref:</span>
          <span>{referenceNumber}</span>
        </div>
      )}

      <div className="flex justify-between">
        <span>Bayar</span>
        <span>{formatCurrency(payment || 0)}</span>
      </div>
      <div className="flex justify-between">
        <span>Kembali</span>
        <span>{formatCurrency(change || 0)}</span>
      </div>
      <hr className="my-2 border-black" />
      <div className="text-center mt-2">
        <p>Terima kasih telah berbelanja!</p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';

export default Receipt;