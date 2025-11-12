// components/kasir/transaksi/ProductGrid.js
'use client';

const ProductCard = ({ product, onAddToCart, darkMode }) => (
  <div
    onClick={() => onAddToCart(product)}
    className={`p-4 border rounded-lg cursor-pointer hover:shadow-lg transition-shadow ${
      darkMode ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-500'
    }`}
  >
    {/* In the future, we can add an image here */}
    {/* <img src={product.image || '/placeholder.png'} alt={product.name} className="h-24 w-full object-cover rounded-md mb-2" /> */}
    <h3 className={`font-bold text-md ${darkMode ? 'text-white' : 'text-gray-800'}`}>{product.name}</h3>
    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{product.productCode}</p>
    <p className={`text-lg font-semibold mt-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(product.priceTiers?.[0]?.price || 0)}
    </p>
     <p className={`text-xs mt-1 ${product.stock > 10 ? 'text-green-500' : 'text-red-500'}`}>
      Stok: {product.stock}
    </p>
  </div>
);

export default function ProductGrid({ products, onAddToCart, darkMode }) {
  if (!products || products.length === 0) {
    return <p className="text-center text-gray-500 mt-8">Tidak ada produk yang ditemukan.</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} darkMode={darkMode} />
      ))}
    </div>
  );
}