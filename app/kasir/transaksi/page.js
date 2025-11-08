// app/kasir/transaksi/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { Search, Plus, Trash2, Calculator, CreditCard, User, Users } from 'lucide-react';
import { useDarkMode } from '../../../components/DarkModeContext'; // Import useDarkMode

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
  const { darkMode } = useDarkMode(); // Initialize useDarkMode

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
    (product.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add product to cart
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    const originalPrice = getTierPrice(product, 1); // Price for 1 quantity (base price)

    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      const newPrice = getTierPrice(product, newQuantity);
      const newDiscountPerItem = originalPrice - newPrice;

      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: newQuantity, price: newPrice, discountPerItem: newDiscountPerItem }
          : item
      ));
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: originalPrice, // Initial price for 1 quantity
          quantity: 1,
          originalPrice: originalPrice, // Store original price for comparison
          discountPerItem: 0 // Initially no discount for 1 item
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

    setCart(cart.map(item => {
      if (item.productId === productId) {
        const productInList = products.find(p => p.id === productId);
        if (productInList) {
          const newPrice = getTierPrice(productInList, newQuantity);
          const newDiscountPerItem = item.originalPrice - newPrice; // Compare with original price
          return { ...item, quantity: newQuantity, price: newPrice, discountPerItem: newDiscountPerItem };
        }
      }
      return item;
    }));
  };

  // Calculate transaction
  const calculateTransaction = async () => {
    if (cart.length === 0) return;
    
    setLoading(true);
    try {
      const items = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price, // Send the calculated tiered price
        discount: item.discountPerItem // Send the calculated discount per item
      }));
      
      const bodyToSend = JSON.stringify({
        items,
        memberId: selectedMember?.id || null
      });

      const response = await fetch('/api/transaksi/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: bodyToSend
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

  // Handle barcode scan
  const handleScan = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission or other default behavior
      const scannedProduct = products.find(product => (product.code || '').toLowerCase() === searchTerm.toLowerCase());
      if (scannedProduct) {
        addToCart(scannedProduct);
        setSearchTerm(''); // Clear search term after successful scan
      } else {
        // Optionally, provide feedback to the user that the product was not found
        console.log('Product not found with code:', searchTerm);
      }
    }
  };

        const getTierPrice = (product, quantity) => {

          if (!product.priceTiers || product.priceTiers.length === 0) {

            return 0; // No price tiers defined

          }

      

          // Sort price tiers by minQty to ensure correct lookup

          const sortedTiers = [...product.priceTiers].sort((a, b) => a.minQty - b.minQty);

      

          // Find the highest tier that the quantity qualifies for

          let applicablePrice = 0;

          for (let i = sortedTiers.length - 1; i >= 0; i--) {

            const tier = sortedTiers[i];

            if (quantity >= tier.minQty) {

              applicablePrice = tier.price;

              break;

            }

          }

      

          // If no tier matches (e.g., quantity is less than the lowest minQty),

          // use the price of the first tier (minQty: 1) if available.

          if (applicablePrice === 0 && sortedTiers.length > 0) {

              applicablePrice = sortedTiers[0].price || 0;

          }

      

          return applicablePrice;

        };

  

    return (

      <ProtectedRoute requiredRole="CASHIER">

        <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            <div className="flex justify-between items-center mb-6">

              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Transaksi Kasir</h1>

              <div className="text-right">

                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Halo, {session?.user?.name}</p>

                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Kasir</p>

              </div>

            </div>

  

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Product Search & List */}

              <div className="lg:col-span-2">

                <div className={`rounded-lg shadow p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>

                  <div className="relative">

                    <input

                      type="text"

                      placeholder="Cari produk berdasarkan nama atau kode..."

                      className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pastel-purple-500 focus:border-pastel-purple-500 ${

                        darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'

                      }`}

                      value={searchTerm}

                      onChange={(e) => setSearchTerm(e.target.value)}

                      onKeyDown={handleScan} // Add onKeyDown event listener

                    />

                    <Search className={`absolute left-3 top-2.5 h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />

                  </div>

                </div>

  

                <div className={`rounded-lg shadow overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>

                  <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">

                                                        {filteredProducts.map(product => (

                                                          <li

                                                            key={product.id}

                        className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}

                        onClick={() => addToCart(product)}

                      >

                        <div>

                          <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</div>

                          <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Kode: {product.productCode}</div>

                        </div>

                        <div className="text-right">

                          <div className="text-sm font-semibold text-pastel-purple-600">Rp {getTierPrice(product, 1).toLocaleString('id-ID')}</div>

                          <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Stok: {product.stock}</div>

                        </div>

                      </li>

                    ))}

                  </ul>

                </div>

              </div>

  

              {/* Cart & Payment */}

              <div className="space-y-6">

                <div className={`rounded-lg shadow p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>

                  <div className="flex items-center justify-between mb-4">

                    <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Member</h2>

                    {selectedMember && (

                      <span className="text-sm text-green-600">{selectedMember.name}</span>

                    )}

                  </div>

                  

                  {selectedMember ? (

                    <div className="flex items-center justify-between">

                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{selectedMember.name} ({selectedMember.membershipType})</span>

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

                      className={`w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${darkMode ? 'text-gray-200 bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-white hover:bg-gray-50'}`}

                    >

                      <Users className="h-4 w-4 inline mr-2" />

                      Pilih Member

                    </button>

                  )}

                </div>

  

                {/* Cart */}

                <div className={`rounded-lg shadow overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>

                  <div className="px-4 py-5 border-b border-gray-200 sm:px-6">

                    <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Keranjang</h2>

                  </div>

                  <div className="p-4 max-h-64 overflow-y-auto">

                    {cart.length === 0 ? (

                      <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Keranjang kosong</p>

                    ) : (

                                                              <ul className="divide-y divide-gray-200">

                                                                {cart.map((item, index) => (

                                                                  <li key={index} className="py-2">

                            <div className="flex justify-between items-center">

                              <div>

                                <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.name}</div>

                                                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>

                                                                {item.quantity} x Rp {item.originalPrice.toLocaleString('id-ID')}

                                                                {item.discountPerItem > 0 && (

                                                                  <span className="text-red-500 ml-2">(-Rp {item.discountPerItem.toLocaleString('id-ID')})</span>

                                                                )}

                                                              </div>

                              </div>

                              <div className="flex items-center space-x-2">

                                <button

                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}

                                  className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}

                                >

                                  -

                                </button>

                                <span className="text-sm">{item.quantity}</span>

                                <button

                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}

                                  className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}

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

                                              <div className={`rounded-lg shadow p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>

                    <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Perhitungan</h2>

                    <div className="space-y-2 text-sm">

                      <div className="flex justify-between">

                        <span className={`${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>Subtotal:</span>

                                              <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>Rp {(calculation.subTotal || 0).toLocaleString('id-ID')}</span>

                                            </div>

                                            {calculation.totalDiscount > 0 && ( // New line for total discount

                                              <div className={`flex justify-between ${darkMode ? 'text-green-400' : 'text-green-600'}`}>

                                                <span>Potongan Harga:</span>

                                                <span>-Rp {(calculation.totalDiscount || 0).toLocaleString('id-ID')}</span>

                                              </div>

                                            )}

                      {calculation.itemDiscount > 0 && (

                        <div className={`flex justify-between ${darkMode ? 'text-green-400' : 'text-green-600'}`}>

                          <span>Diskon Item:</span>

                          <span>-Rp {(calculation.itemDiscount || 0).toLocaleString('id-ID')}</span>

                        </div>

                      )}

                      {calculation.memberDiscount > 0 && (

                        <div className={`flex justify-between ${darkMode ? 'text-green-400' : 'text-green-600'}`}>

                          <span>Diskon Member:</span>

                          <span>-Rp {(calculation.memberDiscount || 0).toLocaleString('id-ID')}</span>

                        </div>

                      )}

                      <div className="flex justify-between font-medium">

                        <span className={`${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>Total:</span>

                        <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>Rp {(calculation.grandTotal || 0).toLocaleString('id-ID')}</span>

                      </div>

                    </div>

                  </div>

                )}

  

                {/* Payment */}

                <div className={`rounded-lg shadow p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>

                  <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pembayaran</h2>

                  <div className="space-y-4">

                    <div>

                      <label htmlFor="payment" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}>

                        Jumlah Bayar

                      </label>

                      <input

                        type="number"

                        id="payment"

                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pastel-purple-500 focus:border-pastel-purple-500 ${

                          darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'

                        }`}

                        value={payment}

                        onChange={(e) => setPayment(Number(e.target.value))}

                        placeholder="Masukkan jumlah pembayaran"

                      />

                    </div>

                    

                    {calculation && (

                      <div className="text-sm">

                        <div className="flex justify-between">

                          <span className={`${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>Kembalian:</span>

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