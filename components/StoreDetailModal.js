'use client';

import { useState } from 'react';
import { X, Store, MapPin, Phone, Mail, Calendar, User } from 'lucide-react';

const StoreDetailModal = ({ isOpen, onClose, store }) => {
  if (!isOpen || !store) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center">
            <Store className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detail Toko</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {store ? (
            <div className="space-y-6">
              {/* Informasi Utama */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      <Store className="h-4 w-4 mr-2" />
                      <span>Nama Toko</span>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">{store.name}</p>
                  </div>

                  <div>
                    <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      <span className="h-4 w-4 mr-2"></span>
                      <span>Kode Toko</span>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {store.code || '-'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>Alamat</span>
                    </div>
                    <p className="text-gray-900 dark:text-white">{store.address || '-'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>Telepon</span>
                    </div>
                    <p className="text-gray-900 dark:text-white">{store.phone || '-'}</p>
                  </div>

                  <div>
                    <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>Email</span>
                    </div>
                    <p className="text-gray-900 dark:text-white">{store.email || '-'}</p>
                  </div>

                  <div>
                    <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Tanggal Dibuat</span>
                    </div>
                    <p className="text-gray-900 dark:text-white">
                      {formatDate(store.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Deskripsi */}
              {store.description && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Deskripsi</h3>
                  <p className="text-gray-900 dark:text-white">{store.description}</p>
                </div>
              )}

              {/* Status */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
                    <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${store.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
                      {store.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informasi Admin */}
              {store.adminUser && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Informasi Admin Toko</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        <User className="h-4 w-4 mr-2" />
                        <span>Nama Admin</span>
                      </div>
                      <p className="text-gray-900 dark:text-white">{store.adminUser.name}</p>
                    </div>
                    <div>
                      <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        <span className="h-4 w-4 mr-2"></span>
                        <span>Username</span>
                      </div>
                      <p className="text-gray-900 dark:text-white">{store.adminUser.username}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Tidak ada data toko
            </div>
          )}

          <div className="flex justify-end pt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreDetailModal;