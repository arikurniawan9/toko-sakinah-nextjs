import { useState } from 'react';

export const useUserForm = (refreshData, defaultRole = '') => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    code: '',
    employeeNumber: '',
    role: defaultRole,
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openModalForCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      username: '',
      code: '',
      employeeNumber: '',
      role: defaultRole,
      password: '',
    });
    setError('');
    setShowModal(true);
  };

  const openModalForEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      username: user.username || '',
      code: user.code || '',
      employeeNumber: user.employeeNumber || '',
      role: user.role || '',
      password: '', // Don't populate password for editing
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nama wajib diisi');
      return false;
    }
    
    if (!formData.username.trim()) {
      setError('Username wajib diisi');
      return false;
    }
    
    if (!editingUser && !formData.password.trim()) {
      setError('Password wajib diisi');
      return false;
    }
    
    if (!formData.role) {
      setError('Role wajib dipilih');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      let response;
      const url = editingUser ? `/api/store-users/${editingUser.id}` : '/api/store-users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const userData = {
        name: formData.name.trim(),
        username: formData.username.trim(),
        employeeNumber: formData.employeeNumber ? formData.employeeNumber.trim() : null,
        code: formData.code ? formData.code.trim() : null,
        role: formData.role,
      };

      // Only include password if it's a new user or if it was provided for updating
      if (formData.password.trim()) {
        userData.password = formData.password;
      }

      response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Gagal ${editingUser ? 'memperbarui' : 'membuat'} user`);
      }

      setSuccess(editingUser ? 'User berhasil diperbarui' : 'User berhasil dibuat');
      
      // Close modal after success
      setTimeout(() => {
        closeModal();
        refreshData && refreshData();
      }, 1000);
    } catch (err) {
      setError(err.message);
      console.error(`Error ${editingUser ? 'updating' : 'creating'} user:`, err);
    }
  };

  return {
    showModal,
    editingUser,
    formData,
    setFormData,
    error,
    success,
    setError,
    setSuccess,
    handleInputChange,
    openModalForEdit,
    openModalForCreate,
    closeModal,
    handleSave,
  };
};