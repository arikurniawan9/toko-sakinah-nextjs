// components/TransactionDetailModal.js
import { X } from 'lucide-react';

export default function TransactionDetailModal({ isOpen, onClose, transaction }) {
  if (!isOpen || !transaction) return null;

  // Group sale details by product
  const groupedDetails = transaction.saleDetails?.reduce((acc, detail) => {
    const existing = acc.find(item => item.productId === detail.productId);
    if (existing) {
      existing.quantity += detail.quantity;
      existing.subtotal += detail.subtotal;
    } else {
      acc.push({ ...detail });
    }
    return acc;
  }, []) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Detail Transaksi - {transaction.invoiceNumber}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-grow p-4">
          <div className="grid grid-cols-2 gap-4 mb-6 pb-4 border-b dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tanggal</p>
              <p className="text-gray-900 dark:text-white">
                {new Date(transaction.date).toLocaleDateString('id-ID')} {new Date(transaction.date).toLocaleTimeString('id-ID')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                transaction.status === 'PAID'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                  : transaction.status === 'UNPAID'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400'
              }`}>
                {transaction.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-gray-900 dark:text-white font-medium">
                Rp {transaction.total?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pembayaran</p>
              <p className="text-gray-900 dark:text-white">
                {transaction.paymentMethod} - Rp {transaction.payment?.toLocaleString()}
              </p>
            </div>
            {transaction.member && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Member</p>
                <p className="text-gray-900 dark:text-white">
                  {transaction.member.name} ({transaction.member.membershipType})
                </p>
              </div>
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daftar Produk</h3>
          
          {groupedDetails.length > 0 ? (
            <div className="space-y-2">
              {groupedDetails.map((detail, index) => {
                // Hitung total sebelum diskon
                const totalBeforeDiscount = detail.price * detail.quantity;
                // Hitung diskon per item
                const discountPerItem = detail.discount > 0 ? Math.floor(detail.discount / detail.quantity) : 0;
                // Hitung subtotal per item setelah diskon
                const priceAfterDiscount = detail.price - discountPerItem;

                return (
                  <div
                    key={index}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {detail.product?.name || 'Produk Tidak Ditemukan'}
                        </p>
                        <div className="mt-1 space-y-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Qty: {detail.quantity} × Rp {detail.price?.toLocaleString()}
                            {detail.discount > 0 && (
                              <span className="ml-2 text-red-600 dark:text-red-400">
                                (-Rp {discountPerItem?.toLocaleString()}/item)
                              </span>
                            )}
                          </p>
                          {detail.discount > 0 && (
                            <div className="flex items-center text-xs">
                              <span className="text-red-600 dark:text-red-400 line-through mr-2">
                                Harga awal: Rp {totalBeforeDiscount?.toLocaleString()}
                              </span>
                              <span className="text-green-600 dark:text-green-400">
                                Setelah diskon: Rp {(totalBeforeDiscount - detail.discount)?.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          Rp {detail.subtotal?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Tidak ada detail produk untuk transaksi ini.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors duration-200"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}