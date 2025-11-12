// app/login/loginForm.js
'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ROLES } from '../../lib/constants';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      setLoading(true); // Show loading feedback
      const { role } = session.user;
      // Redirect based on role
      if (role === ROLES.ADMIN) {
        router.push('/admin');
      } else if (role === ROLES.CASHIER) {
        router.push('/kasir');
      } else if (role === ROLES.ATTENDANT) {
        router.push('/pelayan');
      }
      // No need to refresh, push will trigger a re-render
    }
  }, [session, status, router]);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-purple-50 to-pastel-purple-100 p-4">
      <div className="max-w-md w-full space-y-8 card-pastel-purple">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-pastel-purple-700">Login</h2>
          <p className="mt-2 text-pastel-purple-600">Masuk ke akun Anda</p>
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
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pastel-purple-500 focus:border-pastel-purple-500 focus:z-10 sm:text-sm"
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
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pastel-purple-500 focus:border-pastel-purple-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                disabled={loading || status === 'authenticated'}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || status === 'authenticated'}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pastel-purple-500 hover:bg-pastel-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-purple-500 disabled:bg-gray-400"
            >
              {loading || status === 'authenticated' ? 'Mengalihkan...' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-center text-sm text-gray-600">
            <Link href="/" className="text-pastel-purple-600 hover:text-pastel-purple-800">
              Kembali ke halaman utama
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}