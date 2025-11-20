'use client';
import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/constants';

export default function SelectStorePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && session.user.id) {
      fetchUserStores();
    }
  }, [session, status]);

  const fetchUserStores = async () => {
    try {
      const res = await fetch(`/api/users/${session.user.id}/stores`);
      const data = await res.json();
      setStores(data.stores || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stores:', error);
      setStores([]); // Set ke array kosong jika terjadi error
      setLoading(false);
    }
  };

  const handleSelectStore = async (storeId, storeRole) => {
    try {
      // For a manager switching context, or a user logging into a specific store
      const result = await signIn('credentials', {
        redirect: false,
        username: session.user.username,
        password: 'PASSWORD_PLACEHOLDER', // ! SECURITY RISK: Needs secure handling
        selectedStoreId: storeId,
        selectedStoreRole: storeRole,
      });

      if (result?.error) {
        alert(`Gagal mengakses toko: ${result.error}`);
      } else {
        // Redirect to the appropriate dashboard based on the selected role
        switch(storeRole) {
          case ROLES.ADMIN:
            router.push('/admin');
            break;
          case ROLES.CASHIER:
            router.push('/kasir');
            break;
          case ROLES.ATTENDANT:
            router.push('/pelayan');
            break;
          default:
            router.push('/unauthorized');
        }
      }
    } catch (error) {
      console.error('Error updating store context:', error);
      alert('Terjadi kesalahan saat memilih toko.');
    }
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (status !== 'authenticated') {
    router.push('/login');
    return null;
  }

  if (loading) return <div>Loading stores...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-purple-300 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8 text-purple-700">Pilih Toko</h1>

        {stores && stores.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-600">Anda tidak memiliki akses ke toko manapun.</p>
            <p className="text-gray-500 text-sm mt-2">Hubungi administrator untuk mendapatkan akses.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stores.map(store => (
              <div
                key={store.id}
                className="border border-purple-200 rounded-lg p-4 hover:bg-purple-50 cursor-pointer transition duration-200"
                onClick={() => handleSelectStore(store.id, store.role)}
              >
                <h3 className="font-medium text-gray-800">{store.name}</h3>
                <p className="text-sm text-gray-600">Role: {store.role}</p>
              </div>
            ))}
          </div>
        )}

        {/* Jika user adalah MANAGER atau WAREHOUSE, tampilkan navigasi khusus */}
        {session.user.role === ROLES.MANAGER && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600 mb-3">Atau akses sebagai manager:</p>
            <button
              onClick={() => router.push('/manager')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition duration-200"
            >
              Dashboard Manager
            </button>
          </div>
        )}

        {session.user.role === ROLES.WAREHOUSE && (
          <div className="mt-4">
            <p className="text-center text-gray-600 mb-3">Atau akses sebagai warehouse:</p>
            <button
              onClick={() => router.push('/warehouse')}
              className="w-full bg-purple-800 hover:bg-purple-900 text-white py-2 px-4 rounded-lg transition duration-200"
            >
              Dashboard Gudang
            </button>
          </div>
        )}
      </div>
    </div>
  );
}