// components/MultiStoreSwitcher.js
import { useState, useEffect } from 'react';
import { Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function MultiStoreSwitcher({ session, darkMode = false }) {
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentStore, setCurrentStore] = useState(null);

  useEffect(() => {
    if (session?.user) {
      fetchUserStores();
      setCurrentStore(session.user.storeAccess);
    }
  }, [session?.user]);

  const fetchUserStores = async () => {
    if (!session?.user || !session.user.id) return;

    setIsLoading(true);
    try {
      // Ambil akses toko dari session
      if (session.user.isGlobalRole) {
        // Jika user adalah MANAGER atau WAREHOUSE, ambil semua toko yang bisa diakses
        // Kita akan mengambil dari API endpoint
        const userStoreAccesses = await fetch(`/api/store-users/user-stores?userId=${session.user.id}`)
          .then(res => {
            if (!res.ok) throw new Error('Failed to fetch stores');
            return res.json();
          });

        setStores(userStoreAccesses || []);
      } else {
        // Jika bukan global role, gunakan akses toko dari session
        if (session.user.storeAccess) {
          setStores([session.user.storeAccess]);
        }
      }
    } catch (error) {
      console.error('Error fetching user stores:', error);
      // Gunakan akses toko dari session sebagai fallback
      if (session?.user?.storeAccess) {
        setStores([session.user.storeAccess]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchStore = async (storeId, storeRole) => {
    try {
      // Gunakan next-auth signIn untuk login ulang dengan toko yang berbeda
      const result = await signIn('credentials', {
        username: session.user.username,
        password: 'STORE_CONTEXT_SWITCH', // Password khusus untuk context switching
        selectedStoreId: storeId,
        selectedStoreRole: storeRole,
        redirect: false
      });

      if (result?.ok) {
        // Refresh halaman untuk memperbarui session
        window.location.reload();
      } else {
        console.error('Store switch failed:', result?.error);
      }
    } catch (error) {
      console.error('Error switching store:', error);
    }
  };

  // Hanya tampilkan dropdown jika user memiliki akses ke lebih dari 1 toko
  if (stores.length <= 1) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${
        darkMode ? 'bg-gray-700' : 'bg-gray-100'
      }`}>
        <Building2 className="h-4 w-4" />
        <span className="text-sm font-medium">
          {currentStore?.name || 'Toko Tunggal'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center justify-between gap-2 w-full px-3 py-2 rounded-md text-left ${
          darkMode
            ? 'bg-gray-700 hover:bg-gray-600 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
        } transition-colors`}
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span className="text-sm font-medium truncate max-w-[120px]">
            {currentStore?.name || 'Pilih Toko'}
          </span>
        </div>
        {showDropdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {showDropdown && (
        <div
          className={`absolute right-0 mt-2 w-64 rounded-md shadow-lg z-50 ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
        >
          <div className="py-1">
            <div className={`px-4 py-2 text-xs font-semibold ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Toko Tersedia
            </div>
            {isLoading ? (
              <div className="px-4 py-3 text-sm">
                Memuat...
              </div>
            ) : (
              stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => switchStore(store.id, store.role)}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    currentStore?.id === store.id
                      ? (darkMode ? 'bg-gray-700 text-cyan-400' : 'bg-gray-100 text-cyan-600')
                      : (darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50')
                  }`}
                >
                  <div className="font-medium">{store.name}</div>
                  <div className={`text-xs ${
                    currentStore?.id === store.id
                      ? (darkMode ? 'text-cyan-300' : 'text-cyan-500')
                      : (darkMode ? 'text-gray-400' : 'text-gray-500')
                  }`}>
                    {store.role}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}