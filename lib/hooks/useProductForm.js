// lib/hooks/useProductForm.js
import { useState } from 'react';

const initialFormData = {
  name: '',
  productCode: '',
  stock: '',
  categoryId: '',
  supplierId: '',
  description: '',
  purchasePrice: '',
  priceTiers: [
    { minQty: '1', maxQty: '', price: '' }
  ],
};

export function useProductForm(fetchProductsCallback) {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleTierChange = (index, field, value) => {
    const updatedTiers = [...formData.priceTiers];
    updatedTiers[index][field] = value;
    setFormData(prev => ({ ...prev, priceTiers: updatedTiers }));
  };

  const addTier = () => {
    const lastTier = formData.priceTiers[formData.priceTiers.length - 1];
    const newMinQty = lastTier.maxQty ? parseInt(lastTier.maxQty) + 1 : '';
    setFormData(prev => ({
      ...prev,
      priceTiers: [...prev.priceTiers, { minQty: newMinQty.toString(), maxQty: '', price: '' }]
    }));
  };

  const removeTier = (index) => {
    if (formData.priceTiers.length <= 1) return; // Must have at least one tier
    const updatedTiers = formData.priceTiers.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, priceTiers: updatedTiers }));
  };

  const openModalForEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      productCode: product.productCode,
      stock: product.stock,
      categoryId: product.categoryId,
      supplierId: product.supplierId,
      description: product.description || '',
      purchasePrice: product.purchasePrice,
      priceTiers: product.priceTiers.length > 0 ? product.priceTiers.map(t => ({
        minQty: t.minQty.toString(),
        maxQty: t.maxQty?.toString() || '',
        price: t.price.toString(),
      })) : [{ minQty: '1', maxQty: '', price: '' }],
    });
    setShowModal(true);
  };

  const openModalForCreate = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(initialFormData);
    setError('');
    setSuccess('');
  };

  const handleSave = async (onSuccessCallback = null) => {
    if (!formData.name.trim() || !formData.productCode.trim()) {
      setError('Nama dan kode produk harus diisi');
      return;
    }
    if (!formData.categoryId) {
      setError('Kategori harus dipilih');
      return;
    }
    // Supplier tidak wajib lagi, jadi validasi ini dihapus
    if (formData.priceTiers.some(t => !t.minQty || !t.price)) {
      setError('Setiap tingkatan harga harus memiliki "Jumlah Min" dan "Harga"');
      return;
    }

    try {
      const method = editingProduct ? 'PUT' : 'POST';
      const endpoint = '/api/produk';

      // Pastikan nilai numerik dalam format yang benar untuk priceTiers
      const { priceTiers, ...productData } = formData;

      // Konversi nilai string ke number sebelum mengirim ke API
      const processedPriceTiers = priceTiers.map(tier => ({
        minQty: parseInt(tier.minQty) || 0,
        maxQty: tier.maxQty ? parseInt(tier.maxQty) : null,
        price: parseInt(tier.price) || 0
      }));

      // Konversi nilai numerik lainnya
      const processedProductData = {
        ...productData,
        stock: parseInt(productData.stock) || 0,
        purchasePrice: parseInt(productData.purchasePrice) || 0,
      };

      const body = {
        ...processedProductData,
        id: editingProduct?.id,
        priceTiers: processedPriceTiers
      };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (editingProduct ? 'Gagal mengupdate produk' : 'Gagal menambahkan produk'));
      }

      const resultProduct = await response.json(); // Get the created/updated product

      closeModal();
      if (onSuccessCallback) {
        onSuccessCallback(resultProduct); // Pass the new product to the callback
      } else {
        await fetchProductsCallback(); // Only refresh if not using a specific success callback
      }
      setSuccess(editingProduct ? 'Produk berhasil diperbarui' : 'Produk berhasil ditambahkan');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Terjadi kesalahan: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  return {
    showModal,
    editingProduct,
    formData,
    error,
    success,
    handleInputChange,
    handleTierChange,
    addTier,
    removeTier,
    openModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave,
    setError,
    setSuccess
  };
}
