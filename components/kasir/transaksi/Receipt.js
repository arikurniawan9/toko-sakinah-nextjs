// components/kasir/transaksi/Receipt.js
import React from 'react';

const Receipt = React.forwardRef(({ receiptData }, ref) => {
  if (!receiptData) return null;

  const {
    id,
    date,
    cashier,
    items,
    subTotal,
    totalDiscount,
    grandTotal,
    payment,
    change,
  } = receiptData;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div ref={ref} className="receipt-container">
      <div className="receipt-content">
        <div className="receipt-header">
          <h2 className="store-name">Toko Sakinah</h2>
          <p>Jl. Raya Keadilan No. 123</p>
          <p>Telp: 0812-3456-7890</p>
        </div>
        <div className="receipt-info">
          <p>No: {id.slice(-8)}</p>
          <p>Kasir: {cashier?.name || 'N/A'}</p>
          <p>Tanggal: {new Date(date).toLocaleString('id-ID')}</p>
        </div>
        <div className="receipt-items">
          <table>
            <tbody>
              {items.map((item) => (
                <tr key={item.productId}>
                  <td colSpan="3" className="item-name">{item.name}</td>
                </tr>
              ))}
              {items.map((item) => (
                <tr key={`${item.productId}-details`}>
                  <td className="item-details">{item.quantity} x {formatCurrency(item.originalPrice)}</td>
                  <td className="item-details-center"></td>
                  <td className="item-total">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="receipt-summary">
          <table>
            <tbody>
              <tr>
                <td>Subtotal</td>
                <td>:</td>
                <td>{formatCurrency(subTotal)}</td>
              </tr>
              {totalDiscount > 0 && (
                <tr>
                  <td>Diskon</td>
                  <td>:</td>
                  <td>-{formatCurrency(totalDiscount)}</td>
                </tr>
              )}
              <tr className="grand-total">
                <td>Total</td>
                <td>:</td>
                <td>{formatCurrency(grandTotal)}</td>
              </tr>
              <tr>
                <td>Bayar</td>
                <td>:</td>
                <td>{formatCurrency(payment)}</td>
              </tr>
              <tr>
                <td>Kembali</td>
                <td>:</td>
                <td>{formatCurrency(change)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="receipt-footer">
          <p>Terima kasih telah berbelanja!</p>
          <p>Barang yang sudah dibeli tidak dapat dikembalikan.</p>
        </div>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';
export default Receipt;
