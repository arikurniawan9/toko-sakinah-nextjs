// lib/hooks/useSupplierForm.js
import { useState, useEffect } from 'react';

export const useSupplierForm = (fetchSuppliers) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingSupplier) {
      setFormData({
        name: editingSupplier.name,
        address: editingSupplier.address || '',
        phone: editingSupplier.phone || '',
        email: editingSupplier.email || ''
      });
    } else {
      setFormData({ name: '', address: '', phone: '', email: '' });
    }
  }, [editingSupplier]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const openModalForCreate = () => {
    setEditingSupplier(null);
    setFormData({ name: '', address: '', phone: '', email: '' });
    setError('');
    setShowModal(true);
  };

  const openModalForEdit = (supplier) => {
    setEditingSupplier(supplier);
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
    setFormData({ name: '', address: '', phone: '', email: '' });
    setError('');
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Nama supplier harus diisi');
      return { success: false };
    }

    try {
      const method = editingSupplier ? 'PUT' : 'POST';
      const endpoint = '/api/supplier';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingSupplier?.id,
          name: formData.name.trim(),
          address: formData.address.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (editingSupplier ? 'Gagal mengupdate supplier' : 'Gagal menambahkan supplier'));
      }

      await response.json(); // Consume response body
      
      closeModal();
      fetchSuppliers(); // Refresh data in the table
      return { success: true };
    } catch (err) {
      console.error('Error saving supplier:', err);
      setError('Terjadi kesalahan: ' + err.message);
      return { success: false };
    }
  };

  return {
    showModal,
    editingSupplier,
    formData,
    setFormData, // Expose setFormData
    error,
    setError,
    handleInputChange,
    openModalForCreate,
    openModalForEdit,
    closeModal,
    handleSave,
  };
};
