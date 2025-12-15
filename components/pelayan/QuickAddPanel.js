// components/pelayan/QuickAddPanel.js
'use client';

import { Star, StarOff } from 'lucide-react';

const QuickAddPanel = ({ 
  addToCart, 
  quickProducts, 
  addQuickProduct, 
  removeQuickProduct,
  darkMode 
}) => {
  const toggleQuickProduct = (product) => {
    const exists = quickProducts.some(p => p.id === product.id);
    if (exists) {
      removeQuickProduct(product.id);
    } else {
      addQuickProduct(product);
    }
  };

  const isQuickProduct = (productId) => {
    return quickProducts.some(p => p.id === productId);
  };

  if (!quickProducts || quickProducts.length === 0) {
    return (
      <div className={`p-6 rounded-lg border ${
        darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="text-center py-8">
          <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Tidak ada produk cepat. Tambahkan produk ke tombol bintang saat mencari produk.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg shadow ${
      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Produk Cepat
        </h3>
        <span className={`text-sm ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {quickProducts.length} produk
        </span>
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {quickProducts.map((product) => (
          <div
            key={product.id}
            className={`flex flex-col items-center p-2 rounded-lg border cursor-pointer transition-all hover:scale-105 ${
              darkMode 
                ? 'border-gray-600 hover:bg-gray-700' 
                : 'border-gray-300 hover:bg-gray-100'
            }`}
            onClick={() => addToCart(product)}
          >
            <div className="flex justify-between w-full mb-1">
              <div
                className={`p-1 rounded-full ${
                  isQuickProduct(product.id) 
                    ? (darkMode ? 'bg-yellow-500/20' : 'bg-yellow-100') 
                    : (darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200')
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleQuickProduct(product);
                }}
              >
                {isQuickProduct(product.id) ? (
                  <Star className={`h-4 w-4 ${
                    darkMode ? 'text-yellow-400' : 'text-yellow-500'
                  }`} fill="currentColor" />
                ) : (
                  <StarOff className={`h-4 w-4 ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                )}
              </div>
            </div>
            
            <div className={`h-12 w-12 rounded flex items-center justify-center mb-2 ${
              darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="h-10 w-10 object-contain rounded" 
                />
              ) : (
                <span className={`text-xs font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {product.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            
            <div className="text-center">
              <p className={`text-xs font-medium truncate ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {product.name?.substring(0, 10)}{product.name?.length > 10 ? '...' : ''}
              </p>
              <p className={`text-xs ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Rp {product.sellingPrice?.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickAddPanel;