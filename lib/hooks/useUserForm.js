import { useState } from 'react';
import { ROLES } from '../constants';

export const useUserForm = (refreshData, options = {}) => {
  const {
    defaultRole = '',
    apiEndpoint: defaultApiEndpoint = '/api/store-users',
    isManagerContext = false,
    isWarehouseContext = false,
    currentStoreId, // New: current store ID passed from parent
    isAttendantForm = false, // New: flag to indicate if this form is for attendants
  } = options;

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    code: '',
    employeeNumber: '',
    role: defaultRole,
    password: '',
    address: '',
    phone: '',
    storeId: '',
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

  const openModalForCreate = (overrides = {}) => {
    setEditingUser(null);
    setFormData({
      name: '',
      username: '',
      code: '',
      employeeNumber: '',
      role: overrides.role || defaultRole,
      password: '',
      address: '',
      phone: '',
      storeId: (isWarehouseContext || isAttendantForm) ? (overrides.storeId || currentStoreId || '') : '', // Auto-fill storeId if in warehouse context or attendant form
    });
    setError('');
    setShowModal(true);
  };

  const openModalForEdit = (user, isAttendantForm = false) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      username: user.username || '',
      code: user.code || '',
      employeeNumber: user.employeeNumber || '',
      role: isAttendantForm ? 'ATTENDANT' : user.role || '',
      password: '',
      address: user.address || '',
      phone: user.phone || '',
      // If user is associated with stores, pre-select the first one.
      storeId: isWarehouseContext ? user.storeId || '' : (user.stores && user.stores.length > 0 ? user.stores[0].id : ''),
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

    if (isManagerContext && formData.role !== ROLES.MANAGER && formData.role !== ROLES.WAREHOUSE && !formData.storeId) {
      setError('Toko wajib dipilih untuk role selain Manager');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      let apiEndpoint = defaultApiEndpoint;
      const isStoreSpecificRole = formData.role !== ROLES.MANAGER;

      if (isManagerContext) {
        apiEndpoint = isStoreSpecificRole ? '/api/store-users' : '/api/manager/users';
      } else if (isWarehouseContext) {
        apiEndpoint = '/api/warehouse/users';
      }

      const url = editingUser ? `${apiEndpoint}/${editingUser.id}` : apiEndpoint;
      const method = editingUser ? 'PUT' : 'POST';

      const userData = {
        name: formData.name.trim(),
        username: formData.username.trim(),
        employeeNumber: formData.employeeNumber ? formData.employeeNumber.trim() : null,
        code: formData.code ? formData.code.trim() : null,
        role: formData.role,
        address: formData.address,
        phone: formData.phone,
      };

      if (isManagerContext && isStoreSpecificRole && formData.role !== 'WAREHOUSE') {
        userData.storeId = formData.storeId;
      } else if (isAttendantForm && !editingUser) { // If it's an attendant form and creating a new user
        userData.storeId = currentStoreId;
      }

      if (editingUser) {
        userData.id = editingUser.id;
      }

      if (formData.password.trim()) {
        userData.password = formData.password;
      }

      const response = await fetch(url, {
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