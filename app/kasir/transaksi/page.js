// app/kasir/transaksi/page.js
'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Home, Printer, Plus, AlertTriangle, CheckCircle, UserCheck, X, CreditCard, Lock, Users } from "lucide-react";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useUserTheme } from '../../../components/UserThemeContext';
import ProductSearch from "@/components/kasir/transaksi/ProductSearch";
import TransactionCart from "@/components/kasir/transaksi/TransactionCart";
import MemberSelection from "@/components/kasir/transaksi/MemberSelection";
import PaymentModal from "@/components/kasir/transaksi/PaymentModal";
import AttendantSelection from "@/components/kasir/transaksi/AttendantSelection";
import TotalDisplay from "@/components/kasir/transaksi/TotalDisplay";
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
import DiscountInput from "@/components/kasir/transaksi/DiscountInput";
import { useReactToPrint } from "react-to-print";
import { printThermalReceipt } from "@/utils/thermalPrint";
import { useProductSearch } from "@/lib/hooks/kasir/useProductSearch";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { useTransactionCart } from "@/lib/hooks/kasir/useTransactionCart";
import Tooltip from "@/components/Tooltip";

export default function KasirTransaksiPage() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const { showNotification } = useNotification();
  const darkMode = userTheme.darkMode;
  const router = useRouter();

  // State Management
  // Tidak lagi menggunakan state members karena pencarian dilakukan secara dinamis
  const [selectedMember, setSelectedMember] = useState(null);
  const [attendants, setAttendants] = useState([]);
  const [selectedAttendant, setSelectedAttendant] = useState(null);
  const [defaultMember, setDefaultMember] = useState(null); // State for the default member
  const [payment, setPayment] = useState(0);
  const [additionalDiscount, setAdditionalDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAttendantsModal, setShowAttendantsModal] = useState(false);
  const [attendantSearchTerm, setAttendantSearchTerm] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isSuspendedListModalOpen, setIsSuspendedListModalOpen] =
    useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showReceivablesModal, setShowReceivablesModal] = useState(false);
  const [showAllReceivablesModal, setShowAllReceivablesModal] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successDetails, setSuccessDetails] = useState(null);
  const [storeInfo, setStoreInfo] = useState({ name: '', id: '' });

  // --- Cart Logic using custom hook ---
  const {
    cart,
    setCart,
    calculation,
    removeFromCart,
    updateQuantity,
    addToCart,
    calculateTransaction,
    overallDiscount,
    setOverallDiscountValue,
    resetCart
  } = useTransactionCart();


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
  const productSearchInputRef = useRef(null);

  const focusAndSelectProductSearch = () => {
    setTimeout(() => {
      if (productSearchInputRef.current) {
        productSearchInputRef.current.focus();
        if (productSearchInputRef.current.value) {
          productSearchInputRef.current.select();
        }
      }
    }, 100);
  };

  // Effect to focus on product search after payment modal closes
  useEffect(() => {
    if (!showPaymentModal) {
      focusAndSelectProductSearch();
    }
  }, [showPaymentModal]);

  // --- HELPER & LOGIC FUNCTIONS (Defined before useEffects that use them) ---

  const getTierPrice = useCallback((product, quantity, membershipType = 'RETAIL') => {
    // Use fixed price based on membership type instead of quantity-based tiers
    switch (membershipType) {
      case 'SILVER':
        return product.silverPrice || product.retailPrice || 0;
      case 'GOLD':
        return product.goldPrice || product.retailPrice || 0;
      case 'PLATINUM':
        return product.platinumPrice || product.retailPrice || 0;
      case 'RETAIL':
      default:
        return product.retailPrice || 0;
    }
  }, []);

  const initiatePaidPayment = () => {
    setIsConfirmModalOpen(true);
  };

  const [isUnpaidConfirmModalOpen, setIsUnpaidConfirmModalOpen] = useState(false);

  // Fungsi untuk membersihkan form transaksi
  const clearForm = useCallback(() => {
    setCart([]);
    setSelectedMember(null);
    setSelectedAttendant(null);
    setPayment(0);
    setSearchTerm("");
    setPaymentMethod("CASH");
    setReferenceNumber("");
  }, [
    setCart,
    setSelectedMember,
    setSelectedAttendant,
    setPayment,
    setSearchTerm,
    setPaymentMethod,
    setReferenceNumber,
  ]);

  const handleUnpaidPayment = useCallback(async () => {
    setIsUnpaidConfirmModalOpen(false); // Close modal before processing
    if (!session?.user?.id) {
      showNotification("Sesi pengguna tidak ditemukan. Harap login kembali.", 'error');
      setLoading(false);
      return;
    }
    if (cart.length === 0) {
      showNotification(
        "Keranjang belanja kosong! Tambahkan produk sebelum memproses pembayaran.",
        'error'
      );
      setLoading(false);
      return;
    }
    if (!selectedAttendant) {
      showNotification("Pelayan harus dipilih sebelum memproses transaksi!", 'error');
      setLoading(false);
      return;
    }
    if (!selectedMember || selectedMember.name === 'Pelanggan Umum') {
      showNotification("Member harus dipilih sebelum menyimpan sebagai hutang!", 'error');
      setLoading(false);
      return;
    }

    // Validasi bahwa jumlah pembayaran tidak melebihi total
    if (payment > calculation.grandTotal) {
      showNotification("Jumlah pembayaran tidak boleh melebihi total tagihan!", 'error');
      setLoading(false);
      return;
    }

    // Validasi bahwa pembayaran tidak negatif
    if (payment < 0) {
      showNotification("Jumlah pembayaran tidak boleh negatif!", 'error');
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
            price: getTierPrice(item, item.quantity, selectedMember?.membershipType || 'RETAIL'),
            discount: getTierPrice(item, 1, selectedMember?.membershipType || 'RETAIL') - getTierPrice(item, item.quantity, selectedMember?.membershipType || 'RETAIL'),
          })),
          total: calculation.subTotal || 0, // Kirim total sebelum diskon
          payment: payment, // Kirim jumlah pembayaran sebagai DP (uang muka)
          change: 0, // Tidak ada kembalian untuk transaksi hutang
          tax: calculation.tax,
          discount: (calculation.itemDiscount || 0) + (additionalDiscount || 0), // Combined discount (item + overall)
          status: payment > 0 ? 'CREDIT_PAID' : 'CREDIT', // Gunakan CREDIT untuk hutang penuh, CREDIT_PAID untuk sebagian bayar
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Correctly calculate finalTotal. calculation.subTotal already has member prices applied.
        const finalTotal = calculation.subTotal - (additionalDiscount || 0);
        const remainingAmount = finalTotal - payment;
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
        showNotification(`Gagal: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error("Error processing unpaid payment:", error);
      showNotification("Terjadi kesalahan saat memproses pembayaran hutang", 'error');
    } finally {
      setLoading(false);
    }
  }, [calculation, session, selectedAttendant, selectedMember, cart, getTierPrice, paymentMethod, payment, referenceNumber]);

  const initiateUnpaidPayment = () => {
    // Tambahkan konfirmasi untuk pembayaran hutang
    if (!selectedMember || selectedMember.name === 'Pelanggan Umum') {
      showNotification("Member harus dipilih untuk transaksi hutang!", 'error');
      return;
    }

    if (cart.length === 0) {
      showNotification("Keranjang belanja kosong!", 'error');
      return;
    }

    // Jika pembayaran sudah mencukupi, arahkan ke pembayaran lunas
    if (payment >= calculation.grandTotal) {
      showNotification("Jumlah bayar mencukupi. Gunakan tombol 'Bayar Lunas'.", 'info');
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
      showNotification('Silakan masukkan password Anda', 'error');
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
        showNotification('Password salah. Silakan coba lagi.', 'error');
        setUnlockPassword(''); // Kosongkan field password setelah salah
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      showNotification('Terjadi kesalahan saat memverifikasi password.', 'error');
    }
  };

  const handlePaidPayment = useCallback(async () => {
    setIsConfirmModalOpen(false); // Close modal on action
    if (!session?.user?.id) {
      showNotification("Sesi pengguna tidak ditemukan. Harap login kembali.", 'error');
      setLoading(false); // Ensure loading state is reset
      return;
    }
    if (cart.length === 0) {
      showNotification(
        "Keranjang belanja kosong! Tambahkan produk sebelum memproses pembayaran.",
        'error'
      );
      return;
    }
    if (!selectedAttendant) {
      showNotification("Pelayan harus dipilih sebelum memproses transaksi!", 'error');
      return;
    }
    if (!calculation || payment < calculation.grandTotal) {
      showNotification("Jumlah pembayaran kurang!", 'error');
      return;
    }

    console.log("Debugging processPayment:");
    console.log("Session User ID:", session.user.id);
    console.log("Session Status:", session.status);
    console.log("Cart items before API call:", cart);
    console.log("Calculation object:", calculation);
    console.log("Selected Attendant:", selectedAttendant);
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
            price: getTierPrice(item, item.quantity, selectedMember?.membershipType || 'RETAIL'),
            discount: getTierPrice(item, 1, selectedMember?.membershipType || 'RETAIL') - getTierPrice(item, item.quantity, selectedMember?.membershipType || 'RETAIL'),
          })),
          total: calculation.subTotal || 0, // Total sebelum diskon
          payment: payment,
          change: payment - (calculation.subTotal - (calculation.itemDiscount + (additionalDiscount || 0))), // Change based on final total after all discounts
          tax: calculation.tax,
          discount: (calculation.itemDiscount || 0) + (additionalDiscount || 0), // Combined discount (item + overall)
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Full API response:", result);
        console.log("API invoiceNumber:", result.invoiceNumber);

        // Debug log: Inspect calculation and receiptPayload before setting receiptData
        console.log("Debug: Calculation object before receiptPayload:", calculation);

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

        // Cek apakah pembayaran lunas (tidak ada hutang)
        const isFullyPaid = calculation && payment >= calculation.grandTotal;

        // Close the payment modal as the transaction is complete
        setShowPaymentModal(false);

        if (isFullyPaid) {
          // Langsung cetak tanpa tampilkan modal untuk pembayaran lunas
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
          // Tampilkan modal cetak untuk pembayaran hutang
          setReceiptData(receiptPayload);
          setShowReceiptModal(true);
        }

        // Reset form setelah cetak
        setCart([]);
        setSelectedMember(null);
        setSelectedAttendant(null);
        setPayment(0);
        // setCalculation(null); // This is redundant and handled by resetCart
        setSearchTerm("");
        setAdditionalDiscount(0); // Reset additional discount after successful transaction
        resetCart(); // Use the resetCart function from the hook
      } else {
        showNotification(`Gagal: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      showNotification("Terjadi kesalahan saat memproses pembayaran", 'error');
    } finally {
      setLoading(false);
      // Reset reference number in finally block to ensure it's always cleared
      setReferenceNumber("");
    }
  }, [calculation, payment, session, selectedAttendant, selectedMember, cart, getTierPrice, defaultMember, paymentMethod, referenceNumber]);

  const handleSuspendSale = async ({ name, notes }) => {
    if (cart.length === 0) {
      showNotification("Keranjang kosong, tidak ada yang bisa ditangguhkan.", 'error');
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
          selectedAttendantId: selectedAttendant?.id, // Simpan ID pelayan yang dipilih
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
        showNotification(`Gagal menangguhkan penjualan: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error("Error suspending sale:", error);
      showNotification("Terjadi kesalahan saat menangguhkan penjualan.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSale = async (suspendedSale) => {
    // Ambil detail member dari API jika ada memberId
    let memberToSelect = null;
    if (suspendedSale.memberId) {
      try {
        const response = await fetch(`/api/member/${suspendedSale.memberId}`);
        if (response.ok) {
          const memberData = await response.json();
          memberToSelect = memberData.member || null;
        }
      } catch (error) {
        console.error('Error fetching member for suspended sale:', error);
        memberToSelect = null;
      }
    }

    // Cari pelayan yang dipilih sebelumnya
    let attendantToSelect = null;
    if (suspendedSale.selectedAttendantId) {
      attendantToSelect = attendants.find(att => att.id === suspendedSale.selectedAttendantId) || null;
    }

    // Set the state
    setCart(suspendedSale.cartItems);
    setSelectedMember(memberToSelect);
    setSelectedAttendant(attendantToSelect);

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
      showNotification(error.message, 'error');
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

        const attendantsRes = await fetch("/api/store-users?role=ATTENDANT");  // Gunakan endpoint store-users dengan filter role ATTENDANT
        const attendantsData = await attendantsRes.json();  // Ini sekarang berisi data dari response lengkap dengan pagination

        const allAttendants = attendantsData.users || [];
        setAttendants(allAttendants || []);

        // Buat default member "Pelanggan Umum"
        const generalCustomer = {
          id: 'general-customer',
          name: 'Pelanggan Umum',
          phone: '',
          address: '',
          membershipType: 'REGULAR',
          discount: 0
        };
        setDefaultMember(generalCustomer);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    fetchInitialData();
  }, []);

  // Filter attendants based on search term
  const filteredAttendants = attendants.filter(attendant =>
    attendant &&
    attendant.name &&
    typeof attendant.name === 'string' &&
    (attendant.status === 'AKTIF' || attendant.status === 'ACTIVE') && // Hanya tampilkan pelayan yang aktif
    (attendant.name.toLowerCase().includes(attendantSearchTerm.toLowerCase()) ||
    attendant.code?.toLowerCase().includes(attendantSearchTerm.toLowerCase()) ||
    attendant.employeeNumber?.toLowerCase().includes(attendantSearchTerm.toLowerCase()) ||
    attendant.username?.toLowerCase().includes(attendantSearchTerm.toLowerCase()))
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      // --- General & Modal Shortcuts ---
      if (event.key === "Escape") {
        event.preventDefault();
        if (isConfirmModalOpen) setIsConfirmModalOpen(false);
        else if (isUnpaidConfirmModalOpen) setIsUnpaidConfirmModalOpen(false);
        else if (showMembersModal) setShowMembersModal(false);
        else if (showAttendantsModal) setShowAttendantsModal(false);
        else if (isSuspendModalOpen) setIsSuspendModalOpen(false);
        else if (isSuspendedListModalOpen) setIsSuspendedListModalOpen(false);
        else if (showPaymentModal) setShowPaymentModal(false);
        else if (showAddMemberModal) setShowAddMemberModal(false);
      }
      if (event.altKey && event.key.toLowerCase() === "h") {
        event.preventDefault();
        router.push("/kasir");
      }
      if (event.altKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        lockScreen();
      }
      
      // --- Modal Triggers ---
      if (event.altKey && event.key.toLowerCase() === "m") {
        event.preventDefault();
        setShowMembersModal((prev) => !prev);
      }
      if (event.altKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setShowAttendantsModal(true);
      }
      if (event.altKey && event.key === "Enter") {
        event.preventDefault();
        setShowPaymentModal(true);
      }

      // --- Transaction Actions ---
      if (event.shiftKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        clearForm();
      }
      if (event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (cart.length > 0) {
          setIsSuspendModalOpen(true);
        }
      }
      if (event.altKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (!isUnpaidConfirmModalOpen && calculation && selectedMember && selectedMember.name !== 'Pelanggan Umum' && selectedAttendant) {
          initiateUnpaidPayment();
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isConfirmModalOpen,
    isUnpaidConfirmModalOpen,
    showMembersModal,
    showAttendantsModal,
    isSuspendModalOpen,
    isSuspendedListModalOpen,
    showPaymentModal,
    showAddMemberModal,
    router,
    lockScreen,
    clearForm,
    cart.length,
    calculation,
    selectedMember,
    selectedAttendant,
    initiateUnpaidPayment,
    payment,
    loading,
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
    // Gunakan fungsi dari hook untuk menghitung transaksi dengan diskon tambahan
    calculateTransaction(cart, selectedMember, getTierPrice, additionalDiscount);
  }, [cart, selectedMember, getTierPrice, additionalDiscount, calculateTransaction]);

  // Fungsi untuk menambah member baru
  const handleAddMember = async (memberData) => {
    console.log('Data to be sent to API:', memberData); // Logging for debugging
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
        // Pilih member yang baru ditambahkan
        setSelectedMember(result);
        return result;
      } else {
        showNotification(result.error || 'Gagal menambahkan member baru', 'error');
        throw new Error(result.error || 'Gagal menambahkan member baru');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      showNotification('Terjadi kesalahan saat menambahkan member baru', 'error');
      throw error;
    }
  };

  return (
    <ProtectedRoute requiredRole="CASHIER">
      <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              Transaksi Kasir
            </h1>
            <div className={`flex items-center space-x-2 p-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <Tooltip content="Dashboard (Alt+H)" darkMode={darkMode}>
                <button
                  onClick={() => router.push("/kasir")}
                  className={`p-2 rounded-lg text-white transition-colors ${darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'}`}
                >
                  <Home size={20} />
                </button>
              </Tooltip>
              <Tooltip content="Kunci Layar (Alt+A)" darkMode={darkMode}>
                <button
                  onClick={lockScreen}
                  className={`p-2 rounded-lg text-white transition-colors ${darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'}`}
                >
                  <Lock size={20} />
                </button>
              </Tooltip>
              <Tooltip content="Daftar Member Berhutang" darkMode={darkMode}>
                <button
                  onClick={() => setShowAllReceivablesModal(true)}
                  className={`p-2 rounded-lg text-white transition-colors ${darkMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}
                >
                  <Users size={20} />
                </button>
              </Tooltip>
              <div className="h-8 border-l border-gray-300 dark:border-gray-600 mx-2"></div>
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
              <div className="flex items-center justify-between">
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
                <div className="flex items-center space-x-2">
                  <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Pelayan
                  </h2>
                  {selectedAttendant && selectedAttendant.name ? (
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                        {selectedAttendant.name}
                      </span>
                      <button
                        onClick={() => setSelectedAttendant(null)}
                        className={`text-sm font-medium p-1 rounded-full ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-100'}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAttendantsModal(true)}
                      className={`py-1 px-3 border rounded-md shadow-sm text-sm font-medium flex items-center justify-center ${
                        darkMode
                          ? 'border-gray-600 text-gray-200 bg-gray-700 hover:bg-gray-600'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <UserCheck className="h-4 w-4 inline mr-2" />
                      Pilih Pelayan
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}>
                        Alt+P
                      </span>
                    </button>
                  )}
                </div>

                {/* Modal untuk pemilihan pelayan */}
                {showAttendantsModal && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
                    <div className={`relative w-full max-w-md max-h-[70vh] rounded-2xl shadow-2xl flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <h3 className="text-lg font-semibold">Pilih Pelayan</h3>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Cari nama/kode pelayan..."
                            value={attendantSearchTerm}
                            onChange={(e) => setAttendantSearchTerm(e.target.value)}
                            className={`w-full mt-2 px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                              darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                            }`}
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="flex-1 p-4 overflow-y-auto styled-scrollbar">
                        {filteredAttendants.length === 0 ? (
                          <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <p>Tidak ada pelayan yang cocok.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {filteredAttendants
                              .filter(attendant => attendant && attendant.id) // Hanya proses attendant yang valid
                              .map(attendant => (
                              <button
                                key={attendant.id}
                                onClick={() => {
                                  setSelectedAttendant(attendant);
                                  setShowAttendantsModal(false);
                                  setAttendantSearchTerm('');
                                }}
                                className={`p-3 rounded-lg text-center transition-all duration-150 transform focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                  darkMode
                                    ? 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-offset-gray-800 focus:ring-purple-500'
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-offset-white focus:ring-purple-500'
                                }`}
                              >
                                <p className="font-semibold truncate">{attendant.name || 'Nama tidak tersedia'}</p>
                                <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {attendant.code || attendant.employeeNumber || attendant.username || '...'}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <button
                          onClick={() => {
                            setShowAttendantsModal(false);
                            setAttendantSearchTerm('');
                          }}
                          className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
                            darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ProductSearch
                ref={productSearchInputRef}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                handleScan={handleScan}
                products={products}
                addToCart={addToCart}
                isProductListLoading={isProductListLoading}
                darkMode={darkMode}
                getTierPrice={getTierPrice}
                showNotification={showNotification}
              />
              <TransactionCart
                cart={calculation?.items || []}
                updateQuantity={(productId, newQuantity) => {
                  const product = calculation?.items?.find(item => item.productId === productId);
                  if (product) {
                    updateQuantity(productId, newQuantity, product.stock, product.name);
                  } else {
                    // Jika produk tidak ditemukan di calculation, cari informasi dari cart
                    const cartItem = cart.find(item => item.productId === productId);
                    if (cartItem) {
                      updateQuantity(productId, newQuantity, cartItem.stock, cartItem.name);
                    }
                  }
                }}
                removeFromCart={removeFromCart}
                darkMode={darkMode}
              />
            </div>

            <div className="space-y-6">
              <MemberSelection
                selectedMember={selectedMember}
                defaultMember={defaultMember}
                onSelectMember={setSelectedMember}
                onRemoveMember={() => setSelectedMember(null)}
                darkMode={darkMode}
                isOpen={showMembersModal}
                onToggle={setShowMembersModal}
                onAddNewMember={() => setShowAddMemberModal(true)}
              />

              <TotalDisplay total={calculation?.grandTotal || 0} darkMode={darkMode} />

              <button
                onClick={() => setShowPaymentModal(true)}
                className={`w-full py-3 px-4 rounded-lg shadow-md text-base flex items-center justify-center ${
                  darkMode
                    ? 'bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white'
                } transition-all duration-200 transform hover:scale-[1.02]`}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                <div className="flex flex-col items-center leading-none">
                  <span className="font-semibold">Bayar</span>
                  <span className={`text-xs font-normal ${darkMode ? 'text-gray-300' : 'text-gray-200'}`}>(Alt+Enter)</span>
                </div>
              </button>
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
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handlePaidPayment}
        title="Konfirmasi Transaksi"
        message={
          <div>
            <p className="mb-4 text-center">Yakin ingin menyelesaikan transaksi?</p>
            <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Total Belanja:</span>
                <span className="font-medium text-gray-800 dark:text-gray-100">{formatCurrency(calculation?.grandTotal || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Jumlah Bayar:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(payment)}</span>
              </div>
              <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-gray-300 dark:border-gray-500">
                <span className="text-gray-700 dark:text-gray-200">Kembalian:</span>
                <span className="text-green-500 dark:text-green-400">{formatCurrency(Math.max(0, payment - (calculation?.grandTotal || 0)))}</span>
              </div>
            </div>
          </div>
        }
        confirmText="Simpan & Cetak"
        cancelText="Batal"
        darkMode={darkMode}
        isLoading={loading}
        variant="info"
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
        existingMembers={[]} // Karena pencarian member sekarang dinamis, kita tidak lagi menyimpan semua member
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
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Toko: {storeInfo.name}</p>
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

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        calculation={calculation}
        payment={payment}
        setPayment={setPayment}
        additionalDiscount={additionalDiscount}
        setAdditionalDiscount={setAdditionalDiscount}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        initiatePaidPayment={initiatePaidPayment}
        initiateUnpaidPayment={initiateUnpaidPayment}
        referenceNumber={referenceNumber}
        setReferenceNumber={setReferenceNumber}
        loading={loading}
        darkMode={darkMode}
        sessionStatus={session?.status ?? "loading"}
        selectedMember={selectedMember}
        selectedAttendant={selectedAttendant}
        clearForm={clearForm}
      />
    </ProtectedRoute>
  );
}