// components/kasir/transaksi/SuspendedSalesListModal.js
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Trash2, PlayCircle } from "lucide-react";
import ConfirmationModal from "../../ConfirmationModal";

const SuspendedSalesListModal = ({ isOpen, onClose, onResume, darkMode }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [saleToResume, setSaleToResume] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResumeConfirm, setShowResumeConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSuspendedSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/suspended-sales");
      if (!response.ok) {
        throw new Error("Gagal memuat daftar penjualan yang ditangguhkan.");
      }
      const data = await response.json();
      setSales(data.suspendedSales || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSuspendedSales();
    }
  }, [isOpen, fetchSuspendedSales]);

  const confirmDelete = (saleId) => {
    setSaleToDelete(saleId);
    setShowDeleteConfirm(true);
  };

  const confirmResume = (sale) => {
    setSaleToResume(sale);
    setShowResumeConfirm(true);
  };

  const handleDelete = async () => {
    if (!saleToDelete) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/suspended-sales?id=${saleToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Gagal menghapus penjualan.");
      }
      // Refresh the list
      fetchSuspendedSales();
      setShowDeleteConfirm(false);
      setSaleToDelete(null);
    } catch (err) {
      // Di sini bisa ditambahkan notifikasi error jika diperlukan
      console.error("Error deleting suspended sale:", err);
      setShowDeleteConfirm(false);
      setSaleToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResume = () => {
    if (saleToResume) {
      onResume(saleToResume);
      setShowResumeConfirm(false);
      setSaleToResume(null);
    }
  };

  if (!isOpen) return null;

  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col ${
          darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"
        }`}
      >
        <div
          className={`p-6 border-b ${
            darkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <h3 className="text-xl font-semibold">
            Daftar Penjualan ditangguhkan
          </h3>
          <p
            className={`text-sm mt-1 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Pilih penjualan untuk dilanjutkan atau dihapus.
          </p>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {loading && <p>Memuat...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && sales.length === 0 && (
            <p className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Tidak ada penjualan yang ditangguhkan.
            </p>
          )}
          <div className="space-y-4">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className={`p-4 rounded-lg border ${
                  darkMode
                    ? "bg-gray-700/50 border-gray-600"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-lg">{sale.name}</p>
                    {sale.notes && (
                      <p
                        className={`text-sm mt-1 ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {sale.notes}
                      </p>
                    )}
                    {sale.selectedAttendantId && sale.attendantName && (
                      <p
                        className={`text-sm mt-1 ${
                          darkMode ? "text-blue-300" : "text-blue-600"
                        }`}
                      >
                        Dibuat oleh: {sale.attendantName}
                      </p>
                    )}
                    <p
                      className={`text-xs mt-2 flex items-center ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      <ShoppingCart size={14} className="mr-2" />
                      {sale.cartItems.length} item
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => confirmDelete(sale.id)}
                      className={`p-2 rounded-full ${
                        darkMode
                          ? "text-red-400 hover:bg-gray-600"
                          : "text-red-500 hover:bg-red-100"
                      }`}
                      title="Hapus"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => confirmResume(sale)}
                      className="flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                      title="Lanjutkan"
                    >
                      <PlayCircle size={18} className="mr-2" />
                      Lanjutkan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`flex justify-end p-4 border-t ${
            darkMode ? "border-gray-700" : "bg-gray-50"
          }`}
        >
          <button
            onClick={onClose}
            className={`py-2 px-4 rounded-md text-sm font-medium ${
              darkMode
                ? "bg-gray-600 hover:bg-gray-500"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Modal konfirmasi hapus */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSaleToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus penjualan yang ditangguhkan ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteLoading}
        darkMode={darkMode}
      />

      {/* Modal konfirmasi lanjutkan */}
      <ConfirmationModal
        isOpen={showResumeConfirm}
        onClose={() => {
          setShowResumeConfirm(false);
          setSaleToResume(null);
        }}
        onConfirm={handleResume}
        title="Konfirmasi Lanjutkan"
        message="Melanjutkan penjualan ini akan menggantikan keranjang Anda saat ini. Apakah Anda ingin melanjutkan?"
        confirmText="Lanjutkan"
        cancelText="Batal"
        darkMode={darkMode}
      />
    </div>
  );
};

export default SuspendedSalesListModal;
