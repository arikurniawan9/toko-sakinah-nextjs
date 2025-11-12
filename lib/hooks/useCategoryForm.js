import { useState } from 'react';

export const useCategoryForm = (fetchCategories) => {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const openModalForEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
    });
    setShowModal(true);
  };

  const openModalForCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', icon: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', icon: '' });
    setError('');
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Nama kategori harus diisi');
      return { success: false };
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
          description: formData.description.trim() || null,
          icon: formData.icon || null,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (editingCategory ? 'Gagal mengupdate kategori' : 'Gagal menambahkan kategori'));
      }

      await response.json();
      
      closeModal();
      fetchCategories();
      return { success: true };
    } catch (err) {
      setError('Terjadi kesalahan: ' + err.message);
      return { success: false };
    }
  };

  return {
    showModal,
    editingCategory,
    formData,
    setFormData, // Expose setFormData
    error,
    setError,
    handleInputChange,
    openModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave,
  };
};