// components/AppHeader.js
'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useUserTheme } from './UserThemeContext';
import SearchBar from './SearchBar';
import Link from 'next/link';
import { ROLES } from '@/lib/constants';
import { Sun, Moon, ShoppingCart, User, LogOut, Menu, X } from 'lucide-react';
import { useNotification } from './notifications/NotificationProvider';

const AppHeader = ({ darkModeOverride = null }) => {
  const { data: session, status } = useSession();
  const { userTheme: { darkMode }, toggleDarkMode } = useUserTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [dynamicDarkMode, setDynamicDarkMode] = useState(darkMode);

  // Gunakan override jika diberikan, jika tidak gunakan dari context
  useEffect(() => {
    if (darkModeOverride !== null) {
      setDynamicDarkMode(darkModeOverride);
    } else {
      setDynamicDarkMode(darkMode);
    }
  }, [darkModeOverride, darkMode]);

  // Fungsi untuk menangani klik di luar menu pengguna
  useEffect(() => {
    const handleClickOutside = (event) => {
      const userMenu = document.getElementById('user-menu');
      if (isUserMenuOpen && userMenu && !userMenu.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const getDashboardUrl = () => {
    if (!session?.user?.role) return '/login';

    switch (session.user.role) {
      case ROLES.MANAGER:
        return '/manager';
      case ROLES.WAREHOUSE:
        return '/warehouse';
      case ROLES.ADMIN:
      case ROLES.CASHIER:
      case ROLES.ATTENDANT:
        return '/select-store';
      default:
        return '/login';
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ redirect: true, callbackUrl: '/login' });
      setIsUserMenuOpen(false); // Tutup menu setelah logout
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Tampilkan loading state jika session sedang dimuat
  if (status === 'loading') {
    return (
      <header className={`shadow ${dynamicDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="animate-pulse flex space-x-4">
                <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                <div className="h-8 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={`shadow ${dynamicDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo dan Nama Aplikasi */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <ShoppingCart className={`h-8 w-8 ${dynamicDarkMode ? 'text-indigo-400' : 'text-indigo-600'} mr-2`} />
              <span className={`text-xl font-bold ${dynamicDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Toko Sakinah
              </span>
            </Link>
          </div>

          {/* Search Bar - hanya muncul di halaman tertentu */}
          <div className="hidden md:flex items-center max-w-md mx-4">
            <SearchBar darkMode={dynamicDarkMode} />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${dynamicDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
              aria-label={dynamicDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dynamicDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Dashboard Button for Authenticated Users */}
            {status === 'authenticated' && session.user && (
              <Link
                href={getDashboardUrl()}
                className={`mr-4 px-4 py-2 rounded-md text-sm font-medium ${
                  dynamicDarkMode
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                } transition-colors duration-200`}
              >
                Dashboard
              </Link>
            )}

            {/* User Info and Menu */}
            {status === 'authenticated' && session.user ? (
              <div className="relative">
                <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    dynamicDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}>
                    <User className="h-5 w-5" />
                  </div>
                  <span className={`text-sm font-medium ${dynamicDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {session.user.name}
                  </span>
                </div>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div id="user-menu" className={`absolute right-0 mt-2 w-48 ${dynamicDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50`}>
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                      <Link
                        href={
                          session?.user?.role === 'ADMIN'
                            ? '/admin/profile'
                            : session?.user?.role === 'MANAGER'
                            ? '/manager/profile'
                            : '/kasir/profile'
                        }
                        onClick={() => setIsUserMenuOpen(false)}
                        className={`w-full text-left flex items-center px-4 py-2 text-sm ${dynamicDarkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'}`}
                        role="menuitem"
                      >
                        <User className="mr-3 h-4 w-4" />
                        <span>Setting Profile</span>
                      </Link>
                      <div className={`border-t my-1 ${dynamicDarkMode ? 'border-gray-600' : 'border-gray-200'}`}></div>
                      <button
                        onClick={handleLogout}
                        className={`w-full text-left flex items-center px-4 py-2 text-sm ${dynamicDarkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'}`}
                        role="menuitem"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="flex items-center">
                <div
                  aria-label="User Login Button"
                  tabIndex="0"
                  role="button"
                  className="user-profile"
                >
                  <div className="user-profile-inner">
                    <svg
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <g data-name="Layer 2" id="Layer_2">
                        <path
                          d="m15.626 11.769a6 6 0 1 0 -7.252 0 9.008 9.008 0 0 0 -5.374 8.231 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 9.008 9.008 0 0 0 -5.374-8.231zm-7.626-4.769a4 4 0 1 1 4 4 4 4 0 0 1 -4-4zm10 14h-12a1 1 0 0 1 -1-1 7 7 0 0 1 14 0 1 1 0 0 1 -1 1z"
                        ></path>
                      </g>
                    </svg>
                    <p>Log In</p>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-md ${dynamicDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-4 px-4">
          <SearchBar darkMode={dynamicDarkMode} />
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className={`md:hidden border-t ${dynamicDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Dark/Light Mode Toggle */}
            <div className="flex items-center px-4 py-2">
              <button
                onClick={toggleDarkMode}
                className={`flex items-center space-x-2 w-full p-2 rounded-md ${dynamicDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {dynamicDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="text-sm">
                  {dynamicDarkMode ? "Mode Terang" : "Mode Gelap"}
                </span>
              </button>
            </div>

            {/* User Menu */}
            {status === 'authenticated' && session.user && (
              <>
                <Link
                  href={getDashboardUrl()}
                  className={`block px-4 py-2 text-sm font-medium ${
                    dynamicDarkMode
                      ? 'text-gray-300 hover:bg-gray-700 bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100 bg-gray-100'
                  } rounded-md mx-2 mt-2`}
                >
                  Dashboard
                </Link>

                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                      dynamicDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}>
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${dynamicDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {session.user.name}
                      </p>
                      <p className={`text-xs ${dynamicDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {session.user.role}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className={`flex items-center space-x-2 w-full px-4 py-2 text-sm ${dynamicDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            )}
            {(status !== 'authenticated' || !session.user) && (
              <Link href="/login" className="flex items-center px-4 py-2">
                 <div
                  aria-label="User Login Button"
                  tabIndex="0"
                  role="button"
                  className="user-profile"
                >
                  <div className="user-profile-inner">
                    <svg
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <g data-name="Layer 2" id="Layer_2">
                        <path
                          d="m15.626 11.769a6 6 0 1 0 -7.252 0 9.008 9.008 0 0 0 -5.374 8.231 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 9.008 9.008 0 0 0 -5.374-8.231zm-7.626-4.769a4 4 0 1 1 4 4 4 4 0 0 1 -4-4zm10 14h-12a1 1 0 0 1 -1-1 7 7 0 0 1 14 0 1 1 0 0 1 -1 1z"
                        ></path>
                      </g>
                    </svg>
                    <p>Log In</p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;