// components/Sidebar.js
'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react'; // Import useSession
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
  UserCog,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  ShoppingCart, // Added for Transaksi Pembelian
  Receipt,       // Added for Transaksi Penjualan
  DollarSign,    // Added for Pengeluaran
  History,       // Added for Riwayat Penjualan
  Settings,       // Added for Pengaturan Toko
  Package,        // Added for Riwayat Pembelian
  Folder,          // Added for Kategori Pengeluaran
  Building,
  Monitor,
  Plus,
  HardDrive,
  RotateCcw
} from 'lucide-react';
import { useUserTheme } from './UserThemeContext';
import { useSidebar } from './SidebarContext';
import { useTheme } from './ThemeContext';
import Tooltip from './Tooltip';

const Sidebar = ({ children }) => {
  const { shopName, themeColor } = useTheme();
  const [hasMounted, setHasMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const userMenuRef = useRef(null);
  const pathname = usePathname();
  const { userTheme: { darkMode }, toggleDarkMode } = useUserTheme();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { data: session } = useSession(); // Get session data

  useEffect(() => {
    setHasMounted(true);
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!hasMounted) {
    return null;
  }
  
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

  // Define all menu items
  const allMenuItems = [
    // MANAGER menus
    { title: "Dashboard", href: "/manager", icon: Home, type: 'item', roles: ['MANAGER'] },
    { title: "Manajemen Toko", type: 'heading', roles: ['MANAGER'] },
    { title: "Manajemen Toko", href: "/manager/stores", icon: ShoppingBag, type: 'item', roles: ['MANAGER'] },
    { title: "Monitor Toko", href: "/manager/monitor-all", icon: Monitor, type: 'item', roles: ['MANAGER'] },
    { title: "Backup & Restore", href: "/manager/backup-restore", icon: HardDrive, type: 'item', roles: ['MANAGER'] },

    // ADMIN menus
    { title: "Dashboard", href: "/admin", icon: Home, type: 'item', roles: ['ADMIN'] },
    { title: "Master", type: 'heading', roles: ['ADMIN'] },
    { title: "Produk", href: "/admin/produk", icon: ShoppingBag, type: 'item', roles: ['ADMIN'] },
    { title: "Kategori", href: "/admin/kategori", icon: Tag, type: 'item', roles: ['ADMIN'] },
    { title: "Supplier", href: "/admin/supplier", icon: Truck, type: 'item', roles: ['ADMIN'] },
    { title: "Member", href: "/admin/member", icon: UserRound, type: 'item', roles: ['ADMIN'] },
    { title: "Kasir", href: "/admin/kasir", icon: CreditCard, type: 'item', roles: ['ADMIN'] },
    { title: "Pelayan", href: "/admin/pelayan", icon: Users, type: 'item', roles: ['ADMIN'] },
    { title: "Laporan", type: 'heading', roles: ['ADMIN'] },
    { title: "Laporan", href: "/admin/laporan", icon: BarChart3, type: 'item', roles: ['ADMIN'] },
    { title: "Laporan Laba Rugi", href: "/admin/laporan/labarugi", icon: BarChart3, type: 'item', roles: ['ADMIN'] },
    { title: "Laporan Piutang", href: "/admin/laporan/piutang", icon: DollarSign, type: 'item', roles: ['ADMIN'] },
    { title: "Transaksi", type: 'heading', roles: ['ADMIN'] },
    { title: "Pembelian", href: "/admin/transaksi/pembelian", icon: ShoppingCart, type: 'item', roles: ['ADMIN'] },
    { title: "Riwayat Pembelian", href: "/admin/transaksi/pembelian/riwayat", icon: Package, type: 'item', roles: ['ADMIN'] },
    { title: "Penjualan", href: "/admin/transaksi", icon: Receipt, type: 'item', roles: ['ADMIN'] },
    { title: "Riwayat Penjualan", href: "/admin/transaksi/riwayat-penjualan", icon: History, type: 'item', roles: ['ADMIN'] },
    { title: "Keuangan", type: 'heading', roles: ['ADMIN'] },
    { title: "Pengeluaran", href: "/admin/pengeluaran", icon: DollarSign, type: 'item', roles: ['ADMIN'] },
    { title: "Kategori Pengeluaran", href: "/admin/pengeluaran/kategori", icon: Folder, type: 'item', roles: ['ADMIN'] },
    { title: "Pengaturan", type: 'heading', roles: ['ADMIN'] },
    { title: "Pengaturan", href: "/admin/pengaturan", icon: Settings, type: 'item', roles: ['ADMIN'] },

    // CASHIER menus
    { title: "Kasir", type: 'heading', roles: ['CASHIER'] },
    { title: "Dashboard", href: "/kasir", icon: Home, type: 'item', roles: ['CASHIER'] },
    { title: "Transaksi", href: "/kasir/transaksi", icon: Receipt, type: 'item', roles: ['CASHIER'] },
    { title: "Riwayat Transaksi", href: "/kasir/riwayat", icon: History, type: 'item', roles: ['CASHIER'] },
    { title: "Master", type: 'heading', roles: ['CASHIER'] },
    { title: "Produk", href: "/kasir/produk", icon: ShoppingBag, type: 'item', roles: ['CASHIER'] },
    { title: "Kategori", href: "/kasir/kategori", icon: Tag, type: 'item', roles: ['CASHIER'] },
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => {
    if (!session?.user?.role) return false; // No role, no access
    if (item.roles && !item.roles.includes(session.user.role)) {
      return false; // User role not in allowed roles for this item
    }
    return true;
  });

  const sidebarWidthClass = isCollapsed ? 'w-20' : 'w-56';
  const mainContentLeftMargin = isMobile ? 'ml-0' : (isCollapsed ? 'ml-20' : 'ml-56'); // Dynamic left margin

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}> {/* Added min-h-screen */}
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg transition-all duration-300 ease-in-out ${
          isMobile
            ? `w-56 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `${sidebarWidthClass}`
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center justify-center h-16 px-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} style={{ borderColor: darkMode ? '' : themeColor }}>
          <h1 style={{ color: themeColor }} className={`text-xl font-bold ${isCollapsed && !isMobile ? 'hidden' : ''}`}>{shopName}</h1>
          <ShoppingBag style={{ color: themeColor }} className={`${!isCollapsed || isMobile ? 'hidden' : ''}`} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item, index) => {
              if (item.type === 'heading') {
                return (
                  <li key={index} className="mt-4 mb-2">
                    {!isCollapsed || isMobile ? (
                      <h3 className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.title}
                      </h3>
                    ) : (
                      <Tooltip content={item.title} position="right">
                        <div className={`h-6 w-6 mx-auto flex items-center justify-center rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                          {item.title.charAt(0)}
                        </div>
                      </Tooltip>
                    )}
                  </li>
                );
              }

              const IconComponent = item.icon;
              const isActive = pathname === item.href;
              const linkContent = (
                <>
                  <IconComponent className={`h-5 w-5 ${isCollapsed && !isMobile ? 'mx-auto' : 'mr-3'}`} />
                  {!isCollapsed || isMobile ? <span>{item.title}</span> : null}
                </>
              );

              return (
                <li key={item.href}>
                  {isCollapsed && !isMobile ? (
                    <Tooltip content={item.title} position="bottom">
                      <Link
                        href={item.href}
                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? `text-white`
                            : `${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`
                        }`}
                        style={{
                          backgroundColor: isActive ? themeColor : '',
                        }}
                      >
                        {linkContent}
                      </Link>
                    </Tooltip>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => isMobile && setIsMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'text-white'
                          : `${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`
                      }`}
                      style={{
                        backgroundColor: isActive ? themeColor : '',
                        borderRight: isActive ? `4px solid ${themeColor}` : '',
                      }}
                    >
                      {linkContent}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Toggle for Desktop */}
        {!isMobile && (
            <div className={`px-4 py-3 border-t ${darkMode ? 'border-gray-700' : 'border-pastel-purple-200'}`}>
                <Tooltip content={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"} position="bottom">
                    <button onClick={toggleSidebar} className={`w-full flex items-center justify-center p-2 rounded-lg ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}>
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </Tooltip>
            </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {isMobile && isMobileMenuOpen && (
        <div
          className={`fixed inset-0 z-30 ${darkMode ? 'bg-black bg-opacity-70' : 'bg-black bg-opacity-50'} md:hidden`}
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Main content wrapper */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${mainContentLeftMargin}`}>
        {/* Top Header */}
        <header className={`flex items-center justify-between h-16 px-4 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} z-30`}>
          {/* Left side: Mobile Menu Toggle & Desktop Sidebar Toggle */}
          <div className="flex items-center space-x-2">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-md ${darkMode ? 'text-white' : 'text-gray-700'} md:hidden`}
            >
              <Menu size={24} />
            </button>

            {/* Desktop Sidebar Toggle */}
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-md ${darkMode ? 'text-white' : 'text-gray-700'} hidden md:block`}
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Right side: Dark Mode, Fullscreen, User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Dark Mode Toggle */}
            <Tooltip content={darkMode ? "Light Mode" : "Dark Mode"} position="bottom">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-full ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </Tooltip>

            {/* Fullscreen Toggle */}
            <Tooltip content={isFullscreen ? "Exit Fullscreen" : "Fullscreen"} position="bottom">
              <button
                onClick={toggleFullscreen}
                className={`p-2 rounded-full ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {isFullscreen ? <Minimize size={20} /> : <Expand size={20} />}
              </button>
            </Tooltip>

            {/* User Menu (moved from sidebar) */}
            <div className="relative" ref={userMenuRef}>
              <div
                className={`flex items-center p-2 rounded-lg cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <div style={{ backgroundColor: themeColor }} className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
                  {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                {/* Only show text if not collapsed and not mobile */}
                {!isCollapsed && !isMobile && (
                  <div className="ml-3 text-right">
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{session?.user?.name || 'User'}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{session?.user?.role || 'Guest'}</p>
                    {session?.user?.employeeNumber && <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Kode: {session.user.employeeNumber}</p>}
                  </div>
                )}
              </div>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className={`absolute top-full right-0 mt-2 w-52 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-md shadow-lg ring-1 ring-black ring-opacity-5`}>
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
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto pb-16"> {/* Added pb-16 for fixed footer */}
          {children}
        </div>
      </div>

      {/* Fixed Footer */}
      <footer className={`fixed bottom-0 left-0 right-0 z-40 py-4 px-4 text-right text-sm ${darkMode ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-white text-gray-600 border-gray-200'} border-t`}>
        <span className={`${isMobile ? 'ml-0' : (isCollapsed ? 'ml-20' : 'ml-56')} transition-all duration-300`}>
          Copyright @2025 by Ari Kurniawan.
        </span>
      </footer>
    </div>
  );
};

export default Sidebar;