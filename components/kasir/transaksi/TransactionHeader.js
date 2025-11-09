// components/kasir/transaksi/TransactionHeader.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Sun, Moon, Expand, Minimize } from 'lucide-react';
import { useDarkMode } from '../../DarkModeContext';
import Tooltip from '../../Tooltip';

const TransactionHeader = () => {
  const { data: session } = useSession();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        <Tooltip content="Kembali ke Dashboard">
          <Link href="/kasir" className={`p-2 rounded-full ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            <ArrowLeft size={24} />
          </Link>
        </Tooltip>
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Transaksi Kasir</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Buat transaksi penjualan baru</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Tooltip content={darkMode ? "Light Mode" : "Dark Mode"}>
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </Tooltip>
        <Tooltip content={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}>
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-full ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {isFullscreen ? <Minimize size={20} /> : <Expand size={20} />}
          </button>
        </Tooltip>
        <div className="text-right pl-2">
          <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Halo, {session?.user?.name}</p>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Kasir</p>
        </div>
      </div>
    </div>
  );
};

export default TransactionHeader;
