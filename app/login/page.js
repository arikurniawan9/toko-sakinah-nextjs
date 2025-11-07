// app/login/page.js
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState('ADMIN'); // Default to ADMIN
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid username or password');
      return;
    }

    // Check if the user has the expected role
    const response = await fetch('/api/auth/check-role');
    const data = await response.json();
    
    if (data.role === role) {
      router.push(callbackUrl);
      router.refresh();
    } else {
      setError(`Access denied. ${role}s only.`);
    }
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
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                name="role"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-pastel-purple-500 focus:border-pastel-purple-500 focus:z-10 sm:text-sm"
              >
                <option value="ADMIN">Admin</option>
                <option value="CASHIER">Kasir</option>
                <option value="ATTENDANT">Pelayan</option>
              </select>
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
                placeholder="Username"
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
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pastel-purple-500 hover:bg-pastel-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-purple-500"
            >
              Sign in
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