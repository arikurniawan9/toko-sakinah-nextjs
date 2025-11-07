// components/Sidebar.js
'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  Home, 
  ShoppingBag, 
  Tag, 
  Truck, 
  Users, 
  CreditCard, 
  UserRound, 
  BarChart3,
  Menu,
  X,
  LogOut,
  Expand,
  Minimize,
  UserCog
} from 'lucide-react';
import { useDarkMode } from './DarkModeContext';

const Sidebar = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const userMenuRef = useRef(null);
  const pathname = usePathname();
  const { darkMode, toggleDarkMode } = useDarkMode();
  
  // For mobile responsiveness
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Close user menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fullscreen handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  const menuItems = [
    { title: "Dashboard", href: "/admin", icon: Home },
    { title: "Produk", href: "/admin/produk", icon: ShoppingBag },
    { title: "Kategori", href: "/admin/kategori", icon: Tag },
    { title: "Supplier", href: "/admin/supplier", icon: Truck },
    { title: "Member", href: "/admin/member", icon: UserRound },
    { title: "Kasir", href: "/admin/kasir", icon: CreditCard },
    { title: "Pelayan", href: "/admin/pelayan", icon: Users },
    { title: "Laporan", href: "/admin/laporan", icon: BarChart3 },
  ];

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile menu button */}
      {isMobile && (
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-md ${darkMode ? 'text-white bg-gray-800' : 'text-gray-700 bg-white'} shadow-md`}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      )}

      {/* Sidebar */}
      <div 
        className={`${
          isMobile 
            ? `fixed inset-y-0 left-0 z-40 w-48 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-lg transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`
            : `fixed inset-y-0 left-0 z-10 w-48 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } shadow-lg ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}` 
        } md:translate-x-0 md:static flex flex-col`}
      >
        {/* Logo */}
        <div className={`flex items-center justify-center h-16 px-4 border-b ${
          darkMode ? 'border-gray-700' : 'border-pastel-purple-200'
        }`}>
          <h1 className={`text-xl font-bold ${darkMode ? 'text-pastel-purple-400' : 'text-pastel-purple-700'}`}>Toko Sakinah</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => isMobile && setIsSidebarOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? `${darkMode ? 'bg-pastel-purple-900 text-pastel-purple-100' : 'bg-pastel-purple-100 text-pastel-purple-800'} border-r-4 ${
                            darkMode ? 'border-pastel-purple-500' : 'border-pastel-purple-500'
                          }`
                        : `${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-pastel-purple-50 hover:text-pastel-purple-600'}`
                    }`}
                  >
                    <IconComponent className="h-5 w-5 mr-3" />
                    <span>{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Controls and User Info */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-pastel-purple-200'}`}>
          <div className="mb-4 flex items-center justify-center space-x-4">
            {/* Dark Mode Toggle */}
            <label className="switch">
              <input 
                type="checkbox" 
                checked={darkMode}
                onChange={toggleDarkMode}
              />
              <span className="slider"></span>
            </label>
            {/* Fullscreen Toggle */}
            <button 
              onClick={toggleFullscreen} 
              className={`p-2 rounded-full ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
              title={isFullscreen ? 'Keluar dari layar penuh' : 'Layar penuh'}
            >
              {isFullscreen ? <Minimize size={18} /> : <Expand size={18} />}
            </button>
          </div>
          
          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <div 
              className="flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-700"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <div className="w-10 h-10 rounded-full bg-pastel-purple-400 flex items-center justify-center text-white font-bold">
                A
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Admin</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Administrator</p>
              </div>
            </div>
            
            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className={`absolute bottom-full left-0 mb-2 w-52 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-md shadow-lg ring-1 ring-black ring-opacity-5`}>
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  <Link
                    href="/admin/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className={`w-full text-left flex items-center px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'}`}
                    role="menuitem"
                  >
                    <UserCog className="mr-3 h-5 w-5" />
                    <span>Setting Profile</span>
                  </Link>
                  <div className={`border-t my-1 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}></div>
                  <button
                    onClick={handleLogout}
                    className={`w-full text-left flex items-center px-4 py-2 text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'}`}
                    role="menuitem"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div 
          className={`fixed inset-0 z-30 ${darkMode ? 'bg-black bg-opacity-70' : 'bg-black bg-opacity-50'} md:hidden`}
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen && !isMobile ? 'md:ml-48' : 'ml-0'}`}>
        {children}
      </div>
    </div>
  );
};

export default Sidebar;