'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ROLES } from '@/lib/constants';
import {
  LayoutDashboard,
  Store,
  Package,
  Users,
  FileText,
  Activity,
  Settings,
  TrendingUp,
  ShoppingCart,
  BarChart3
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserThemeProvider } from '@/components/UserThemeContext';
import { SidebarProvider } from '@/components/SidebarContext';

// Menu items untuk sidebar manager
const menuItems = [
  {
    title: "Dashboard",
    href: "/manager",
    icon: LayoutDashboard,
  },
  {
    title: "Kelola Toko",
    href: "/manager/stores",
    icon: Store,
    children: [
      { title: "Daftar Toko", href: "/manager/stores", icon: Store },
      { title: "Buat Toko Baru", href: "/manager/create-store", icon: Store },
      { title: "Monitor Semua Toko", href: "/manager/monitor-all", icon: Activity },
    ]
  },
  {
    title: "Gudang Pusat",
    href: "/warehouse",
    icon: Package,
    children: [
      { title: "Stok Gudang", href: "/warehouse/stock", icon: Package },
      { title: "Distribusi ke Toko", href: "/warehouse/distribution", icon: TrendingUp },
      { title: "Pembelian Gudang", href: "/warehouse/purchase", icon: ShoppingCart },
    ]
  },
  {
    title: "Laporan",
    href: "/manager/reports",
    icon: FileText,
    children: [
      { title: "Laporan Gabungan", href: "/manager/reports", icon: FileText },
      { title: "Penjualan Gabungan", href: "/manager/reports/sales", icon: BarChart3 },
      { title: "Performa Toko", href: "/manager/reports/performance", icon: TrendingUp },
    ]
  },
  {
    title: "Pengguna",
    href: "/manager/users",
    icon: Users,
    children: [
      { title: "Manajemen Pengguna", href: "/manager/users", icon: Users },
      { title: "Aktivitas Sistem", href: "/manager/users/activity", icon: Activity },
    ]
  },
  {
    title: "Pengaturan",
    href: "/manager/settings",
    icon: Settings,
  }
];

export default function ManagerLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (status !== 'authenticated' || session.user.role !== ROLES.MANAGER) {
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
    <ProtectedRoute requiredRole="MANAGER">
      <UserThemeProvider>
        <SidebarProvider>
          <Sidebar menuItems={menuItems}>
            <div className="flex-1 p-4 min-h-screen bg-gray-50 dark:bg-gray-900">
              {children}
            </div>
          </Sidebar>
        </SidebarProvider>
      </UserThemeProvider>
    </ProtectedRoute>
  );
}