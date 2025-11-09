'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import ProtectedRoute from '../../../components/ProtectedRoute';
import Sidebar from '../../../components/Sidebar';
import { useDarkMode } from '../../../components/DarkModeContext';
import ProductSearch from '../../../components/kasir/transaksi/ProductSearch';
import TransactionCart from '../../../components/kasir/transaksi/TransactionCart';
import MemberSelection from '../../../components/kasir/transaksi/MemberSelection';
import PaymentSummary from '../../../components/kasir/transaksi/PaymentSummary';

import AttendantSelection from '../../../components/kasir/transaksi/AttendantSelection';
import Receipt from '../../../components/kasir/transaksi/Receipt';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { useReactToPrint } from 'react-to-print';

export default function AdminTransaction() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const router = useRouter();

  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [attendants, setAttendants] = useState([]);
  const [selectedAttendant, setSelectedAttendant] = useState(null);
  const [defaultMember, setDefaultMember] = useState(null); // State for the default member
  const [payment, setPayment] = useState(0);
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isProductListLoading, setIsProductListLoading] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAttendantsModal, setShowAttendantsModal] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [additionalDiscount, setAdditionalDiscount] = useState(0);

  const receiptRef = useRef();

  // --- HELPER & LOGIC FUNCTIONS (Defined before useEffects that use them) ---

  const getTierPrice = useCallback((product, quantity) => {
    if (!product.priceTiers || product.priceTiers.length === 0) return 0;
    const sortedTiers = [...product.priceTiers].sort((a, b) => a.minQty - b.minQty);
    let applicablePrice = sortedTiers[0]?.price || 0;
    for (let i = sortedTiers.length - 1; i >= 0; i--) {
      if (quantity >= sortedTiers[i].minQty) {
        applicablePrice = sortedTiers[i].price;
        break;
      }
    }
    return applicablePrice;
  }, []);

  const handleInitiatePayment = () => {
    setIsConfirmModalOpen(true);
  };

  const processPayment = useCallback(async () => {
    setIsConfirmModalOpen(false); // Close modal on action
    if (!session?.user?.id) {
      alert('Sesi pengguna tidak ditemukan. Harap login kembali.');
      setLoading(false); // Ensure loading state is reset
      return;
    }
    if (cart.length === 0) {
      alert('Keranjang belanja kosong! Tambahkan produk sebelum memproses pembayaran.');
      return;
    }
    if (!selectedAttendant) {
      alert('Pelayan harus dipilih sebelum memproses transaksi!');
      return;
    }
    if (!calculation || payment < calculation.grandTotal) {
      alert('Jumlah pembayaran kurang!');
      return;
    }

    console.log('Debugging processPayment:');
    console.log('Session User ID:', session.user.id);
    console.log('Session Status:', session.status);
    console.log('Cart items before API call:', cart);
    console.log('Calculation object:', calculation);
    console.log('Selected Attendant:', selectedAttendant);
    console.log('Additional Discount:', additionalDiscount);

    setLoading(true);
    try {
      const response = await fetch('/api/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashierId: session.user.id,
          attendantId: selectedAttendant.id, // Now required, not optional
          memberId: selectedMember?.id || defaultMember?.id || null, // Use default member if none selected
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: getTierPrice(item, item.quantity),
            discount: getTierPrice(item, 1) - getTierPrice(item, item.quantity),
          })),
          total: calculation.grandTotal,
          payment: payment,
          change: payment - calculation.grandTotal,
          tax: calculation.tax,
          discount: calculation.totalDiscount, // This will now include item and member discount
          additionalDiscount: additionalDiscount, // Send additional discount separately
        })
      });

      const result = await response.json();

      if (response.ok) {
        const receiptPayload = {
          ...calculation,
          id: result.id,
          date: result.date,
          cashier: session.user,
          attendant: selectedAttendant,
          payment: payment,
          change: payment - calculation.grandTotal,
        };
        setReceiptData(receiptPayload);

        setCart([]);
        setSelectedMember(null);
        setSelectedAttendant(null);
        setPayment(0);
        setCalculation(null);
        setSearchTerm('');
        setProducts([]);
        setAdditionalDiscount(0); // Reset additional discount after successful transaction
      } else {
        alert(`Gagal: ${result.error}`);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setLoading(false);
    }
  }, [calculation, payment, session, selectedAttendant, selectedMember, cart, getTierPrice, defaultMember, additionalDiscount]);

  // --- HOOKS ---

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    onAfterPrint: () => setReceiptData(null),
  });

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchTerm.trim().length === 0) {
        setProducts([]);
        return;
      }
      setIsProductListLoading(true);
      try {
        const response = await fetch(`/api/produk?search=${encodeURIComponent(searchTerm)}&limit=20`);
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsProductListLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [membersRes, attendantsRes] = await Promise.all([
          fetch('/api/member'),
          fetch('/api/pelayan')
        ]);
        const membersData = await membersRes.json();
        const attendantsData = await attendantsRes.json();

        const allMembers = membersData.members || [];
        setMembers(allMembers);

        const generalCustomer = allMembers.find(m => m.name === 'Pelanggan Umum');
        setDefaultMember(generalCustomer);

        setAttendants(attendantsData.attendants || []);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.altKey && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        setShowMembersModal(prev => !prev);
      }
      if (event.altKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setShowAttendantsModal(prev => !prev);
      }
      if (event.altKey && event.key.toLowerCase() === 'h') {
        event.preventDefault();
        router.push('/admin');
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        if (isConfirmModalOpen) setIsConfirmModalOpen(false);
        else if (showMembersModal) setShowMembersModal(false);
        else if (showAttendantsModal) setShowAttendantsModal(false);
      }
      if (event.altKey && event.key === 'Enter') {
        event.preventDefault();
        // Check if payment is possible before opening modal
        if (calculation && payment >= calculation.grandTotal && !loading) {
          handleInitiatePayment();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMembersModal, showAttendantsModal, router, processPayment, calculation, payment, loading, isConfirmModalOpen]);

  useEffect(() => {
    if (receiptData) {
      // Add a small delay to ensure the receipt component renders with the new data before printing
      const timer = setTimeout(() => {
        handlePrint();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [receiptData, handlePrint]);

  useEffect(() => {
    if (cart.length === 0) {
      setCalculation(null);
      return;
    }
    let subtotal = 0;
    let itemDiscount = 0;
    const calculatedItems = cart.map(item => {
      const basePrice = getTierPrice(item, 1);
      const actualPrice = getTierPrice(item, item.quantity);
      const discountPerItem = basePrice - actualPrice;
      const itemSubtotal = actualPrice * item.quantity;
      const totalItemDiscount = discountPerItem * item.quantity;
      subtotal += itemSubtotal;
      itemDiscount += totalItemDiscount;
      return { ...item, originalPrice: basePrice, priceAfterItemDiscount: actualPrice, itemDiscount: totalItemDiscount, subtotal: itemSubtotal };
    });
    let memberDiscount = 0;
    if (selectedMember?.discount) {
      memberDiscount = (subtotal * selectedMember.discount) / 100;
    }
    const totalDiscount = itemDiscount + memberDiscount;
    const grandTotal = subtotal - memberDiscount; // Re-introduce this line
    const finalGrandTotal = grandTotal - additionalDiscount;
    const finalTotalDiscount = totalDiscount + additionalDiscount;
    setCalculation({ items: calculatedItems, subTotal: subtotal, itemDiscount: itemDiscount, memberDiscount: memberDiscount, additionalDiscount: additionalDiscount, totalDiscount: finalTotalDiscount, tax: 0, grandTotal: Math.round(finalGrandTotal) });
  }, [cart, selectedMember, getTierPrice, additionalDiscount]);

  // --- CART LOGIC (can be defined here as they don't depend on hooks) ---

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      setCart(prevCart => [...prevCart, { productId: product.id, name: product.name, productCode: product.productCode, quantity: 1, stock: product.stock, priceTiers: product.priceTiers }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart => prevCart.map(item => {
      if (item.productId === productId) {
        if (newQuantity > item.stock) {
          console.warn(`Cannot add more ${item.name}. Stock limit reached.`);
          return { ...item, quantity: item.stock };
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const handleScan = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedSearchTerm = searchTerm.trim();
      if (!trimmedSearchTerm) return;
      setIsProductListLoading(true);
      try {
        let response = await fetch(`/api/produk?productCode=${encodeURIComponent(trimmedSearchTerm)}`);
        let data = await response.json();
        let scannedProduct = data.products && data.products.length > 0 ? data.products[0] : null;
        if (!scannedProduct) {
          response = await fetch(`/api/produk?search=${encodeURIComponent(trimmedSearchTerm)}`);
          data = await response.json();
          scannedProduct = data.products.find(p => p.productCode.toLowerCase() === trimmedSearchTerm.toLowerCase() || p.name.toLowerCase() === trimmedSearchTerm.toLowerCase());
        }
        if (scannedProduct) {
          addToCart(scannedProduct);
          setSearchTerm('');
        } else {
          alert(`Produk dengan kode/nama "${trimmedSearchTerm}" tidak ditemukan.`);
        }
      } catch (error) {
        console.error('Error scanning product:', error);
        alert('Terjadi kesalahan saat mencari produk.');
      } finally {
        setIsProductListLoading(false);
      }
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <Sidebar>
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50'}`}>
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ProductSearch
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                handleScan={handleScan}
                products={products}
                addToCart={addToCart}
                isProductListLoading={isProductListLoading}
                darkMode={darkMode}
                getTierPrice={getTierPrice}
                total={calculation?.grandTotal || 0} // Pass total to ProductSearch
              />

              <div className="space-y-6">
                <MemberSelection
                  selectedMember={selectedMember}
                  onSelectMember={setSelectedMember}
                  onRemoveMember={() => setSelectedMember(null)}
                  members={members}
                  darkMode={darkMode}
                  isOpen={showMembersModal}
                  onToggle={setShowMembersModal}
                />
                <AttendantSelection
                  selectedAttendant={selectedAttendant}
                  onSelectAttendant={setSelectedAttendant}
                  onRemoveAttendant={() => setSelectedAttendant(null)}
                  attendants={attendants}
                  darkMode={darkMode}
                  isOpen={showAttendantsModal}
                  onToggle={setShowAttendantsModal}
                />
                <TransactionCart
                  cart={calculation?.items || []}
                  updateQuantity={updateQuantity}
                  removeFromCart={removeFromCart}
                  darkMode={darkMode}
                />
                <PaymentSummary
                  calculation={calculation}
                  payment={payment}
                  setPayment={setPayment}
                  processPayment={handleInitiatePayment}
                  loading={loading}
                  darkMode={darkMode}
                  additionalDiscount={additionalDiscount}
                  setAdditionalDiscount={setAdditionalDiscount}
                  sessionStatus={session?.status ?? 'loading'}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="printable-receipt">
          <Receipt ref={receiptRef} receiptData={receiptData} />
        </div>
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={processPayment}
          title="Konfirmasi Transaksi"
          message="Apakah Anda yakin ingin menyimpan dan menyelesaikan transaksi ini?"
          confirmText="Simpan"
          cancelText="Batal"
          darkMode={darkMode}
          isLoading={loading}
        />
      </Sidebar>
    </ProtectedRoute>
  );
}