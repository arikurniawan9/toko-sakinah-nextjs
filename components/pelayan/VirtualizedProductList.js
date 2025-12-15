// components/pelayan/VirtualizedProductList.js
import { memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const ProductRow = memo(({ data, index, style }) => {
  const { products, onAddToCart, darkMode } = data;
  const product = products[index];
  const isOutOfStock = product.stock <= 0;

  return (
    <div style={style}>
      <div
        className={`flex items-center space-x-4 p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'}`}
        onClick={() => !isOutOfStock && onAddToCart(product)}
      >
        <div className="flex-shrink-0 relative">
          {product.image ? (
            <img src={product.image} alt={product.name} className="h-12 w-12 object-contain rounded" />
          ) : (
            <div className="h-12 w-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {isOutOfStock && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1 rounded-full">X</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 dark:text-white truncate">{product.name}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Kode: {product.productCode}</div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-pastel-purple-600 dark:text-pastel-purple-400">
            Rp {product.sellingPrice ? product.sellingPrice.toLocaleString('id-ID') : '0'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Stok: {product.stock}</div>
        </div>
      </div>
    </div>
  );
});

const VirtualizedProductList = ({ products, onAddToCart, darkMode, height = 400 }) => {
  if (products.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Tidak ada produk ditemukan
      </div>
    );
  }

  return (
    <div className="h-full" style={{ height: `${height}px` }}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            itemCount={products.length}
            itemSize={80} // Height of each row
            width={width}
            itemData={{ products, onAddToCart, darkMode }}
          >
            {ProductRow}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};

export default VirtualizedProductList;