'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ROLES } from '@/lib/constants';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserThemeProvider } from '@/components/UserThemeContext';
import { SidebarProvider } from '@/components/SidebarContext';
import Link from 'next/link'; // Keep this import for the back to manager button
import { Home } from 'lucide-react'; // Keep this import for the back to manager button

export default function WarehouseLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (status !== 'authenticated' || session.user.role !== ROLES.WAREHOUSE) {
      router.push('/unauthorized');
      return;
    }

    setLoading(false);
  }, [status, session, router]);

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="WAREHOUSE">
      <UserThemeProvider>
        <SidebarProvider>
          <Sidebar>
            <div className="flex-1 p-4 min-h-screen bg-gray-50 dark:bg-gray-900">
              {session?.user?.role === ROLES.MANAGER && (
                <div className="mb-4 flex justify-end">
                  <Link href="/manager" passHref>
                    <button
                      className="px-4 py-2 rounded-lg flex items-center bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                      <Home className="h-5 w-5 mr-2" />
                      Kembali ke Dashboard Manager
                    </button>
                  </Link>
                </div>
              )}
              {children}
            </div>
          </Sidebar>
        </SidebarProvider>
      </UserThemeProvider>
    </ProtectedRoute>
  );
}
