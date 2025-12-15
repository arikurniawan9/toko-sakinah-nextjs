// lib/hooks/usePelayanForm.js
import { useState, useEffect } from 'react';

export const usePelayanForm = (fetchAttendants) => {
  const [showModal, setShowModal] = useState(false);
  const [editingAttendant, setEditingAttendant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    gender: '',
    phone: '',
    address: '',
    status: 'AKTIF',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (editingAttendant) {
      setFormData({
        name: editingAttendant.name || '',
        username: editingAttendant.username || '',
        password: '', // Never pre-fill password
        gender: editingAttendant.gender || '',
        phone: editingAttendant.phone || '',
        address: editingAttendant.address || '',
        status: editingAttendant.status || 'AKTIF',
      });
    } else {
      setFormData({
        name: '',
        username: '',
        password: '',
        gender: '',
        phone: '',
        address: '',
        status: 'AKTIF',
      });
    }
  }, [editingAttendant]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const openModalForCreate = () => {
    setEditingAttendant(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      gender: '',
      phone: '',
      address: '',
      status: 'AKTIF',
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const openModalForEdit = (attendant) => {
    setEditingAttendant(attendant);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAttendant(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      gender: '',
      phone: '',
      address: '',
      status: 'AKTIF',
    });
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.username.trim()) {
      setError('Nama dan username wajib diisi');
      return;
    }
    if (!editingAttendant && !formData.password.trim()) { // Password required for new user
      setError('Password wajib diisi untuk pelayan baru');
      return;
    }

    try {
      // Use store-users endpoint for consistency with other store user operations
      const method = editingAttendant ? 'PUT' : 'POST';
      const endpoint = '/api/store-users';

      const payload = {
        id: editingAttendant?.id,
        name: formData.name.trim(),
        username: formData.username.trim(),
        employeeNumber: formData.employeeNumber,
        gender: formData.gender,
        phone: formData.phone,
        address: formData.address,
        status: formData.status,
        role: 'ATTENDANT', // Ensure role is set to ATTENDANT
        code: formData.code, // Include code if available
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
        throw new Error(errorData.error || (editingAttendant ? 'Gagal mengupdate pelayan' : 'Gagal menambahkan pelayan'));
      }

      await response.json(); // Consume response body

      closeModal();
      fetchAttendants(); // Refresh data in the table
      setSuccess(editingAttendant ? 'Pelayan berhasil diperbarui' : 'Pelayan berhasil ditambahkan');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving attendant:', err);
      setError('Terjadi kesalahan: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  return {
    showModal,
    editingAttendant,
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
