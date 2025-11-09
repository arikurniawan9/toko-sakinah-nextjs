// app/admin/transaksi/pembelian/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import { useDarkMode } from '@/components/DarkModeContext';
import { Plus, Trash2, Search, XCircle } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import ProductModal from '@/components/produk/ProductModal'; // Reusing existing product modal

export default function PurchaseTransactionPage() {
  const { data: session } = useSession();
  const { darkMode } = useDarkMode();

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProductData, setNewProductData] = useState(null); // To pre-fill product modal if search fails

  const searchInputRef = useRef(null);

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') return;

    const fetchInitialData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch suppliers
        const suppliersRes = await fetch('/api/supplier?limit=1000'); // Fetch all for selection
        if (!suppliersRes.ok) throw new Error('Failed to fetch suppliers');
        const suppliersData = await suppliersRes.json();
        setSuppliers(suppliersData.suppliers);

        // Set default purchase date to today
        const today = new Date();
        setPurchaseDate(today.toISOString().split('T')[0]);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [session]);

  const handleSearchProducts = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/produk?search=${searchTerm}`);
      if (!res.ok) throw new Error('Failed to search products');
      const data = await res.json();
      setSearchResults(data.products);
    } catch (err) {
      console.error('Error searching products:', err);
      setError(err.message);
    }
  };

  const handleAddProductToPurchase = (product) => {
    // Check if product already exists in purchaseItems
    const existingItemIndex = purchaseItems.findIndex(item => item.productId === product.id);
    if (existingItemIndex > -1) {
      // If exists, increment quantity
      const updatedItems = [...purchaseItems];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].subtotal = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].purchasePrice;
      setPurchaseItems(updatedItems);
    } else {
      // Add new product with default quantity 1 and its current purchasePrice
      setPurchaseItems([
        ...purchaseItems,
        {
          productId: product.id,
          productName: product.name,
          productCode: product.productCode,
          quantity: 1,
          purchasePrice: product.purchasePrice,
          subtotal: product.purchasePrice,
        },
      ]);
    }
    setSearchTerm('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  const handleQuantityChange = (index, value) => {
    const updatedItems = [...purchaseItems];
    const newQuantity = parseInt(value) || 0;
    updatedItems[index].quantity = newQuantity;
    updatedItems[index].subtotal = newQuantity * updatedItems[index].purchasePrice;
    setPurchaseItems(updatedItems);
  };

  const handlePurchasePriceChange = (index, value) => {
    const updatedItems = [...purchaseItems];
    const newPrice = parseInt(value) || 0;
    updatedItems[index].purchasePrice = newPrice;
    updatedItems[index].subtotal = updatedItems[index].quantity * newPrice;
    setPurchaseItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const calculateTotalPurchase = () => {
    return purchaseItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSubmitPurchase = async () => {
    setError('');
    setSuccessMessage('');
    if (!selectedSupplier) {
      setError('Please select a supplier.');
      return;
    }
    if (!purchaseDate) {
      setError('Please select a purchase date.');
      return;
    }
    if (purchaseItems.length === 0) {
      setError('Please add at least one item to the purchase.');
      return;
    }

    setShowConfirmationModal(true);
  };

  const confirmSubmitPurchase = async () => {
    setShowConfirmationModal(false);
    setSubmitting(true);
    try {
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplier,
          purchaseDate,
          items: purchaseItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
          })),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create purchase');
      }

      setSuccessMessage('Purchase created successfully!');
      // Reset form
      setSelectedSupplier('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setPurchaseItems([]);
      setSearchTerm('');
      setSearchResults([]);
    } catch (err) {
      console.error('Error submitting purchase:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddProductClick = () => {
    setNewProductData({ name: searchTerm }); // Pre-fill name if search term exists
    setIsProductModalOpen(true);
  };

  const handleNewProductAdded = (newProduct) => {
    setIsProductModalOpen(false);
    // Add the newly created product to the purchase items list
    handleAddProductToPurchase(newProduct);
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <Sidebar>
          <main className={`flex-1 p-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            <h1 className="text-2xl font-bold mb-4">Transaksi Pembelian</h1>
            <p>Loading data...</p>
          </main>
        </Sidebar>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <Sidebar>
        <main className={`flex-1 p-4 min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
          <h1 className="text-2xl font-bold mb-6">Transaksi Pembelian</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
              <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError('')}>
                <XCircle className="h-5 w-5 text-red-500" />
              </span>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Success!</strong>
              <span className="block sm:inline"> {successMessage}</span>
              <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setSuccessMessage('')}>
                <XCircle className="h-5 w-5 text-green-500" />
              </span>
            </div>
          )}

          <div className={`bg-white p-6 rounded-lg shadow-md mb-6 ${darkMode ? 'bg-gray-900 border-pastel-purple-700' : 'text-gray-900'}`}>
            <h2 className="text-xl font-semibold mb-4">Detail Pembelian</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="supplier" className="block text-sm font-medium mb-1">Supplier</label>
                <select
                  id="supplier"
                  className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="purchaseDate" className="block text-sm font-medium mb-1">Tanggal Pembelian</label>
                <input
                  type="date"
                  id="purchaseDate"
                  className={`w-full p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-4">Tambah Produk</h2>
            <form onSubmit={handleSearchProducts} className="flex flex-wrap gap-2 mb-4">
              <input
                type="text"
                ref={searchInputRef}
                className={`flex-1 p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                placeholder="Search product by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className={`p-2 rounded-md ${darkMode ? 'bg-pastel-purple-700 hover:bg-pastel-purple-600 text-white' : 'bg-pastel-purple-500 hover:bg-pastel-purple-600'} text-white w-full sm:w-auto`}
              >
                <Search size={20} />
              </button>
              <button
                type="button"
                onClick={handleAddProductClick}
                className={`p-2 rounded-md ${darkMode ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto'}`}
              >
                <Plus size={20} /> Add New Product
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className={`border rounded-md mb-4 max-h-60 overflow-y-auto ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                <ul className="divide-y">
                  {searchResults.map(product => (
                    <li
                      key={product.id}
                      className={`p-2 cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      onClick={() => handleAddProductToPurchase(product)}
                    >
                      {product.name} ({product.productCode}) - Stock: {product.stock}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <h2 className="text-xl font-semibold mb-4">Item Pembelian</h2>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={darkMode ? 'bg-gray-900' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-pastel-purple-300' : 'text-gray-500'}`}>Produk</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-pastel-purple-300' : 'text-gray-500'}`}>Kode</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-pastel-purple-300' : 'text-gray-500'}`}>Kuantitas</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-pastel-purple-300' : 'text-gray-500'}`}>Harga Beli</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-pastel-purple-300' : 'text-gray-500'}`}>Subtotal</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-pastel-purple-300' : 'text-gray-500'}`}>Aksi</th>
                  </tr>
                </thead>
                <tbody className={darkMode ? 'divide-gray-700 bg-gray-950' : 'divide-gray-200 bg-white'}>
                  {purchaseItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" className={`px-6 py-4 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No items added yet.
                      </td>
                    </tr>
                  ) : (
                    purchaseItems.map((item, index) => (
                      <tr key={item.productId} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.productName}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{item.productCode}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            className={`w-20 p-1 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <input
                            type="number"
                            min="0"
                            value={item.purchasePrice}
                            onChange={(e) => handlePurchasePriceChange(index, e.target.value)}
                            className={`w-28 p-1 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                          />
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className={`text-red-600 hover:text-red-900 ${darkMode ? 'hover:text-red-400' : ''}`}
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end items-center mb-6">
              <span className="text-lg font-bold mr-2">Total Pembelian:</span>
              <span className="text-2xl font-bold text-pastel-purple-500">
                Rp {calculateTotalPurchase().toLocaleString('id-ID')}
              </span>
            </div>

            <button
              onClick={handleSubmitPurchase}
              disabled={submitting}
              className={`w-full py-3 rounded-md text-lg font-semibold transition-colors ${
                submitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : `${darkMode ? 'bg-pastel-purple-700 hover:bg-pastel-purple-600' : 'bg-pastel-purple-500 hover:bg-pastel-purple-600'} text-white`
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Pembelian'}
            </button>
          </div>

          <ConfirmationModal
            isOpen={showConfirmationModal}
            onClose={() => setShowConfirmationModal(false)}
            onConfirm={confirmSubmitPurchase}
            title="Konfirmasi Pembelian"
            message="Are you sure you want to submit this purchase transaction?"
            darkMode={darkMode}
          />

          {isProductModalOpen && (
            <ProductModal
              isOpen={isProductModalOpen}
              onClose={() => setIsProductModalOpen(false)}
              onSuccess={handleNewProductAdded}
              initialData={newProductData}
              darkMode={darkMode}
            />
          )}
        </main>
      </Sidebar>
    </ProtectedRoute>
  );
}