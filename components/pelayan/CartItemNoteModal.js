// components/pelayan/CartItemNoteModal.js
import { useState } from 'react';
import { X, Edit3 } from 'lucide-react';

const CartItemNoteModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  item, 
  darkMode 
}) => {
  const [note, setNote] = useState(item?.note || '');

  if (!isOpen) return null;

  const handleSave = () => {
    if (onSave) {
      onSave(item.productId, note);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className={`rounded-xl shadow-xl w-full max-w-md ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className={`p-6 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex justify-between items-center">
            <h3 className={`text-xl font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Tambahkan Catatan untuk {item?.name}
            </h3>
            <button
              onClick={onClose}
              className={`p-1 rounded-full ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
            >
              <X className={`h-5 w-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
          </div>
          <p className={`mt-1 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Tambahkan catatan atau instruksi khusus untuk item ini
          </p>
        </div>

        <div className="p-6">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Tanpa cabe, tambahkan es batu, dll."
            className={`w-full h-32 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              darkMode
                ? 'border-gray-600 bg-gray-700 text-white'
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          />
          {item?.note && (
            <div className={`mt-2 text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Catatan sebelumnya: {item.note}
            </div>
          )}
        </div>

        <div className={`p-6 border-t flex justify-end space-x-3 ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded-lg flex items-center ${
              darkMode
                ? 'bg-pastel-purple-600 hover:bg-pastel-purple-700 text-white'
                : 'bg-pastel-purple-600 hover:bg-pastel-purple-700 text-white'
            }`}
          >
            Simpan Catatan
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItemNoteModal;