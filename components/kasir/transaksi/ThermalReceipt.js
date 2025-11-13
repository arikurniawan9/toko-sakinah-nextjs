import React, { useEffect, useState } from 'react';

const ThermalReceipt = ({ receiptData, darkMode }) => {
  const [storeInfo, setStoreInfo] = useState({
    name: 'TOKO SAKINAH',
    address: 'Jl. Raya No. 123, Kota Anda',
    phone: '0812-3456-7890',
  });

  useEffect(() => {
    // Ambil data toko dari API
    const fetchStoreInfo = async () => {
      try {
        const response = await fetch('/api/setting');
        if (response.ok) {
          const data = await response.json();
          setStoreInfo({
            name: data.shopName || process.env.NEXT_PUBLIC_SHOP_NAME || 'TOKO SAKINAH',
            address: data.address || process.env.NEXT_PUBLIC_SHOP_ADDRESS || 'Jl. Raya No. 123, Kota Anda',
            phone: data.phone || process.env.NEXT_PUBLIC_SHOP_PHONE || '0812-3456-7890',
          });
        } else {
          // Gunakan environment variables atau default jika API gagal
          setStoreInfo({
            name: process.env.NEXT_PUBLIC_SHOP_NAME || 'TOKO SAKINAH',
            address: process.env.NEXT_PUBLIC_SHOP_ADDRESS || 'Jl. Raya No. 123, Kota Anda',
            phone: process.env.NEXT_PUBLIC_SHOP_PHONE || '0812-3456-7890',
          });
        }
      } catch (error) {
        console.error('Error fetching store info:', error);
        // Gunakan default jika terjadi error
        setStoreInfo({
          name: process.env.NEXT_PUBLIC_SHOP_NAME || 'TOKO SAKINAH',
          address: process.env.NEXT_PUBLIC_SHOP_ADDRESS || 'Jl. Raya No. 123, Kota Anda',
          phone: process.env.NEXT_PUBLIC_SHOP_PHONE || '0812-3456-7890',
        });
      }
    };

    fetchStoreInfo();
  }, []);

  if (!receiptData) {
    return null;
  }

  // Format currency for thermal printer (no decimals)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Limit text length for thermal printer
  const limitText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  };

  const {
    id,
    invoiceNumber,
    subTotal,
    grandTotal,
    totalDiscount,
    payment,
    change,
    items,
    cashier,
    attendant,
    date,
    customer,
    paymentMethod
  } = receiptData;

  return (
    <div
      className="thermal-receipt bg-white text-black text-xs font-mono leading-tight"
      style={{
        width: '72mm',
        fontFamily: 'monospace',
        fontSize: '12px',
        lineHeight: '1.1',
        margin: '0 auto'
      }}
    >
      <div className="text-center">
        <h2 className="text-lg font-bold uppercase">{storeInfo.name}</h2>
        <p className="text-xs">{storeInfo.address}</p>
        <p className="text-xs">{storeInfo.phone}</p>
      </div>

      <div className="my-2 border-t border-b border-black py-1">
        <div className="flex justify-between text-xs">
          <span>No: {limitText(invoiceNumber || id, 15)}</span>
          <span>{new Date(date).toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Kasir: {limitText(cashier?.name || 'N/A', 10)}</span>
          <span>Pelayan: {limitText(attendant?.name || 'N/A', 10)}</span>
        </div>
        {customer && customer.name && customer.name !== 'Umum' && customer.name !== 'Pelanggan Umum' && (
          <div className="text-xs mt-1">
            <span>Member: {limitText(customer.name, 15)}</span>
          </div>
        )}
      </div>

      <div className="my-2">
        {items.map((item, index) => (
          <div key={index} className="text-xs mb-1">
            <div className="flex justify-between">
              <span className="flex-1 truncate">{limitText(item.name || '', 18)}</span>
              <span className="w-16 text-right">{item.quantity}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-right">@{formatCurrency(item.originalPrice || 0)}</span>
              <span className="w-16 text-right">{formatCurrency(item.originalPrice * item.quantity || 0)}</span>
            </div>
            {item.originalPrice !== item.priceAfterItemDiscount && (
              <div className="flex justify-between text-right text-xs italic">
                <span></span>
                <span className="text-right">Pot:{formatCurrency(item.originalPrice - item.priceAfterItemDiscount)}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="my-2 border-t border-black pt-1">
        <div className="flex justify-between text-sm font-semibold">
          <span>Subtotal</span>
          <span>{formatCurrency(subTotal || 0)}</span>
        </div>
        {totalDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span>Diskon</span>
            <span>-{formatCurrency(totalDiscount || 0)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold border-t border-black py-1">
          <span>Total</span>
          <span>{formatCurrency(grandTotal || 0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Bayar</span>
          <span>{formatCurrency(payment || 0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Kembali</span>
          <span>{formatCurrency(change || 0)}</span>
        </div>
      </div>

      <div className="my-2 border-t border-black pt-1">
        <div className="text-xs text-center">
          <div className="mb-1">Metode: {paymentMethod || 'CASH'}</div>
          <div>Terima kasih telah berbelanja!</div>
          <div className="text-xs mt-1">Barang yg sdh dibeli</div>
          <div className="text-xs">tidak dpt ditukar/dikembalikan</div>
        </div>
      </div>
      
      <div className="text-center text-xs mt-2">
        <p>Struk ini merupakan bukti pembayaran sah</p>
      </div>
    </div>
  );
};

export default ThermalReceipt;