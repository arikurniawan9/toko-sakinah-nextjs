// lib/hooks/useMemberForm.js
import { useState, useEffect } from 'react';

export const useMemberForm = (fetchMembers) => {
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    membershipType: 'silver',
    discount: 3
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (editingMember) {
      setFormData({
        name: editingMember.name,
        phone: editingMember.phone || '',
        address: editingMember.address || '',
        membershipType: editingMember.membershipType,
        discount: editingMember.discount
      });
    } else {
      setFormData({ name: '', phone: '', address: '', membershipType: 'silver', discount: 3 });
    }
  }, [editingMember]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'discount' ? parseInt(value) : value
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const openModalForCreate = () => {
    setEditingMember(null);
    setFormData({ name: '', phone: '', address: '', membershipType: 'silver', discount: 3 });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const openModalForEdit = (member) => {
    setEditingMember(member);
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMember(null);
    setFormData({ name: '', phone: '', address: '', membershipType: 'silver', discount: 3 });
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Nama member harus diisi');
      return;
    }

    try {
      const method = editingMember ? 'PUT' : 'POST';
      const endpoint = '/api/member';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingMember?.id,
          name: formData.name.trim(),
          phone: formData.phone?.trim() || null,
          address: formData.address?.trim() || null,
          membershipType: formData.membershipType,
          discount: parseInt(formData.discount) || 3
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (editingMember ? 'Gagal mengupdate member' : 'Gagal menambahkan member'));
      }

      await response.json(); // Consume response body
      
      closeModal();
      fetchMembers(); // Refresh data in the table
      setSuccess(editingMember ? 'Member berhasil diperbarui' : 'Member berhasil ditambahkan');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving member:', err);
      setError('Terjadi kesalahan: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  return {
    showModal,
    editingMember,
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
