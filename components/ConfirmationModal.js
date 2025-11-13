// components/ConfirmationModal.js
'use client';

import { X, AlertTriangle, AlertCircle } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  isLoading = false,
  variant = 'danger', // 'danger', 'warning', 'info'
  icon = null, // Custom icon component
}) {
  if (!isOpen) return null;

  // Warna dan ikon berdasarkan variant
  const variantConfig = {
    danger: {
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-500',
      buttonColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      buttonDisabled: 'disabled:bg-red-400',
      icon: AlertTriangle,
    },
    warning: {
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-500',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      buttonDisabled: 'disabled:bg-yellow-400',
      icon: AlertCircle,
    },
    info: {
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-500',
      buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      buttonDisabled: 'disabled:bg-blue-400',
      icon: AlertCircle,
    }
  };

  const config = variantConfig[variant] || variantConfig.danger;
  const IconComponent = icon || config.icon;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="relative rounded-xl shadow-lg w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start">
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${config.bgColor} sm:mx-0 sm:h-10 sm:w-10`}>
              <IconComponent className={`h-6 w-6 ${config.textColor}`} aria-hidden="true" />
            </div>
            <div className="ml-4 text-left">
              <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
                {title || 'Konfirmasi'}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {message}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 flex flex-row-reverse gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
          <button
            type="button"
            disabled={isLoading}
            className={`inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${config.buttonColor} focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-auto sm:text-sm ${config.buttonDisabled} disabled:cursor-not-allowed`}
            onClick={onConfirm}
          >
            {isLoading ? 'Memproses...' : confirmText}
          </button>
          <button
            type="button"
            className="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
