// components/ProductCard.js
import Image from 'next/image';
import { useState } from 'react';

const ProductCard = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  
  const handleAddToCart = () => {
    if (onAddToCart && product) {
      onAddToCart({
        productId: product.id,
        name: product.name,
        price: product.sellingPrice,
        quantity: quantity,
        image: product.image
      });
    }
  };

  return (
    <div className="card-pastel-purple overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
      <div className="relative h-48 w-full">
        {product.image ? (
          <Image 
            src={product.image} 
            alt={product.name} 
            layout="fill"
            objectFit="cover"
            className="rounded-t-lg"
          />
        ) : (
          <div className="bg-gray-200 border-2 border-dashed rounded-t-lg w-full h-full flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-800 mb-1">{product.name}</h3>
        <p className="text-pastel-purple-600 font-medium">Rp {product.sellingPrice.toLocaleString()}</p>
        <p className="text-sm text-gray-600 mt-1">Stok: {product.stock}</p>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2 text-gray-600">Qty:</span>
            <input
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(product.stock, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-16 border border-gray-300 rounded px-2 py-1 text-center"
            />
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              product.stock > 0 
                ? 'bg-pastel-purple-500 hover:bg-pastel-purple-600' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {product.stock > 0 ? 'Tambah' : 'Habis'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;