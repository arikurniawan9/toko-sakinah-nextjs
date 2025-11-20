// app/pelayan/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { Search, Plus, ShoppingCart, Users, Send } from 'lucide-react';

export default function AttendantDashboard() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [tempCart, setTempCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/produk');
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    
    fetchProducts();
  }, []);

  // Fetch customers (members)
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/member');
        const data = await response.json();
        setCustomers(data.members || []);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    
    fetchCustomers();
  }, []);

  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add product to temp cart
  const addToTempCart = (product) => {
    const existingItem = tempCart.find(item => item.productId === product.id);
    
    if (existingItem) {
      setTempCart(tempCart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setTempCart([
        ...tempCart,
        {
          productId: product.id,
          name: product.name,
          price: product.sellingPrice,
          quantity: 1,
          image: product.image
        }
      ]);
    }
  };

  // Remove item from temp cart
  const removeFromTempCart = (productId) => {
    setTempCart(tempCart.filter(item => item.productId !== productId));
  };

  // Update quantity
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromTempCart(productId);
      return;
    }

    setTempCart(tempCart.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  // Send temp cart to cashier
  const sendToCashier = async () => {
    if (tempCart.length === 0) {
      alert('Keranjang masih kosong');
      return;
    }

    try {
      const response = await fetch('/api/temp-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendantId: session.user.id,
          customerId: selectedCustomer?.id || null,
          items: tempCart
        })
      });

      if (response.ok) {
        alert('Daftar belanja berhasil dikirim ke kasir!');
        // Clear temp cart
        setTempCart([]);
        setSelectedCustomer(null);
      } else {
        const error = await response.json();
        alert(`Gagal mengirim: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending to cashier:', error);
      alert('Terjadi kesalahan saat mengirim daftar belanja');
    }
  };

  return (
    <ProtectedRoute requiredRole="ATTENDANT">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Pelayan</h1>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Halo, {session?.user?.name}</p>
              <p className="text-xs text-gray-500">Pelayan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Search & List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari produk berdasarkan nama atau kode..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pastel-purple-500 focus:border-pastel-purple-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Products Grid */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 max-h-96 overflow-y-auto">
                  {filteredProducts.map(product => (
                    <div 
                      key={product.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => addToTempCart(product)}
                    >
                      {product.image && (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-32 object-contain mb-2"
                        />
                      )}
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-600">Kode: {product.productCode}</div>
                      <div className="text-sm font-semibold text-pastel-purple-600">Rp {product.sellingPrice.toLocaleString('id-ID')}</div>
                      <div className="text-xs text-gray-500 mt-1">Stok: {product.stock}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Temp Cart & Actions */}
            <div className="space-y-6">
              {/* Customer Selection */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Pelanggan</h2>
                  {selectedCustomer && (
                    <span className="text-sm text-green-600">{selectedCustomer.name}</span>
                  )}
                </div>
                
                {selectedCustomer ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{selectedCustomer.name} ({selectedCustomer.membershipType})</span>
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCustomerModal(true)}
                    className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Users className="h-4 w-4 inline mr-2" />
                    Pilih Pelanggan
                  </button>
                )}
              </div>

              {/* Temp Cart */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Daftar Belanja</h2>
                    <span className="bg-pastel-purple-100 text-pastel-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {tempCart.length} item
                    </span>
                  </div>
                </div>
                <div className="p-4 max-h-64 overflow-y-auto">
                  {tempCart.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Daftar belanja kosong</p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {tempCart.map((item, index) => (
                        <li key={index} className="py-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-xs text-gray-500">
                                {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                -
                              </button>
                              <span className="text-sm">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                +
                              </button>
                              <button 
                                onClick={() => removeFromTempCart(item.productId)}
                                className="text-red-500 hover:text-red-700 ml-2"
                              >
                                <ShoppingCart className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="text-sm text-right text-pastel-purple-600 mt-1">
                            Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Send to Cashier */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Kirim ke Kasir</h2>
                <button
                  onClick={sendToCashier}
                  disabled={tempCart.length === 0}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pastel-purple-600 hover:bg-pastel-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Kirim Daftar Belanja
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Modal */}
        {showCustomerModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[100]">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Pilih Pelanggan</h3>
                  <button
                    onClick={() => setShowCustomerModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {customers.map(customer => (
                    <div
                      key={customer.id}
                      className="p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowCustomerModal(false);
                      }}
                    >
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-600">{customer.membershipType}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}