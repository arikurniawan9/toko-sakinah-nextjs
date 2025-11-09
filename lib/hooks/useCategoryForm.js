import { useState } from 'react';

export const useCategoryForm = (fetchCategories) => {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const openModalForEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setShowModal(true);
  };

  const openModalForCreate = () => {
    console.log('openModalForCreate called');
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Nama kategori harus diisi');
      return;
    }

    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const endpoint = '/api/kategori';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingCategory?.id,
          name: formData.name.trim(),
          description: formData.description.trim() || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (editingCategory ? 'Gagal mengupdate kategori' : 'Gagal menambahkan kategori'));
      }

      await response.json();
      
      closeModal();
      fetchCategories();
      setSuccess(editingCategory ? 'Kategori berhasil diperbarui' : 'Kategori berhasil ditambahkan');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Terjadi kesalahan: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  return {
    showModal,
    editingCategory,
    formData,
    error,
    success,
    handleInputChange,
    openModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave,
    setError,
    setSuccess,
  };
};