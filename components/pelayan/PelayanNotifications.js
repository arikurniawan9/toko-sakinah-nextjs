// components/pelayan/PelayanNotifications.js
'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';

const PelayanNotifications = ({ darkMode, attendantId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fungsi untuk mengambil notifikasi dari API
  const fetchNotifications = async () => {
    if (!attendantId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/pelayan/notifications?attendantId=${attendantId}`);
      if (!response.ok) {
        throw new Error('Gagal mengambil notifikasi');
      }
      const data = await response.json();

      setNotifications(data.notifications || []);
      // Hitung jumlah notifikasi yang belum dibaca (dalam implementasi ini, kita asumsikan semua adalah unread)
      // Dalam implementasi sebenarnya, status read akan dari API
      setUnreadCount(data.notifications ? data.notifications.length : 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ambil notifikasi saat komponen dimuat dan secara berkala
  useEffect(() => {
    fetchNotifications();
    // Refresh setiap 30 detik
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [attendantId]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'suspended':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== id) // Sederhana: hapus notifikasi ketika diklik
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="relative">
        <button className={`p-2 rounded-full ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <Bell className="h-5 w-5 animate-spin" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          fetchNotifications(); // Refresh ketika dibuka
          setShowDropdown(!showDropdown);
        }}
        className={`relative p-2 rounded-full ${
          darkMode
            ? 'hover:bg-gray-700 text-gray-300'
            : 'hover:bg-gray-200 text-gray-600'
        }`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          className={`absolute right-0 mt-2 w-80 rounded-md shadow-lg z-50 ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
        >
          <div
            className={`px-4 py-3 border-b ${
              darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-center">
              <h3 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Notifikasi
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className={`text-xs ${
                    darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                  }`}
                >
                  Tandai semua sudah dibaca
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Tidak ada notifikasi baru
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:cursor-pointer ${
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        {getStatusIcon(notification.status)}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </p>
                        </div>
                        <p className={`mt-1 text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          {notification.message}
                        </p>
                        <p className={`mt-1 text-xs ${
                          darkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {new Date(notification.timestamp).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PelayanNotifications;