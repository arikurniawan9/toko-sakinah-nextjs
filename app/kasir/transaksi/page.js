// app/kasir/transaksi/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { Search, Plus, Trash2, Calculator, CreditCard, User, Users } from 'lucide-react';

export default function CashierTransaction() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [members, setMembers] = useState([]);
  const [payment, setPayment] = useState(0);
  const [calculation, setCalculation] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/member');
        const data = await response.json();
        setMembers(data.members || []);
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    };
    
    fetchMembers();
  }, []);

  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add product to cart
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: product.sellingPrice,
          quantity: 1,
          originalPrice: product.sellingPrice,
          discountPerItem: 0
        }
      ]);
    }
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  // Update quantity
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  // Calculate transaction
  const calculateTransaction = async () => {
    if (cart.length === 0) return;
    
    setLoading(true);
    try {
      const items = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));
      
      const response = await fetch('/api/transaksi/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          memberId: selectedMember?.id || null
        })
      });
      
      const data = await response.json();
      setCalculation(data);
    } catch (error) {
      console.error('Error calculating transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process payment
  const processPayment = async () => {
    if (!calculation || payment < calculation.grandTotal) {
      alert('Jumlah pembayaran kurang!');
      return;
    }

    try {
      const response = await fetch('/api/transaksi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cashierId: session.user.id,
          memberId: selectedMember?.id || null,
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            discount: item.discountPerItem
          })),
          total: calculation.grandTotal,
          payment: payment,
          change: payment - calculation.grandTotal
        })
      });

      if (response.ok) {
        alert('Transaksi berhasil!');
        // Reset form
        setCart([]);
        setSelectedMember(null);
        setPayment(0);
        setCalculation(null);
      } else {
        const error = await response.json();
        alert(`Gagal: ${error.error}`);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Terjadi kesalahan saat memproses pembayaran');
    }
  };

  // Calculate and update when cart or member changes
  useEffect(() => {
    if (cart.length > 0) {
      calculateTransaction();
    } else {
      setCalculation(null);
    }
  }, [cart, selectedMember]);

  return (
    <ProtectedRoute requiredRole="CASHIER">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Transaksi Kasir</h1>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Halo, {session?.user?.name}</p>
              <p className="text-xs text-gray-500">Kasir</p>
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
                      onClick={() => addToCart(product)}
                    >
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-600">Kode: {product.productCode}</div>
                      <div className="text-sm font-semibold text-pastel-purple-600">Rp {product.sellingPrice.toLocaleString('id-ID')}</div>
                      <div className="text-xs text-gray-500 mt-1">Stok: {product.stock}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cart & Payment */}
            <div className="space-y-6">
              {/* Member Selection */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Member</h2>
                  {selectedMember && (
                    <span className="text-sm text-green-600">{selectedMember.name}</span>
                  )}
                </div>
                
                {selectedMember ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{selectedMember.name} ({selectedMember.membershipType})</span>
                    <button 
                      onClick={() => setSelectedMember(null)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowMembers(true)}
                    className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Users className="h-4 w-4 inline mr-2" />
                    Pilih Member
                  </button>
                )}
              </div>

              {/* Cart */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h2 className="text-lg font-semibold text-gray-900">Keranjang</h2>
                </div>
                <div className="p-4 max-h-64 overflow-y-auto">
                  {cart.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Keranjang kosong</p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {cart.map((item, index) => (
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
                                onClick={() => removeFromCart(item.productId)}
                                className="text-red-500 hover:text-red-700 ml-2"
                              >
                                <Trash2 className="h-4 w-4" />
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

              {/* Calculation */}
              {calculation && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Perhitungan</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Rp {calculation.subTotal.toLocaleString('id-ID')}</span>
                    </div>
                    {calculation.itemDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Diskon Item:</span>
                        <span>-Rp {calculation.itemDiscount.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    {calculation.memberDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Diskon Member:</span>
                        <span>-Rp {calculation.memberDiscount.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>Rp {calculation.grandTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pembayaran</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="payment" className="block text-sm font-medium text-gray-700 mb-1">
                      Jumlah Bayar
                    </label>
                    <input
                      type="number"
                      id="payment"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pastel-purple-500 focus:border-pastel-purple-500"
                      value={payment}
                      onChange={(e) => setPayment(Number(e.target.value))}
                      placeholder="Masukkan jumlah pembayaran"
                    />
                  </div>
                  
                  {calculation && (
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Kembalian:</span>
                        <span className="font-medium">
                          Rp {Math.max(0, payment - calculation.grandTotal).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={processPayment}
                    disabled={loading || !calculation || payment < (calculation?.grandTotal || 0)}
                    className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pastel-purple-600 hover:bg-pastel-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Proses Pembayaran
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}