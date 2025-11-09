// app/kasir/profile/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Sidebar from '../../../components/Sidebar';
import { useDarkMode } from '../../../components/DarkModeContext';
import { User } from 'lucide-react';

export default function CashierProfile() {
  const { data: session, update: updateSession } = useSession();
  const { darkMode } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '', // Display only, not editable
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || '',
      }));
    }
  }, [session]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Kata sandi dan konfirmasi kata sandi tidak cocok.');
      setLoading(false);
      return;
    }

    try {
      const payload = { name: formData.name };
      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Profil berhasil diperbarui!');
        // Update session data if name changed
        if (session?.user?.name !== formData.name) {
          await updateSession({ user: { name: formData.name } });
        }
        // Clear password fields after successful update
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Gagal memperbarui profil.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Terjadi kesalahan saat memperbarui profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="CASHIER">
      <Sidebar>
        <main className={`flex-1 p-4 min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
          <div className="p-4">
            <p>Minimal test content inside main</p>
          </div>
        </main>
      </Sidebar>
    </ProtectedRoute>
  );
}
