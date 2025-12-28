import { Package, Users, ShoppingCart, BarChart3, Settings, FileDown, Warehouse } from 'lucide-react';

export const adminMenuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: BarChart3,
  },
  {
    title: 'Manajemen Toko',
    href: '/admin/stores',
    icon: ShoppingCart,
  },
  {
    title: 'Manajemen Gudang',
    href: '/admin/warehouses',
    icon: Warehouse,
  },
  {
    title: 'Manajemen Pengguna',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Distribusi',
    href: '/admin/distributions',
    icon: Package,
  },
  {
    title: 'Backup & Restore',
    href: '/admin/database-backup-restore',
    icon: FileDown,
  },
  {
    title: 'Pengaturan',
    href: '/admin/settings',
    icon: Settings,
  },
];

export const warehouseMenuItems = [
  {
    title: 'Dashboard',
    href: '/warehouse',
    icon: BarChart3,
  },
  {
    title: 'Distribusi ke Toko',
    href: '/warehouse/distribution',
    icon: Package,
  },
  {
    title: 'Riwayat Distribusi',
    href: '/warehouse/distribution/history',
    icon: Package,
  },
  {
    title: 'Stok Gudang',
    href: '/warehouse/stock',
    icon: Warehouse,
  },
  {
    title: 'Toko',
    href: '/warehouse/stores',
    icon: ShoppingCart,
  },
  {
    title: 'Backup & Restore',
    href: '/warehouse/database-backup-restore',
    icon: FileDown,
  },
];