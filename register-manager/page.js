'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/constants';

export default function RegisterManagerPage() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [managerExists, setManagerExists] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Cek apakah sudah ada akun MANAGER
  useEffect(() => {
    if (status === 'loading') return;
    
    const checkManagerExists = async () => {
      try {
        const response = await fetch('/api/check-manager');
        const data = await response.json();
        setManagerExists(data.exists);
        setChecking(false);
      } catch (error) {
        console.error('Error checking manager existence:', error);
        setChecking(false);
      }
    };

    checkManagerExists();
  }, [status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validasi input
    if (!name || !username || !password) {
      setError('Semua field harus diisi');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    try {
      const response = await fetch('/api/register-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          username,
          password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          // Login langsung setelah register
          signIn('credentials', {
            username,
            password,
            redirect: false,
          }).then(() => {
            router.push('/manager');
          });
        }, 2000);
      } else {
        setError(result.error || 'Gagal membuat akun manager');
      }
    } catch (error) {
      setError('Terjadi kesalahan saat membuat akun');
      console.error('Registration error:', error);
    }
  };

  if (status === 'authenticated') {
    if (session.user.role === ROLES.MANAGER) {
      router.push('/manager');
    } else {
      router.push('/unauthorized');
    }
    return null;
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-purple-50 to-pastel-purple-100 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-purple-600 mx-auto"></div>
          <p className="mt-4 text-pastel-purple-700">Memeriksa status akun...</p>
        </div>
      </div>
    );
  }

  if (managerExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-purple-50 to-pastel-purple-100 p-4">
        <div className="max-w-md w-full space-y-8 card-pastel-purple bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-pastel-purple-700">Akses Ditolak</h2>
            <p className="mt-2 text-pastel-purple-600">Akun MANAGER sudah terdaftar</p>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">Sudah ada akun MANAGER di sistem.</p>
            <p className="text-gray-500 text-sm mt-2">Hubungi administrator untuk login.</p>
            
            <button
              onClick={() => router.push('/login')}
              className="mt-6 w-full bg-pastel-purple-500 hover:bg-pastel-purple-600 text-white py-3 px-4 rounded-lg transition duration-200"
            >
              Ke Halaman Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-purple-50 to-pastel-purple-100 p-4">
      <div className="max-w-md w-full space-y-8 card-pastel-purple bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-pastel-purple-700">Daftar Akun Manager</h2>
          <p className="mt-2 text-pastel-purple-600">Buat akun manager pertama untuk sistem</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {success ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">Akun MANAGER berhasil dibuat! Mengalihkan ke dashboard...</span>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pastel-purple-500 focus:border-pastel-purple-500 focus:z-10 sm:text-sm"
                  placeholder="Nama lengkap anda"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pastel-purple-500 focus:border-pastel-purple-500 focus:z-10 sm:text-sm"
                  placeholder="Username untuk login"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pastel-purple-500 focus:border-pastel-purple-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Konfirmasi Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pastel-purple-500 focus:border-pastel-purple-500 focus:z-10 sm:text-sm"
                  placeholder="Konfirmasi password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pastel-purple-500 hover:bg-pastel-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-purple-500"
              >
                Buat Akun Manager
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-sm text-gray-600">
          <button 
            onClick={() => router.push('/login')}
            className="text-pastel-purple-600 hover:text-pastel-purple-800"
          >
            Sudah punya akun? Login
          </button>
        </div>
      </div>
    </div>
  );
}