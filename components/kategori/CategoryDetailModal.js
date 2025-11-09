'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Inbox } from 'lucide-react';

const ProductListSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
        <div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-1.5"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-500 rounded w-24"></div>
        </div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
      </div>
    ))}
  </div>
);

const CategoryDetailModal = ({ isOpen, onClose, category }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && category?.id) {
      setLoading(true);
      setProducts([]); // Reset products on open
      setSearchTerm(''); // Reset search term
      const fetchProducts = async () => {
        try {
          const response = await fetch(`/api/produk?categoryId=${category.id}&limit=0`); // Fetch all products for the category
          if (!response.ok) throw new Error('Gagal mengambil data produk');
          const data = await response.json();
          setProducts(data.products || []);
        } catch (error) {
          console.error("Error fetching products for category:", error);
          setProducts([]);
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    }
  }, [isOpen, category]);

  if (!isOpen) return null;

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col" style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Produk dalam Kategori
            </h3>
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">{category?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari produk di kategori ini..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <ProductListSkeleton />
          ) : filteredProducts.length > 0 ? (
            <div className="space-y-3">
              {filteredProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Kode: {product.productCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-gray-800 dark:text-gray-200">{product.stock}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Stok</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Inbox className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-semibold">Tidak Ada Produk</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? `Tidak ada produk yang cocok dengan pencarian "${searchTerm}".`
                  : 'Belum ada produk yang ditambahkan ke kategori ini.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailModal;
