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

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.productCode.trim()) {
      setError('Nama dan kode produk harus diisi');
      return;
    }
    if (formData.priceTiers.some(t => !t.minQty || !t.price)) {
      setError('Setiap tingkatan harga harus memiliki "Jumlah Min" dan "Harga"');
      return;
    }

    try {
      const method = editingProduct ? 'PUT' : 'POST';
      const endpoint = '/api/produk';
      
      const { priceTiers, ...productData } = formData;

      const body = {
        ...productData,
        id: editingProduct?.id,
        priceTiers: priceTiers.map(t => ({
          minQty: parseInt(t.minQty),
          maxQty: t.maxQty ? parseInt(t.maxQty) : null,
          price: parseInt(t.price)
        }))
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

      closeModal();
      await fetchProductsCallback(); // Refresh data
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
