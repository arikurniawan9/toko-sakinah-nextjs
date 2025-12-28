// lib/hooks/useSupplierForm.js
import { useState, useEffect } from 'react';

export const useSupplierForm = (fetchSuppliers, { scope } = {}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contactPerson: '',
    address: '',
    phone: '',
    email: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingSupplier) {
      setFormData({
        code: editingSupplier.code,
        name: editingSupplier.name,
        contactPerson: editingSupplier.contactPerson || '',
        address: editingSupplier.address || '',
        phone: editingSupplier.phone || '',
        email: editingSupplier.email || ''
      });
    } else {
      setFormData({ code: '', name: '', contactPerson: '', address: '', phone: '', email: '' });
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
    setFormData({ code: '', name: '', contactPerson: '', address: '', phone: '', email: '' });
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
    setFormData({ code: '', name: '', contactPerson: '', address: '', phone: '', email: '' });
    setError('');
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Nama supplier harus diisi');
      return { success: false };
    }

    if (!editingSupplier && !formData.code.trim()) {
      setError('Kode supplier harus diisi');
      return { success: false };
    }

    // Validasi panjang nomor telepon
    if (formData.phone && formData.phone.trim() !== '' && formData.phone.trim().length > 13) {
      setError('Nomor telepon maksimal 13 karakter');
      return { success: false };
    }

    try {
      // Determine endpoint based on scope
      let endpoint, method;
      if (scope === 'warehouse') {
        if (editingSupplier) {
          endpoint = `/api/warehouse/suppliers/${editingSupplier.id}`;
          method = 'PUT';
        } else {
          endpoint = '/api/warehouse/suppliers';
          method = 'POST';
        }
      } else {
        if (editingSupplier) {
          endpoint = `/api/supplier/${editingSupplier.id}`;
          method = 'PUT';
        } else {
          endpoint = '/api/supplier';
          method = 'POST';
        }
      }

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formData.code.trim(),
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          contactPerson: formData.contactPerson.trim() || null
        })
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonErr) {
          // If response is not JSON, create a generic error
          errorData = { error: `HTTP Error ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || 'Gagal menyimpan supplier');
      }

      const responseData = await response.json();
      console.log(`${method === 'PUT' ? 'Update' : 'Create'} response:`, responseData); // Debug log

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
