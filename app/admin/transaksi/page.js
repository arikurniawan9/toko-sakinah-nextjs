// app/admin/transaksi/page.js
'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Home, Printer, Plus, AlertTriangle, CheckCircle } from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useUserTheme } from '../../../components/UserThemeContext';
import ProductSearch from "@/components/kasir/transaksi/ProductSearch";
import TransactionCart from "@/components/kasir/transaksi/TransactionCart";
import MemberSelection from "@/components/kasir/transaksi/MemberSelection";
import PaymentSummary from "@/components/kasir/transaksi/PaymentSummary";
import AttendantSelection from "@/components/kasir/transaksi/AttendantSelection";
import Receipt from "@/components/kasir/transaksi/Receipt";
import ThermalReceipt from "@/components/kasir/transaksi/ThermalReceipt";
import ConfirmationModal from "@/components/ConfirmationModal";
import SuccessModal from "@/components/SuccessModal";
import SuspendSaleModal from "@/components/kasir/transaksi/SuspendSaleModal";
import SuspendedSalesListModal from "@/components/kasir/transaksi/SuspendedSalesListModal";
import TransactionActions from "@/components/kasir/transaksi/TransactionActions";
import AddMemberModal from "@/components/kasir/transaksi/AddMemberModal";
import ReceivablesModal from "@/components/kasir/transaksi/ReceivablesModal";
import AllReceivablesModal from "@/components/kasir/transaksi/AllReceivablesModal";
import LowStockModal from "@/components/kasir/transaksi/LowStockModal";
import { useReactToPrint } from "react-to-print";
import { printThermalReceipt } from "@/utils/thermalPrint";
import { useProductSearch } from "@/lib/hooks/kasir/useProductSearch";
import { useNotification } from "@/components/notifications/NotificationProvider";

export default function AdminTransactionPage() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const { showNotification } = useNotification();
  const darkMode = userTheme.darkMode;
  const router = useRouter();

  // State Management
  const [cart, setCart] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [attendants, setAttendants] = useState([]);
  const [selectedAttendant, setSelectedAttendant] = useState(null);
  const [defaultMember, setDefaultMember] = useState(null); // State for the default member
  const [payment, setPayment] = useState(0);
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAttendantsModal, setShowAttendantsModal] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isSuspendedListModalOpen, setIsSuspendedListModalOpen] =
    useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [additionalDiscount, setAdditionalDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showReceivablesModal, setShowReceivablesModal] = useState(false);
  const [showAllReceivablesModal, setShowAllReceivablesModal] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successDetails, setSuccessDetails] = useState(null);
  const [storeInfo, setStoreInfo] = useState({ name: '', id: '' });

  // --- Cart Logic ---
  const removeFromCart = useCallback((productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.productId === productId) {
          if (newQuantity > item.stock) {
            alert(`Jumlah maksimum ${item.name} adalah ${item.stock} (stok tersedia).`);
            return { ...item, quantity: Math.min(newQuantity, item.stock) };
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  }, [removeFromCart]);

  const addToCart = useCallback((product) => {
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
    if (product.stock < 5) {
      setShowLowStockModal(true);
    }
  }, [cart, updateQuantity]);

  // --- Product Search Logic ---
  const {
    searchTerm,
    setSearchTerm,
    products,
    isProductListLoading,
    handleScan,
  } = useProductSearch(addToCart);

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

  const [isUnpaidConfirmModalOpen, setIsUnpaidConfirmModalOpen] = useState(false);

  const handleUnpaidPayment = useCallback(async () => {
    setIsUnpaidConfirmModalOpen(false); // Close modal before processing
    if (!session?.user?.id) {
      alert("Sesi pengguna tidak ditemukan. Harap login kembali.");
      setLoading(false);
      return;
    }
    if (cart.length === 0) {
      alert(
        "Keranjang belanja kosong! Tambahkan produk sebelum memproses pembayaran."
      );
      setLoading(false);
      return;
    }
    if (!selectedAttendant) {
      alert("Pelayan harus dipilih sebelum memproses transaksi!");
      setLoading(false);
      return;
    }
    if (!selectedMember || selectedMember.name === 'Pelanggan Umum') {
      alert("Member harus dipilih sebelum menyimpan sebagai hutang!");
      setLoading(false);
      return;
    }

    // Validasi bahwa jumlah pembayaran tidak melebihi total
    if (payment > calculation.grandTotal) {
      alert("Jumlah pembayaran tidak boleh melebihi total tagihan!");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/transaksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cashierId: session.user.id,
          attendantId: selectedAttendant.id,
          memberId: selectedMember.id,
          paymentMethod: paymentMethod,
          referenceNumber: paymentMethod !== 'CASH' ? referenceNumber : null, // Include reference number for QRIS/Transfer
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: getTierPrice(item, item.quantity),
            discount: getTierPrice(item, 1) - getTierPrice(item, item.quantity),
          })),
          total: calculation.grandTotal,
          payment: payment, // Kirim jumlah pembayaran sebagai DP (uang muka)
          change: 0, // Tidak ada kembalian untuk transaksi hutang
          tax: calculation.tax,
          discount: calculation.totalDiscount,
          additionalDiscount: additionalDiscount,
          status: payment > 0 ? 'PARTIALLY_PAID' : 'UNPAID', // Gunakan PARTIALLY_PAID jika ada DP, UNPAID jika tidak ada DP
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Hitung sisa yang harus dibayar
        const remainingAmount = calculation.grandTotal - payment;
        // Tampilkan modal sukses untuk transaksi hutang
        setSuccessMessage('Transaksi Hutang Berhasil Disimpan');
        setSuccessDetails(
          `Nomor Invoice: ${result.invoiceNumber || result.id}\n` +
          `Jumlah DP: ${formatCurrency(payment)}\n` +
          `Sisa Hutang: ${formatCurrency(remainingAmount)}`
        );
        setShowSuccessModal(true);

        // Reset form setelah transaksi hutang
        setCart([]);
        setSelectedMember(null);
        setSelectedAttendant(null);
        setPayment(0);
        setCalculation(null);
        setSearchTerm("");
        setAdditionalDiscount(0);
        setReferenceNumber(""); // Reset reference number after successful transaction
      } else {
        alert(`Gagal: ${result.error}`);
      }
    } catch (error) {
      console.error("Error processing unpaid payment:", error);
      alert("Terjadi kesalahan saat memproses pembayaran hutang");
    } finally {
      setLoading(false);
    }
  }, [calculation, session, selectedAttendant, selectedMember, cart, getTierPrice, paymentMethod, additionalDiscount, payment, referenceNumber]);

  const initiateUnpaidPayment = () => {
    // Tambahkan konfirmasi untuk pembayaran hutang
    if (!selectedMember || selectedMember.name === 'Pelanggan Umum') {
      alert("Member harus dipilih untuk transaksi hutang!");
      return;
    }

    if (cart.length === 0) {
      alert("Keranjang belanja kosong!");
      return;
    }

    // Buka modal konfirmasi
    setIsUnpaidConfirmModalOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
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
    console.log("Payment Method:", paymentMethod);
    console.log("Reference Number:", referenceNumber);

    setLoading(true);
    try {
      const response = await fetch("/api/transaksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cashierId: session.user.id,
          attendantId: selectedAttendant.id, // Now required, not optional
          memberId: selectedMember?.id || defaultMember?.id || null, // Use default member if none selected
          paymentMethod: paymentMethod, // Include payment method
          referenceNumber: paymentMethod !== 'CASH' ? referenceNumber : null, // Include reference number for QRIS/Transfer
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
        console.log("Full API response:", result); // Debug log lengkap
        console.log("API invoiceNumber:", result.invoiceNumber); // Debug log khusus invoice number

        // Ambil informasi toko untuk dimasukkan ke dalam receipt
        let storeInfo = {
          name: 'TOKO SAKINAH',
          address: 'Jl. Raya No. 123, Kota Anda',
          phone: '0812-3456-7890',
          code: 'TOKO001', // Default code
        };

        try {
          const storeResponse = await fetch('/api/stores/current');
          if (storeResponse.ok) {
            const storeData = await storeResponse.json();
            storeInfo = {
              name: storeData.name || process.env.NEXT_PUBLIC_SHOP_NAME || 'TOKO SAKINAH',
              address: storeData.address || process.env.NEXT_PUBLIC_SHOP_ADDRESS || 'Jl. Raya No. 123, Kota Anda',
              phone: storeData.phone || process.env.NEXT_PUBLIC_SHOP_PHONE || '0812-3456-7890',
              code: storeData.code || 'TOKO001', // Gunakan code dari storeData
            };
          } else {
            // Coba endpoint setting sebagai fallback
            const settingResponse = await fetch('/api/setting');
            if (settingResponse.ok) {
              const settingData = await settingResponse.json();
              storeInfo = {
                name: settingData.shopName || process.env.NEXT_PUBLIC_SHOP_NAME || 'TOKO SAKINAH',
                address: settingData.address || process.env.NEXT_PUBLIC_SHOP_ADDRESS || 'Jl. Raya No. 123, Kota Anda',
                phone: settingData.phone || process.env.NEXT_PUBLIC_SHOP_PHONE || '0812-3456-7890',
                code: settingData.code || 'TOKO001', // Gunakan code dari setting jika ada
              };
            }
          }
        } catch (error) {
          console.error('Error fetching store info for receipt:', error);
          // Gunakan environment variables atau default jika API gagal
          storeInfo = {
            name: process.env.NEXT_PUBLIC_SHOP_NAME || 'TOKO SAKINAH',
            address: process.env.NEXT_PUBLIC_SHOP_ADDRESS || 'Jl. Raya No. 123, Kota Anda',
            phone: process.env.NEXT_PUBLIC_SHOP_PHONE || '0812-3456-7890',
            code: 'TOKO001', // Default code
          };
        }

        const receiptPayload = {
          ...calculation,
          id: result.id,
          invoiceNumber: result.invoiceNumber || result.id, // Gunakan invoiceNumber, fallback ke id jika tidak ada
          date: result.date || result.createdAt, // Menggunakan date jika ada, jika tidak maka createdAt
          cashier: session.user,
          attendant: selectedAttendant,
          payment: payment,
          change: payment - calculation.grandTotal,
          paymentMethod: result.paymentMethod || paymentMethod, // Gunakan paymentMethod dari result atau dari state
          referenceNumber: result.referenceNumber || referenceNumber, // Gunakan reference number dari result atau dari state
          storeName: storeInfo.name,
          storeAddress: storeInfo.address,
          storePhone: storeInfo.phone,
          storeCode: storeInfo.code, // Tambahkan storeCode ke payload
        };
        console.log("Receipt payload:", receiptPayload); // Debug log

        // Pastikan invoiceNumber ada sebelum mencetak
        if (!receiptPayload.invoiceNumber) {
          console.warn("Invoice number tidak ditemukan, gunakan ID sebagai fallback");
          receiptPayload.invoiceNumber = result.id;
        }

        // Cek apakah pembayaran non-tunai (QRIS/Transfer) dengan referensi yang valid
        const isNonCashWithReference = paymentMethod !== 'CASH' && referenceNumber && referenceNumber.trim() !== '';

        if (isNonCashWithReference) {
          // Cetak otomatis untuk pembayaran QRIS/Transfer dengan referensi
          printThermalReceipt(receiptPayload)
            .then(() => {
              console.log("Cetak thermal otomatis berhasil");
            })
            .catch((error) => {
              console.error("Cetak thermal otomatis gagal:", error);
              // Tampilkan modal sebagai fallback jika cetak gagal
              setReceiptData(receiptPayload);
              setShowReceiptModal(true);
            });
        } else {
          // Tampilkan modal cetak untuk pembayaran tunai atau pembayaran non-tunai tanpa referensi
          setReceiptData(receiptPayload);
          setShowReceiptModal(true);
        }

        // Reset form setelah cetak
        setCart([]);
        setSelectedMember(null);
        setSelectedAttendant(null);
        setPayment(0);
        setCalculation(null);
        setSearchTerm("");
        setAdditionalDiscount(0); // Reset additional discount after successful transaction
      } else {
        alert(`Gagal: ${result.error}`);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Terjadi kesalahan saat memproses pembayaran");
    } finally {
      setLoading(false);
      // Reset reference number in finally block to ensure it's always cleared
      setReferenceNumber("");
    }
  }, [calculation, payment, session, selectedAttendant, selectedMember, cart, getTierPrice, defaultMember, additionalDiscount, paymentMethod, referenceNumber]);

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
        // Tampilkan modal sukses untuk penjualan yang ditangguhkan
        setSuccessMessage('Penjualan Berhasil Ditangguhkan');
        setSuccessDetails(null);
        setShowSuccessModal(true);
        // Reset state
        setCart([]);
        setSelectedMember(null);
        setSelectedAttendant(null);
        setPayment(0);
        setCalculation(null);
        setSearchTerm("");
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
    const memberToSelect = members.find((m) => m.id === suspendedSale.memberId) || null;

    // Set the state
    setCart(suspendedSale.cartItems);
    setSelectedMember(memberToSelect);

    // Close the modal
    setIsSuspendedListModalOpen(false);

    // Delete the suspended sale from the database
    try {
      const response = await fetch(`/api/suspended-sales?id=${suspendedSale.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(
          "Gagal menghapus penjualan yang ditangguhkan dari database."
        );
      }
      // Tampilkan modal sukses untuk penjualan yang dilanjutkan
      setSuccessMessage(`Penjualan "${suspendedSale.name}" Berhasil Dilanjutkan`);
      setSuccessDetails(null);
      setShowSuccessModal(true);
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
    const fetchInitialData = async () => {
      try {
        // Fetch store info first
        const storeRes = await fetch("/api/stores/current");
        if (storeRes.ok) {
          const storeData = await storeRes.json();
          setStoreInfo({
            name: storeData.name,
            id: storeData.code || 'N/A' // Menggunakan code sebagai ID toko, jika tidak ada maka tampilkan 'N/A'
          });
        } else {
          console.error("Gagal mengambil informasi toko:", storeRes.status);
          // Fallback untuk handle kasus ketika API tidak bisa diakses
          setStoreInfo({
            name: process.env.NEXT_PUBLIC_SHOP_NAME || 'Toko SAKINAH',
            id: session?.user?.storeId || 'TOKO001' // Gunakan storeId dari session jika tersedia
          });
        }

        const [membersRes, attendantsRes] = await Promise.all([
          fetch("/api/member?simple=true"),  // Gunakan parameter simple untuk mendapatkan array langsung
          fetch("/api/store-users?role=ATTENDANT"),  // Gunakan endpoint store-users dengan filter role ATTENDANT
        ]);
        const membersData = await membersRes.json();  // Ini sekarang langsung array
        const attendantsData = await attendantsRes.json();  // Ini sekarang berisi data dari response lengkap dengan pagination

        const allMembers = membersData || [];
        setMembers(allMembers);

        const generalCustomer = allMembers.find(
          (m) => m.name === "Pelanggan Umum"
        );
        setDefaultMember(generalCustomer);

        // Proses data pelayan dari response store-users (sudah dalam format yang benar)
        const allAttendants = attendantsData.users || [];
        setAttendants(allAttendants || []);
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
        router.push("/admin");
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

  const handleReceiptReadyToPrint = () => {
    if (receiptData && receiptRef.current) {
      // Instead of printing directly, let's show the receipt modal
      console.log("Receipt ready to be shown in modal");
    } else {
      console.log("Receipt not ready for printing. Data:", !!receiptData, "Ref:", !!receiptRef.current);
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
      // Diskon member dihitung dari subtotal sebelum diskon item
      memberDiscount = (subtotal * selectedMember.discount) / 100;
    }

    // Total diskon adalah jumlah dari semua jenis diskon
    const totalDiscount = itemDiscount + memberDiscount;

    // Hitung grand total setelah diskon member diterapkan
    const grandTotalAfterMemberDiscount = subtotal - memberDiscount;

    // Terapkan diskon tambahan jika ada
    const finalGrandTotal = Math.max(0, grandTotalAfterMemberDiscount - additionalDiscount);

    // Total diskon akhir adalah jumlah semua diskon
    const finalTotalDiscount = totalDiscount + additionalDiscount;

    const newCalculation = {
      items: calculatedItems,
      subTotal: subtotal,
      itemDiscount: itemDiscount,
      memberDiscount: memberDiscount,
      additionalDiscount: additionalDiscount,
      totalDiscount: finalTotalDiscount,
      tax: 0, // Pajak bisa ditambahkan nanti jika diperlukan
      grandTotal: Math.max(0, Math.round(finalGrandTotal)), // Pastikan tidak negatif
    };

    setCalculation(newCalculation);

    // Periksa apakah ada produk dengan stok rendah dan tampilkan modal
    const hasLowStockItems = calculatedItems.some(item => item.stock < 5);
    if (hasLowStockItems) {
      setShowLowStockModal(true);
    }
  }, [cart, selectedMember, getTierPrice, additionalDiscount]);

  // Fungsi untuk menambah member baru
  const handleAddMember = async (memberData) => {
    try {
      const response = await fetch('/api/member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      });

      const result = await response.json();

      if (response.ok) {
        // Tampilkan modal sukses untuk member baru yang berhasil ditambahkan
        setSuccessMessage('Member Baru Berhasil Ditambahkan');
        setSuccessDetails(null);
        setShowSuccessModal(true);
        // Tambahkan member baru ke daftar member
        setMembers(prev => [...prev, result]);
        // Pilih member yang baru ditambahkan
        setSelectedMember(result);
        return result;
      } else {
        alert(result.error || 'Gagal menambahkan member baru');
        throw new Error(result.error || 'Gagal menambahkan member baru');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Terjadi kesalahan saat menambahkan member baru');
      throw error;
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              Transaksi Admin
            </h1>
            <div className="flex space-x-2">
              <div className="group relative">
                <button
                  onClick={() => router.push("/admin")}
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
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAllReceivablesModal(true)}
                  className={`p-2 rounded-md relative ${
                    darkMode
                      ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                      : "bg-yellow-600 hover:bg-yellow-700 text-white"
                  } transition-colors`}
                  title="Daftar Member dengan Hutang"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.346 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.346-1.253V5z" clipRule="evenodd" />
                  </svg>
                </button>
                <TransactionActions
                  onSuspend={() => setIsSuspendModalOpen(true)}
                  onShowList={() => setIsSuspendedListModalOpen(true)}
                  isCartEmpty={cart.length === 0}
                  isLoading={loading}
                  darkMode={darkMode}
                />
              </div>
            </div>
          </div>

          {session?.user && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                darkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <div className="flex items-center space-x-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nama Toko</p>
                  <p className="text-lg font-semibold">{storeInfo.name || 'Memuat...'}</p>
                </div>
                <div className="border-l border-gray-300 dark:border-gray-600 h-10"></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Kode Toko</p>
                  <p className="text-lg font-semibold">{storeInfo.id || 'Memuat...'}</p>
                </div>
                <div className="border-l border-gray-300 dark:border-gray-600 h-10"></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Nama Admin
                  </p>
                  <p className="text-lg font-semibold">{session.user.name}</p>
                </div>
                <div className="border-l border-gray-300 dark:border-gray-600 h-10"></div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Kode Admin
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
                onAddNewMember={() => setShowAddMemberModal(true)}
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
                referenceNumber={referenceNumber}
                setReferenceNumber={setReferenceNumber}
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

          {/* Low Stock Modal */}
          <LowStockModal
            items={calculation?.items || []}
            isOpen={showLowStockModal}
            onClose={() => setShowLowStockModal(false)}
            darkMode={darkMode}
          />
        </div>
      </div>
      <div className="printable-receipt">
        <Receipt ref={receiptRef} receiptData={receiptData} onReadyToPrint={handleReceiptReadyToPrint} />
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

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onSave={handleAddMember}
        darkMode={darkMode}
        existingMembers={members}
      />

      {/* Receipt Modal */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[50] p-4">
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

      {/* Unpaid Payment Confirmation Modal */}
      <ConfirmationModal
        isOpen={isUnpaidConfirmModalOpen}
        onClose={() => setIsUnpaidConfirmModalOpen(false)}
        onConfirm={handleUnpaidPayment}
        title="Konfirmasi Transaksi Hutang"
        message={
          <div>
            <p className="mb-2">Anda akan menyimpan transaksi ini sebagai hutang untuk:</p>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-left">
              <p className="font-semibold">{selectedMember?.name}</p>
              <p className="text-sm">Total: {formatCurrency(calculation?.grandTotal || 0)}</p>
              <p className="text-sm">Jumlah DP: {formatCurrency(payment || 0)}</p>
              <p className="text-sm text-green-600 dark:text-green-400">Sisa Hutang: {calculation ? formatCurrency(Math.max(0, calculation.grandTotal - (payment || 0))) : formatCurrency(0)}</p>
              <p className="text-sm mt-2">Pelayan: {selectedAttendant?.name}</p>
            </div>
            <p className="mt-3">Transaksi ini akan dicatat sebagai hutang dan stok produk akan berkurang. Apakah Anda yakin ingin melanjutkan?</p>
          </div>
        }
        confirmText="Simpan sebagai Hutang"
        cancelText="Batal"
        isLoading={loading}
        variant="warning"
      />

      {/* Receivables Modal */}
      <ReceivablesModal
        isOpen={showReceivablesModal}
        onClose={() => setShowReceivablesModal(false)}
        memberId={selectedMember?.id || null}
        darkMode={darkMode}
      />

      {/* All Receivables Modal */}
      <AllReceivablesModal
        isOpen={showAllReceivablesModal}
        onClose={() => setShowAllReceivablesModal(false)}
        darkMode={darkMode}
      />

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

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
        details={successDetails}
        darkMode={darkMode}
      />
    </ProtectedRoute>
  );
}