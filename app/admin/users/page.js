'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ROLES } from '@/lib/constants';

export default function ManageStoreUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // Semua user yang tersedia
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated' || session.user.role !== ROLES.ADMIN) {
      router.push('/unauthorized');
      return;
    }

    if (session.user.storeId) {
      fetchStoreUsers();
      fetchAllUsers();
      fetchStores();
    }
  }, [status, session, router]);

  const fetchStoreUsers = async () => {
    if (!session?.user.storeId) return;
    
    try {
      const response = await fetch(`/api/stores/${session.user.storeId}/users`);
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching store users:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      // Filter agar hanya menampilkan user yang belum menjadi bagian dari toko ini
      const currentStoreUsers = users.map(u => u.userId);
      setAllUsers(data.users?.filter(u => !currentStoreUsers.includes(u.id)) || []);
    } catch (error) {
      console.error('Error fetching all users:', error);
    }
  };

  const fetchStores = async () => {
    if (session?.user?.role === ROLES.MANAGER) {
      try {
        const response = await fetch('/api/stores');
        const data = await response.json();
        setStores(data.stores || []);
      } catch (error) {
        console.error('Error fetching stores:', error);
      }
    }
  };

  const handleAddUserToStore = async () => {
    if (!selectedUser || !selectedRole) {
      alert('Silakan pilih user dan role');
      return;
    }

    const storeId = session.user.role === ROLES.MANAGER && selectedStore 
      ? selectedStore 
      : session.user.storeId;

    if (!storeId) {
      alert('Store ID tidak ditemukan');
      return;
    }

    try {
      const response = await fetch('/api/stores/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser,
          storeId: storeId,
          role: selectedRole,
          assignedBy: session.user.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('User berhasil ditambahkan ke toko');
        setShowAddModal(false);
        setSelectedUser('');
        setSelectedRole('');
        setSelectedStore('');
        fetchStoreUsers(); // Refresh data
        fetchAllUsers(); // Refresh list users tersedia
      } else {
        alert(result.error || 'Gagal menambahkan user ke toko');
      }
    } catch (error) {
      console.error('Error adding user to store:', error);
      alert('Terjadi kesalahan saat menambahkan user ke toko');
    }
  };

  const handleRemoveUserFromStore = async (storeUserId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini dari toko?')) {
      return;
    }

    try {
      const response = await fetch(`/api/stores/users/${storeUserId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('User berhasil dihapus dari toko');
        fetchStoreUsers(); // Refresh data
        fetchAllUsers(); // Refresh list users tersedia
      } else {
        const result = await response.json();
        alert(result.error || 'Gagal menghapus user dari toko');
      }
    } catch (error) {
      console.error('Error removing user from store:', error);
      alert('Terjadi kesalahan saat menghapus user dari toko');
    }
  };

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (status !== 'authenticated' || (session.user.role !== ROLES.ADMIN && session.user.role !== ROLES.MANAGER)) {
    return null; // Redirect sudah ditangani di useEffect
  }

  // Hanya tampilkan role yang relevan
  const availableRoles = session.user.role === ROLES.MANAGER
    ? [ROLES.ADMIN, ROLES.CASHIER, ROLES.ATTENDANT]
    : [ROLES.CASHIER, ROLES.ATTENDANT];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Manajemen User Toko</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Daftar User di Toko</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              + Tambah User
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Memuat data user...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role di Toko</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((storeUser) => (
                      <tr key={storeUser.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{storeUser.user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{storeUser.user.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {storeUser.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${storeUser.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {storeUser.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleRemoveUserFromStore(storeUser.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {users.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Belum ada user yang ditugaskan ke toko ini.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal untuk menambah user */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tambah User ke Toko</h3>
              
              {session.user.role === ROLES.MANAGER && (
                <div className="mb-4">
                  <label htmlFor="store" className="block text-sm font-medium text-gray-700 mb-1">
                    Pilih Toko
                  </label>
                  <select
                    id="store"
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Pilih Toko</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
                  Pilih User
                </label>
                <select
                  id="user"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Pilih User</option>
                  {allUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Pilih Role
                </label>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Pilih Role</option>
                  {availableRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddUserToStore}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Tambahkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}