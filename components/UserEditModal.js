import { useState, useEffect } from 'react';
import { UserCog } from 'lucide-react';
import { toast } from 'react-toastify';

export default function UserEditModal({ isOpen, onClose, user, stores, onSave, loading }) {
  const [userData, setUserData] = useState({
    name: '',
    username: '',
    employeeNumber: '',
    phone: '',
    address: '',
    role: '',
    status: 'AKTIF',
  });

  const [storeId, setStoreId] = useState('');
  const [storeRole, setStoreRole] = useState('');
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name || '',
        username: user.username || '',
        employeeNumber: user.employeeNumber || '',
        phone: user.phone || '',
        address: user.address || '',
        role: user.role || '',
        status: user.status || 'AKTIF',
      });

      // Set toko dan role toko jika user memiliki toko
      if (user.stores && user.stores.length > 0) {
        const firstStore = user.stores[0];
        setStoreId(firstStore.id || '');
        setStoreRole(firstStore.role || 'CASHIER');
      } else {
        setStoreId('');
        setStoreRole('CASHIER');
      }

      // Reset password fields when opening modal
      setPasswordData({
        newPassword: '',
        confirmPassword: '',
      });
    } else {
      setUserData({
        name: '',
        username: '',
        employeeNumber: '',
        phone: '',
        address: '',
        role: '',
        status: 'AKTIF',
      });
      setStoreId('');
      setStoreRole('CASHIER');
      setPasswordData({
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userData.name.trim()) {
      toast.error('Nama wajib diisi');
      return;
    }

    if (passwordData.newPassword && passwordData.newPassword.length < 6) {
      toast.error('Password baru minimal harus 6 karakter');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Password baru dan konfirmasi password tidak cocok');
      return;
    }

    const updatedData = {
      name: userData.name.trim(),
      employeeNumber: userData.employeeNumber.trim(),
      phone: userData.phone.trim(),
      address: userData.address.trim(),
      role: userData.role,
      status: userData.status,
      storeId, // Include store ID in update
      storeRole, // Include store role in update
    };

    if (passwordData.newPassword) {
      updatedData.password = passwordData.newPassword;
    }

    onSave(updatedData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <UserCog className="h-5 w-5 mr-2" />
          Edit Pengguna: {user?.name}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama *</label>
                <input
                  type="text"
                  name="name"
                  value={userData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={userData.username}
                  className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-600 dark:text-gray-300"
                  readOnly
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nomor Pegawai</label>
                <input
                  type="text"
                  name="employeeNumber"
                  value={userData.employeeNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Telepon</label>
                <input
                  type="tel"
                  name="phone"
                  value={userData.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Alamat</label>
                <textarea
                  name="address"
                  value={userData.address}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Password Baru (Opsional)</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  placeholder="Isi untuk mengganti password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  placeholder="Ulangi password baru"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Peran Utama *</label>
                <select
                  name="role"
                  value={userData.role}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="MANAGER">Manager</option>
                  <option value="WAREHOUSE">Gudang</option>
                  <option value="ADMIN">Admin</option>
                  <option value="CASHIER">Kasir</option>
                  <option value="ATTENDANT">Pelayan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status Pengguna *</label>
                <select
                  name="status"
                  value={userData.status}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="AKTIF">Aktif</option>
                  <option value="TIDAK_AKTIF">Tidak Aktif</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Toko</label>
                <select
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Pilih Toko</option>
                  {stores && stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Peran di Toko</label>
                <select
                  value={storeRole}
                  onChange={(e) => setStoreRole(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="CASHIER">Kasir</option>
                  <option value="ATTENDANT">Pelayan</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <UserCog className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}