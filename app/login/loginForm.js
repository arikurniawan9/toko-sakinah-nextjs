'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ROLES } from '../../lib/constants';
import LoadingSpinner from '@/components/LoadingSpinner'; // Import LoadingSpinner

export default function LoginForm({ role: forcedRole = null }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegisterManager, setShowRegisterManager] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Check for user lockout status on page load
  useEffect(() => {
    const checkLockout = async () => {
      try {
        // Use a more realistic identifier - this could be IP address or username
        // In a real app, you might want to get the actual IP from server headers
        const response = await fetch('/api/throttle-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'check',
            identifier: 'user_' + (username || 'default') // Use username as identifier if available, otherwise default
          })
        });
        const { isLocked, timeRemaining } = await response.json();

        if (isLocked) {
          setLockoutTime(timeRemaining);
          // Set timer to update lockout time
          const timer = setInterval(() => {
            setLockoutTime(prev => {
              if (prev <= 1000) {
                clearInterval(timer);
                return 0;
              }
              return prev - 1000;
            });
          }, 1000);
        }
      } catch (err) {
        console.error("Failed to check lockout status:", err);
      }
    };

    checkLockout();
  }, [username]);

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
        // For non-global roles, redirect to their respective dashboards
        // The dashboard page will handle cases where user doesn't have store access
        if (role === ROLES.ADMIN) {
          router.push('/admin');
        } else if (role === ROLES.CASHIER) {
          router.push('/kasir');
        } else if (role === ROLES.ATTENDANT) {
          router.push('/pelayan');
        }
      }
    }
  }, [session, status, router]);

  // Render LoadingSpinner if session is still loading or component is not mounted yet
  if (status === 'loading' || !isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!username.trim()) {
      setError('Username harus diisi');
      return;
    }

    if (!password) {
      setError('Password harus diisi');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    // Check username format (alphanumeric and underscore only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username hanya boleh mengandung huruf, angka, dan underscore');
      return;
    }

    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      // In the new implementation, throttling is handled in authOptions
      // So we just need to check if the error message indicates lockout
      if (result.error.includes('diblokir')) {
        // Fetch updated lockout status
        try {
          const response = await fetch('/api/throttle-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'check',
              identifier: username // Use actual username as identifier
            })
          });
          const { timeRemaining } = await response.json();
          setLockoutTime(timeRemaining);
        } catch (err) {
          console.error("Error fetching lockout status:", err);
          // Fallback to parsing time from error message
          const timeMatch = result.error.match(/(\d+)\s+menit/);
          if (timeMatch) {
            setLockoutTime(parseInt(timeMatch[1]) * 60 * 1000); // Convert minutes to milliseconds
          }
        }
        setError(result.error);
      } else {
        setError(result.error || 'Username atau password salah.');
      }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-theme-purple-100 via-theme-purple-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-theme-purple-200/50 dark:border-gray-700 dark:bg-gray-800/80">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-theme-purple-500 to-indigo-600 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="mt-4 text-3xl font-bold bg-gradient-to-r from-theme-purple-600 to-indigo-600 bg-clip-text text-transparent dark:from-theme-purple-400 dark:to-indigo-400">{getTitle()}</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">{getSubtitle()}</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg transition-all duration-300" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-lg shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-theme-purple-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500 focus:z-10 sm:text-sm transition-all"
                  placeholder="Masukkan username"
                  disabled={loading || status === 'authenticated'}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-theme-purple-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 pl-10 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-purple-500 focus:border-theme-purple-500 focus:z-10 sm:text-sm transition-all"
                  placeholder="Masukkan password"
                  disabled={loading || status === 'authenticated'}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-theme-purple-600 focus:ring-theme-purple-500 dark:focus:ring-theme-purple-400 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Ingat saya
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-theme-purple-600 hover:text-theme-purple-500 dark:text-theme-purple-400 dark:hover:text-theme-purple-300 transition-colors">
                Lupa password?
              </Link>
            </div>
          </div>

          {/* Display lockout time if applicable */}
          {lockoutTime > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 px-4 py-3 rounded-lg transition-all duration-300" role="alert">
              <div className="flex items-start">
                <svg className="h-5 w-5 mr-2 mt-0.5 text-orange-500 dark:text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>
                  Terlalu banyak percobaan login gagal. Akun Anda diblokir selama 15 menit.
                  Silakan coba lagi dalam {Math.ceil(lockoutTime / 1000)} detik.
                </span>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || status === 'authenticated'}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-theme-purple-500 to-indigo-600 hover:from-theme-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-purple-500 disabled:bg-gray-400 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {loading || status === 'authenticated' ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Mengalihkan...
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Masuk
                </span>
              )}
            </button>
          </div>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {showRegisterManager && (
              <p className="mb-2">
                Belum ada Akun Manager?{' '}
                <Link href="/register-manager" className="font-medium text-theme-purple-600 hover:text-theme-purple-500 dark:text-theme-purple-400 dark:hover:text-theme-purple-300 transition-colors">
                  Daftar di sini
                </Link>
              </p>
            )}
            <Link href="/" className="text-theme-purple-600 hover:text-theme-purple-500 dark:text-theme-purple-400 dark:hover:text-theme-purple-300 transition-colors">
              Kembali ke halaman utama
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}