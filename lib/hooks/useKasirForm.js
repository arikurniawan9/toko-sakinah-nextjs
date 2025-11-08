// lib/hooks/useKasirForm.js
import { useState, useEffect } from 'react';

export const useKasirForm = (fetchCashiers) => {
  const [showModal, setShowModal] = useState(false);
  const [editingCashier, setEditingCashier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (editingCashier) {
      setFormData({
        name: editingCashier.name,
        username: editingCashier.username,
        password: '' // Never pre-fill password for security
      });
    } else {
      setFormData({ name: '', username: '', password: '' });
    }
  }, [editingCashier]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const openModalForCreate = () => {
    setEditingCashier(null);
    setFormData({ name: '', username: '', password: '' });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const openModalForEdit = (cashier) => {
    setEditingCashier(cashier);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCashier(null);
    setFormData({ name: '', username: '', password: '' });
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.username.trim()) {
      setError('Nama dan username harus diisi');
      return;
    }
    if (!editingCashier && !formData.password.trim()) { // Password required for new user
      setError('Password harus diisi untuk kasir baru');
      return;
    }

    try {
      const method = editingCashier ? 'PUT' : 'POST';
      const endpoint = '/api/kasir';
      
      const payload = {
        id: editingCashier?.id,
        name: formData.name.trim(),
        username: formData.username.trim(),
        role: 'CASHIER' // Ensure role is set to CASHIER
      };

      // Only include password if it's being set (for new user or password change)
      if (formData.password) {
        payload.password = formData.password.trim();
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (editingCashier ? 'Gagal mengupdate kasir' : 'Gagal menambahkan kasir'));
      }

      await response.json(); // Consume response body
      
      closeModal();
      fetchCashiers(); // Refresh data in the table
      setSuccess(editingCashier ? 'Kasir berhasil diperbarui' : 'Kasir berhasil ditambahkan');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving cashier:', err);
      setError('Terjadi kesalahan: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  return {
    showModal,
    editingCashier,
    formData,
    error,
    success,
    handleInputChange,
    openModalForCreate,
    openModalForEdit,
    closeModal,
    handleSave,
    setError,
    setSuccess,
  };
};
