// app/login/loginForm.js
'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ROLES } from '../../lib/constants';
import LoadingSpinner from '@/components/LoadingSpinner'; // Import LoadingSpinner

export default function LoginForm({ role: forcedRole = null }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegisterManager, setShowRegisterManager] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Check if a manager account exists to conditionally show the register button
  useEffect(() => {
    // Only run this on the client after session status is resolved
    if (status !== 'loading') {
      const checkManager = async () => {
        try {
          const response = await fetch('/api/check-manager');
          const data = await response.json();
          if (!data.exists) {
            setShowRegisterManager(true);
          }
        } catch (err) {
          console.error("Failed to check for manager account:", err);
        }
      };
      checkManager();
    }
  }, [status]); // Dependency on status to ensure it runs after session is known

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      setLoading(true); // Indicate loading while redirecting
      const { role, isGlobalRole, storeId } = session.user;

      // Redirect based on role
      if (role === ROLES.MANAGER) {
        router.push('/manager'); // Manager goes to manager dashboard directly
      } else if (role === ROLES.WAREHOUSE) {
        router.push('/warehouse');
      } else if (role === ROLES.ADMIN || role === ROLES.CASHIER || role === ROLES.ATTENDANT) {
        if (!isGlobalRole && !storeId) {
          router.push('/select-store');
        } else {
          if (role === ROLES.ADMIN) {
            router.push('/admin');
          } else if (role === ROLES.CASHIER) {
            router.push('/kasir');
          } else if (role === ROLES.ATTENDANT) {
            router.push('/pelayan');
          }
        }
      }
    }
  }, [session, status, router]);

  // Render LoadingSpinner if session is still loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Username atau password salah');
      return;
    }
    // The useEffect will handle the redirect upon successful login
  };

  // Jika role dipaksa (dari halaman login spesifik), tampilkan judul khusus
  const getTitle = () => {
    if (forcedRole === ROLES.MANAGER) {
      return "Login Manager";
    } else if (forcedRole === ROLES.WAREHOUSE) {
      return "Login Warehouse";
    } else if (forcedRole === ROLES.ADMIN) {
      return "Login Admin Toko";
    } else if (forcedRole === ROLES.CASHIER) {
      return "Login Kasir";
    } else if (forcedRole === ROLES.ATTENDANT) {
      return "Login Pelayan";
    }
    return "Login";
  };

  const getSubtitle = () => {
    if (forcedRole === ROLES.MANAGER) {
      return "Masuk sebagai Manager (akses semua toko)";
    } else if (forcedRole === ROLES.WAREHOUSE) {
      return "Masuk sebagai Warehouse (akses gudang pusat)";
    } else if (forcedRole === ROLES.ADMIN) {
      return "Masuk sebagai Admin (akses toko tertentu)";
    }
    return "Masuk ke akun Anda";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-theme-purple-50 to-theme-purple-100 p-4">
      <div className="max-w-md w-full space-y-8 card-theme-purple">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-theme-purple-700">{getTitle()}</h2>
          <p className="mt-2 text-theme-purple-600">{getSubtitle()}</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-theme-purple-500 focus:border-theme-purple-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                disabled={loading || status === 'authenticated'}
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-theme-purple-500 focus:border-theme-purple-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                disabled={loading || status === 'authenticated'}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || status === 'authenticated'}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-theme-purple-500 hover:bg-theme-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-purple-500 disabled:bg-gray-400"
            >
              {loading || status === 'authenticated' ? 'Mengalihkan...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            {showRegisterManager && (
              <p className="mb-2">
                Belum ada Akun Manager?{' '}
                <Link href="/register-manager" className="font-medium text-theme-purple-600 hover:text-theme-purple-800">
                  Daftar di sini
                </Link>
              </p>
            )}
            <Link href="/" className="text-theme-purple-600 hover:text-theme-purple-800">
              Kembali ke halaman utama
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}