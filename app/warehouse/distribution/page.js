'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useUserTheme } from '../../../components/UserThemeContext';
import Breadcrumb from '../../../components/Breadcrumb';
import DistributionReceiptModal from '../../../components/warehouse/DistributionReceiptModal';
import UserSelectionModal from '../../../components/shared/UserSelectionModal';

// New Hooks
import { useDistributionCart } from '../../../lib/hooks/warehouse/useDistributionCart';
import { useDistributionProductSearch } from '../../../lib/hooks/warehouse/useDistributionProductSearch';
import { useHotkeys } from '../../../lib/hooks/useHotkeys';


// New Components
import DistributionProductSearch from '../../../components/warehouse/distribution/DistributionProductSearch';
import DistributionCart from '../../../components/warehouse/distribution/DistributionCart';
import DistributionDetails from '../../../components/warehouse/distribution/DistributionDetails';

export default function WarehouseDistributionPage() {
  const { data: session } = useSession();
  const { userTheme } = useUserTheme();
  const darkMode = userTheme.darkMode;
  const searchRef = useRef(null);

  // State managed by the page
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedWarehouseUser, setSelectedWarehouseUser] = useState(null);
  const [notes, setNotes] = useState('');
  const [distributionDate, setDistributionDate] = useState(new Date());

  const [stores, setStores] = useState([]);
  const [warehouseUsers, setWarehouseUsers] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // New hooks for product search and cart management
  const {
    products: availableProducts,
    loading: productsLoading,
    searchTerm,
    setSearchTerm,
    loadMore,
    hasMore,
  } = useDistributionProductSearch();

  const {
    items: distributionItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
  } = useDistributionCart();

  // Hotkeys setup
  const hotkeys = [
    {
      keys: 'alt+s',
      callback: () => searchRef.current?.focus(),
    },
    {
      keys: 'alt+enter',
      callback: () => {
        if (!isSubmitting && distributionItems.length > 0) {
          submitDistribution();
        }
      },
    },
    {
      keys: 'alt+p',
      callback: () => {
        // Open user selection modal for attendant selection
        setIsUserModalOpen(true);
      },
    },
  ];
  useHotkeys(hotkeys, [isSubmitting, distributionItems]);

  // ESC key to close modals
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsUserModalOpen(false);
        setShowReceiptModal(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);


  // Fetch data for dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // Fetch users with ATTENDANT role only for distribution
        const [storesResponse, usersResponse] = await Promise.all([
          fetch('/api/warehouse/stores'),
          fetch('/api/warehouse/users?role=ATTENDANT'),
        ]);

        if (storesResponse.ok) {
          const storesData = await storesResponse.json();
          setStores(storesData.stores || []);
        }
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setWarehouseUsers(usersData.users || []);
        }
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };
    fetchDropdownData();
  }, []);

  const submitDistribution = async () => {
    if (!selectedStore || distributionItems.length === 0) {
      alert('Toko tujuan dan item distribusi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/warehouse/distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: selectedStore,
          distributionDate: distributionDate.toISOString(),
          items: distributionItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
          })),
          distributedBy: selectedWarehouseUser?.id || session.user.id,
          notes: notes,
          status: 'PENDING_ACCEPTANCE',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal membuat distribusi');
      }

      const result = await response.json();

      const receiptPayload = {
        id: result.distribution.id,
        store: stores.find(s => s.id === selectedStore),
        warehouse: { name: 'Gudang Pusat' },
        distributedByUser: warehouseUsers.find(u => u.id === selectedWarehouseUser) || session.user,
        distributedAt: distributionDate.toISOString(),
        items: distributionItems,
        notes: notes,
        status: 'PENDING_ACCEPTANCE',
        totalAmount: cartTotal,
      };

      setReceiptData(receiptPayload);
      setShowReceiptModal(true);

      // Clear form after submission
      clearCart();
      setSelectedStore('');
      setSelectedWarehouseUser('');
      setNotes('');
      setDistributionDate(new Date());

    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbItems = [
    { title: 'Gudang', href: '/warehouse' },
    { title: 'Distribusi', href: '/warehouse/distribution' },
  ];

  return (
    <ProtectedRoute requiredRole="WAREHOUSE">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} darkMode={darkMode} />
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Distribusi Produk ke Toko
          </h1>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Buat pengiriman produk dari gudang ke toko-toko dengan bantuan pelayan gudang.
          </p>
          <div className={`mt-2 text-xs flex items-center gap-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <span className="flex items-center gap-1"><strong className="border rounded px-1.5 py-0.5">Alt + S</strong> Fokus Cari</span>
            <span className="flex items-center gap-1"><strong className="border rounded px-1.5 py-0.5">Alt + P</strong> Pilih Pelayan</span>
            <span className="flex items-center gap-1"><strong className="border rounded px-1.5 py-0.5">Alt + Enter</strong> Simpan</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Product Search */}
          <div className="lg:col-span-2">
            <DistributionProductSearch
              ref={searchRef}
              products={availableProducts}
              loading={productsLoading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              addToCart={addToCart}
              loadMore={loadMore}
              hasMore={hasMore}
              darkMode={darkMode}
            />
          </div>

          {/* Right Column: Cart and Details */}
          <div className="flex flex-col gap-6">
            <DistributionDetails
              stores={stores}
              warehouseUsers={warehouseUsers}
              selectedStore={selectedStore}
              setSelectedStore={setSelectedStore}
              selectedWarehouseUser={selectedWarehouseUser}
              setSelectedWarehouseUser={setSelectedWarehouseUser}
              notes={notes}
              setNotes={setNotes}
              onSubmit={submitDistribution}
              isSubmitting={isSubmitting}
              darkMode={darkMode}
              setIsUserModalOpen={setIsUserModalOpen}
            />
            <DistributionCart
              items={distributionItems}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
              cartTotal={cartTotal}
              darkMode={darkMode}
            />
          </div>
        </div>
      </main>

      {/* Distribution Receipt Modal */}
      <DistributionReceiptModal
        distributionData={receiptData}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />

      <UserSelectionModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        users={warehouseUsers}
        onSelectUser={setSelectedWarehouseUser}
        darkMode={darkMode}
      />
    </ProtectedRoute>
  );
}
