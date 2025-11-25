// lib/hooks/useSupplierForm.js
import { useState, useEffect } from 'react';

export const useSupplierForm = (fetchSuppliers) => {
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

    if (!editingSupplier && !formData.code.trim()) {
      setError('Kode supplier harus diisi');
      return { success: false };
    }

    try {
      if (editingSupplier) {
        // Update existing supplier
        const response = await fetch(`/api/supplier/${editingSupplier.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
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
          throw new Error(errorData.error || 'Gagal mengupdate supplier');
        }

        const responseData = await response.json();
        console.log('Update response:', responseData); // Debug log

        closeModal();
        fetchSuppliers(); // Refresh data in the table
        return { success: true };
      } else {
        // Create new supplier
        const response = await fetch('/api/supplier', {
          method: 'POST',
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
          throw new Error(errorData.error || 'Gagal menambahkan supplier');
        }

        const responseData = await response.json();
        console.log('Create response:', responseData); // Debug log

        closeModal();
        fetchSuppliers(); // Refresh data in the table
        return { success: true };
      }
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
