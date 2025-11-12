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
    total,
    paymentMethod,
    amountPaid,
    change,
    items,
    cashier,
    transactionTime,
    customer,
  } = receiptData;

  const store = {
    name: 'Toko Sakinah',
    address: 'Jl. Raya No. 123, Kota Anda',
    phone: '0812-3456-7890',
  };

  return (
    <div ref={ref} className="p-4 bg-white text-black text-xs w-72">
      <div className="text-center">
        <h2 className="text-lg font-bold">{store.name}</h2>
        <p>{store.address}</p>
        <p>{store.phone}</p>
      </div>
      <hr className="my-2 border-black" />
      <div>
        <p>No: {id}</p>
        <p>Kasir: {cashier?.name || 'N/A'}</p>
        <p>Pelanggan: {customer?.name || 'Umum'}</p>
        <p>Waktu: {new Date(transactionTime).toLocaleString('id-ID')}</p>
      </div>
      <hr className="my-2 border-black" />
      <div>
        {items.map((item) => (
          <div key={item.id || Math.random()} className="flex justify-between">
            <span>{item.name}</span>
            <span>{item.quantity} x {(item.price || 0).toLocaleString('id-ID')}</span>
            <span>{(item.quantity * (item.price || 0)).toLocaleString('id-ID')}</span>
          </div>
        ))}
      </div>
      <hr className="my-2 border-black" />
      <div className="flex justify-between font-semibold">
        <span>Subtotal</span>
        <span>{(total || 0).toLocaleString('id-ID')}</span>
      </div>
      {receiptData.discount > 0 && (
        <div className="flex justify-between font-semibold">
          <span>Diskon</span>
          <span>-{(receiptData.discount || 0).toLocaleString('id-ID')}</span>
        </div>
      )}
      <div className="flex justify-between font-bold text-sm">
        <span>Total</span>
        <span>{(total || 0).toLocaleString('id-ID')}</span>
      </div>
      <hr className="my-2 border-black" />
      <div className="flex justify-between">
        <span>Metode Bayar</span>
        <span>{paymentMethod}</span>
      </div>
      <div className="flex justify-between">
        <span>Bayar</span>
        <span>{(amountPaid || 0).toLocaleString('id-ID')}</span>
      </div>
      <div className="flex justify-between">
        <span>Kembali</span>
        <span>{(change || 0).toLocaleString('id-ID')}</span>
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