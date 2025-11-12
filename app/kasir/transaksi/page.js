"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Home, Printer } from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useDarkMode } from "@/components/DarkModeContext";
import ProductSearch from "@/components/kasir/transaksi/ProductSearch";
import TransactionCart from "@/components/kasir/transaksi/TransactionCart";
import MemberSelection from "@/components/kasir/transaksi/MemberSelection";
import PaymentSummary from "@/components/kasir/transaksi/PaymentSummary";
import AttendantSelection from "@/components/kasir/transaksi/AttendantSelection";
import Receipt from "@/components/kasir/transaksi/Receipt";
import ThermalReceipt from "@/components/kasir/transaksi/ThermalReceipt";
import ConfirmationModal from "@/components/ConfirmationModal";
import SuspendSaleModal from "@/components/kasir/transaksi/SuspendSaleModal";
import SuspendedSalesListModal from "@/components/kasir/transaksi/SuspendedSalesListModal";
import TransactionActions from "@/components/kasir/transaksi/TransactionActions";
import { useReactToPrint } from "react-to-print";
import { printThermalReceipt } from "@/utils/thermalPrint";

export default function KasirTransaksiPage() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();
  const router = useRouter();

  // State Management
  const [searchTerm, setSearchTerm] = useState("");
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
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isSuspendedListModalOpen, setIsSuspendedListModalOpen] =
    useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [additionalDiscount, setAdditionalDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  
  // State untuk fullscreen dan lock
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');

  const receiptRef = useRef();

  // --- HELPER & LOGIC FUNCTIONS (Defined before useEffects that use them) ---

  const getTierPrice = useCallback((product, quantity) => {
    if (!product.priceTiers || product.priceTiers.length === 0) return 0;
    const sortedTiers = [...product.priceTiers].sort(
      (a, b) => a.minQty - b.minQty
    );
    let applicablePrice = sortedTiers[0]?.price || 0;
    for (let i = sortedTiers.length - 1; i >= 0; i--) {
      if (quantity >= sortedTiers[i].minQty) {
        applicablePrice = sortedTiers[i].price;
        break;
      }
    }
    return applicablePrice;
  }, []);

  const initiatePaidPayment = () => {
    setIsConfirmModalOpen(true);
  };

  const initiateUnpaidPayment = () => {
    alert("Fitur simpan sebagai hutang belum tersedia di halaman ini.");
  };

  // Fungsi untuk toggle fullscreen
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.error('Error attempting to toggle fullscreen:', err);
    }
  };

  // Fungsi untuk lock saja (Alt+A hanya mengunci)
  const lockScreen = () => {
    setIsLocked(true);
    setUnlockPassword(''); // Bersihkan password
  };

  // Fungsi untuk unlock dengan password
  const handleUnlock = async () => {
    if (!unlockPassword.trim()) {
      alert('Silakan masukkan password Anda');
      return;
    }

    try {
      // Panggil API untuk verifikasi password
      // Gunakan ID pengguna dari session untuk verifikasi
      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session?.user?.id,
          password: unlockPassword,
        }),
      });

      const result = await response.json();

      if (response.ok && result.valid) {
        // Password benar, unlock layar
        setIsLocked(false);
        setUnlockPassword('');
      } else {
        // Password salah
        alert('Password salah. Silakan coba lagi.');
        setUnlockPassword(''); // Kosongkan field password setelah salah
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      alert('Terjadi kesalahan saat memverifikasi password.');
    }
  };

  const handlePaidPayment = useCallback(async () => {
    setIsConfirmModalOpen(false); // Close modal on action
    if (!session?.user?.id) {
      alert("Sesi pengguna tidak ditemukan. Harap login kembali.");
      setLoading(false); // Ensure loading state is reset
      return;
    }
    if (cart.length === 0) {
      alert(
        "Keranjang belanja kosong! Tambahkan produk sebelum memproses pembayaran."
      );
      return;
    }
    if (!selectedAttendant) {
      alert("Pelayan harus dipilih sebelum memproses transaksi!");
      return;
    }
    if (!calculation || payment < calculation.grandTotal) {
      alert("Jumlah pembayaran kurang!");
      return;
    }

    console.log("Debugging processPayment:");
    console.log("Session User ID:", session.user.id);
    console.log("Session Status:", session.status);
    console.log("Cart items before API call:", cart);
    console.log("Calculation object:", calculation);
    console.log("Selected Attendant:", selectedAttendant);
    console.log("Additional Discount:", additionalDiscount);

    setLoading(true);
    try {
      const response = await fetch("/api/transaksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cashierId: session.user.id,
          attendantId: selectedAttendant.id, // Now required, not optional
          memberId: selectedMember?.id || defaultMember?.id || null, // Use default member if none selected
          items: cart.map((item) => ({
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
        }),
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

        // Langsung cetak struk tanpa menampilkan modal
        printThermalReceipt(receiptPayload)
          .then(() => {
            console.log("Cetak thermal berhasil");
          })
          .catch((error) => {
            console.error("Cetak thermal gagal:", error);
            // Tampilkan modal sebagai fallback jika cetak gagal
            setReceiptData(receiptPayload);
            setShowReceiptModal(true);
          });

        // Reset form setelah cetak
        setCart([]);
        setSelectedMember(null);
        setSelectedAttendant(null);
        setPayment(0);
        setCalculation(null);
        setSearchTerm("");
        setProducts([]);
        setAdditionalDiscount(0); // Reset additional discount after successful transaction
      } else {
        alert(`Gagal: ${result.error}`);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Terjadi kesalahan saat memproses pembayaran");
    } finally {
      setLoading(false);
    }
  }, [
    calculation,
    payment,
    session,
    selectedAttendant,
    selectedMember,
    cart,
    getTierPrice,
    defaultMember,
    additionalDiscount,
  ]);

  const handleSuspendSale = async ({ name, notes }) => {
    if (cart.length === 0) {
      alert("Keranjang kosong, tidak ada yang bisa ditangguhkan.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/suspended-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          notes,
          memberId: selectedMember?.id || defaultMember?.id || null,
          cartItems: cart, // The API expects the cart items
        }),
      });

      if (response.ok) {
        alert("Penjualan berhasil ditangguhkan.");
        // Reset state
        setCart([]);
        setSelectedMember(null);
        setSelectedAttendant(null);
        setPayment(0);
        setCalculation(null);
        setSearchTerm("");
        setProducts([]);
        setAdditionalDiscount(0);
        setIsSuspendModalOpen(false);
      } else {
        const result = await response.json();
        alert(`Gagal menangguhkan penjualan: ${result.error}`);
      }
    } catch (error) {
      console.error("Error suspending sale:", error);
      alert("Terjadi kesalahan saat menangguhkan penjualan.");
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSale = async (suspendedSale) => {
    // Find the member object from the members list using memberId
    const memberToSelect =
      members.find((m) => m.id === suspendedSale.memberId) || null;

    // Set the state
    setCart(suspendedSale.cartItems);
    setSelectedMember(memberToSelect);

    // Close the modal
    setIsSuspendedListModalOpen(false);

    // Delete the suspended sale from the database
    try {
      const response = await fetch(
        `/api/suspended-sales?id=${suspendedSale.id}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error(
          "Gagal menghapus penjualan yang ditangguhkan dari database."
        );
      }
      alert(`Penjualan "${suspendedSale.name}" berhasil dilanjutkan.`);
    } catch (error) {
      console.error("Error deleting suspended sale:", error);
      alert(error.message);
    }
  };

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
        const response = await fetch(
          `/api/produk?search=${encodeURIComponent(searchTerm)}&limit=20`
        );
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
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
          fetch("/api/member"),
          fetch("/api/pelayan"),
        ]);
        const membersData = await membersRes.json();
        const attendantsData = await attendantsRes.json();

        const allMembers = membersData.members || [];
        setMembers(allMembers);

        const generalCustomer = allMembers.find(
          (m) => m.name === "Pelanggan Umum"
        );
        setDefaultMember(generalCustomer);

        setAttendants(attendantsData.attendants || []);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.altKey && event.key.toLowerCase() === "m") {
        event.preventDefault();
        setShowMembersModal((prev) => !prev);
      }
      if (event.altKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setShowAttendantsModal((prev) => !prev);
      }
      if (event.altKey && event.key.toLowerCase() === "h") {
        event.preventDefault();
        router.push("/kasir");
      }
      if (event.altKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        lockScreen(); // Hanya mengunci dengan Alt+A, tidak bisa membuka
      }
      if (event.key === "Escape") {
        event.preventDefault();
        if (isConfirmModalOpen) setIsConfirmModalOpen(false);
        else if (showMembersModal) setShowMembersModal(false);
        else if (showAttendantsModal) setShowAttendantsModal(false);
      }
      if (event.altKey && event.key === "Enter") {
        event.preventDefault();
        // Check if payment is possible before opening modal
        if (calculation && payment >= calculation.grandTotal && !loading) {
          initiatePaidPayment();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showMembersModal,
    showAttendantsModal,
    router,
    handlePaidPayment,
    calculation,
    payment,
    loading,
    isConfirmModalOpen,
    lockScreen,
  ]);

  // Handle receipt modal display when data is ready
  useEffect(() => {
    if (receiptData) {
      console.log("Receipt data set, showing modal");
    }
  }, [receiptData]);

  // Effect untuk menangani fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleReceiptReadyToPrint = () => {
    if (receiptData && receiptRef.current) {
      // Instead of printing directly, let's show the receipt modal
      console.log("Receipt ready to be shown in modal");
    } else {
      console.log(
        "Receipt not ready for printing. Data:",
        !!receiptData,
        "Ref:",
        !!receiptRef.current
      );
    }
  };

  useEffect(() => {
    if (cart.length === 0) {
      setCalculation(null);
      return;
    }
    let subtotal = 0;
    let itemDiscount = 0;
    const calculatedItems = cart.map((item) => {
      const basePrice = getTierPrice(item, 1);
      const actualPrice = getTierPrice(item, item.quantity);
      const discountPerItem = basePrice - actualPrice;
      const itemSubtotal = actualPrice * item.quantity;
      const totalItemDiscount = discountPerItem * item.quantity;
      subtotal += itemSubtotal;
      itemDiscount += totalItemDiscount;
      return {
        ...item,
        originalPrice: basePrice,
        priceAfterItemDiscount: actualPrice,
        itemDiscount: totalItemDiscount,
        subtotal: itemSubtotal,
      };
    });
    let memberDiscount = 0;
    if (selectedMember?.discount) {
      memberDiscount = (subtotal * selectedMember.discount) / 100;
    }
    const totalDiscount = itemDiscount + memberDiscount;
    const grandTotal = subtotal - memberDiscount; // Re-introduce this line
    const finalGrandTotal = grandTotal - additionalDiscount;
    const finalTotalDiscount = totalDiscount + additionalDiscount;
    setCalculation({
      items: calculatedItems,
      subTotal: subtotal,
      itemDiscount: itemDiscount,
      memberDiscount: memberDiscount,
      additionalDiscount: additionalDiscount,
      totalDiscount: finalTotalDiscount,
      tax: 0,
      grandTotal: Math.round(finalGrandTotal),
    });
  }, [cart, selectedMember, getTierPrice, additionalDiscount]);

  // --- CART LOGIC (can be defined here as they don't depend on hooks) ---

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.productId === product.id);
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      setCart((prevCart) => [
        ...prevCart,
        {
          productId: product.id,
          name: product.name,
          productCode: product.productCode,
          quantity: 1,
          stock: product.stock,
          priceTiers: product.priceTiers,
        },
      ]);
    }
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.productId !== productId)
    );
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.productId === productId) {
          if (newQuantity > item.stock) {
            console.warn(`Cannot add more ${item.name}. Stock limit reached.`);
            return { ...item, quantity: item.stock };
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const handleScan = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmedSearchTerm = searchTerm.trim();
      if (!trimmedSearchTerm) return;
      setIsProductListLoading(true);
      try {
        let response = await fetch(
          `/api/produk?productCode=${encodeURIComponent(trimmedSearchTerm)}`
        );
        let data = await response.json();
        let scannedProduct =
          data.products && data.products.length > 0 ? data.products[0] : null;
        if (!scannedProduct) {
          response = await fetch(
            `/api/produk?search=${encodeURIComponent(trimmedSearchTerm)}`
          );
          data = await response.json();
          scannedProduct = data.products.find(
            (p) =>
              p.productCode.toLowerCase() === trimmedSearchTerm.toLowerCase() ||
              p.name.toLowerCase() === trimmedSearchTerm.toLowerCase()
          );
        }
        if (scannedProduct) {
          addToCart(scannedProduct);
          setSearchTerm("");
        } else {
          alert(
            `Produk dengan kode/nama "${trimmedSearchTerm}" tidak ditemukan.`
          );
        }
      } catch (error) {
        console.error("Error scanning product:", error);
        alert("Terjadi kesalahan saat mencari produk.");
      } finally {
        setIsProductListLoading(false);
      }
    }
  };

  return (
    <ProtectedRoute requiredRole="CASHIER">
      <div
        className={`min-h-screen ${
          darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50"
        }`}
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-2">
            <h1
              className={`text-2xl font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Transaksi Kasir
            </h1>
            <div className="flex space-x-2">
              <div className="group relative">
                <button
                  onClick={() => router.push("/kasir")}
                  className={`p-2 rounded-md ${
                    darkMode
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  } transition-colors`}
                  title="Dashboard"
                >
                  <Home size={20} />
                </button>
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs py-1 px-2 rounded">
                  Dashboard
                </span>
              </div>
              <div className="group relative">
                <button
                  onClick={toggleFullscreen}
                  className={`p-2 rounded-md ${
                    isFullscreen
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : darkMode
                        ? "bg-gray-600 hover:bg-gray-700 text-white"
                        : "bg-gray-300 hover:bg-gray-400 text-gray-800"
                  } transition-colors`}
                  title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
                >
                  {isFullscreen ? "✕" : "⛶"}
                </button>
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs py-1 px-2 rounded">
                  {isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
                </span>
              </div>
              <div className="group relative">
                <button
                  onClick={lockScreen}
                  className={`p-2 rounded-md ${
                    darkMode
                      ? "bg-gray-600 hover:bg-gray-700 text-white"
                      : "bg-gray-300 hover:bg-gray-400 text-gray-800"
                  } transition-colors`}
                  title="Kunci Layar"
                >
                  🔒
                </button>
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs py-1 px-2 rounded">
                  Kunci Layar (Alt+A)
                </span>
              </div>
              <TransactionActions
                onSuspend={() => setIsSuspendModalOpen(true)}
                onShowList={() => setIsSuspendedListModalOpen(true)}
                isCartEmpty={cart.length === 0}
                isLoading={loading}
                darkMode={darkMode}
              />
            </div>
          </div>

          {session?.user && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                darkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Nama Kasir
                  </p>
                  <p className="text-lg font-semibold">{session.user.name}</p>
                </div>
                <div className="border-l border-gray-300 dark:border-gray-600 h-10"></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Kode Kasir
                  </p>
                  <p className="text-lg font-semibold">
                    {session.user.employeeNumber}
                  </p>
                </div>
              </div>
            </div>
          )}

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
                defaultMember={defaultMember}
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
                initiatePaidPayment={initiatePaidPayment}
                initiateUnpaidPayment={initiateUnpaidPayment}
                loading={loading}
                darkMode={darkMode}
                additionalDiscount={additionalDiscount}
                setAdditionalDiscount={setAdditionalDiscount}
                sessionStatus={session?.status ?? "loading"}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                selectedMember={selectedMember}
                selectedAttendant={selectedAttendant}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="printable-receipt">
        <Receipt
          ref={receiptRef}
          receiptData={receiptData}
          onReadyToPrint={handleReceiptReadyToPrint}
        />
      </div>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handlePaidPayment}
        title="Konfirmasi Transaksi"
        message="Apakah Anda yakin ingin menyimpan dan menyelesaikan transaksi ini?"
        confirmText="Simpan"
        cancelText="Batal"
        darkMode={darkMode}
        isLoading={loading}
      />
      <SuspendSaleModal
        isOpen={isSuspendModalOpen}
        onClose={() => setIsSuspendModalOpen(false)}
        onConfirm={handleSuspendSale}
        darkMode={darkMode}
        isLoading={loading}
      />
      <SuspendedSalesListModal
        isOpen={isSuspendedListModalOpen}
        onClose={() => setIsSuspendedListModalOpen(false)}
        onResume={handleResumeSale}
        darkMode={darkMode}
      />

      {/* Receipt Modal */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`relative ${
              darkMode ? "bg-gray-800" : "bg-white"
            } rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto`}
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3
                  className={`text-lg font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Struk Transaksi
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      // Use thermal receipt function
                      printThermalReceipt(receiptData)
                        .then(() => console.log("Cetak thermal berhasil"))
                        .catch((error) =>
                          console.error("Cetak thermal gagal:", error)
                        );
                    }}
                    className={`p-2 rounded ${
                      darkMode
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                    title="Cetak Struk"
                  >
                    <Printer size={16} />
                  </button>
                  <button
                    onClick={() => setShowReceiptModal(false)}
                    className={`p-2 rounded ${
                      darkMode
                        ? "bg-gray-600 hover:bg-gray-700 text-white"
                        : "bg-gray-300 hover:bg-gray-400 text-gray-800"
                    }`}
                    title="Tutup"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Thermal Receipt Preview */}
              <div className="p-4 max-h-[70vh] overflow-y-auto">
                <ThermalReceipt receiptData={receiptData} darkMode={darkMode} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lock Overlay - Muncul ketika mode lock aktif */}
      {isLocked && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Layar Terkunci
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Masukkan password untuk membuka
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  placeholder="Password Anda"
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUnlock();
                    }
                  }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleUnlock}
                  className={`py-2 px-4 rounded-lg font-medium ${
                    darkMode
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  } transition-colors`}
                >
                  Buka Kunci
                </button>
                <button
                  onClick={() => {
                    setUnlockPassword('');
                  }}
                  className={`py-2 px-4 rounded-lg font-medium ${
                    darkMode
                      ? "bg-gray-600 hover:bg-gray-700 text-white"
                      : "bg-gray-300 hover:bg-gray-400 text-gray-800"
                  } transition-colors`}
                >
                  Bersihkan
                </button>
              </div>
              
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                Masukkan password untuk membuka kunci
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
