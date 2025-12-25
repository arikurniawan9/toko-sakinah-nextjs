// app/admin/page.js
'use client';

import ProtectedRoute from '../../components/ProtectedRoute';
import Dashboard from '../../components/admin/Dashboard';
import Breadcrumb from '@/components/Breadcrumb';
import { useUserTheme } from '@/components/UserThemeContext';

export default function AdminDashboardPage() {
    const { userTheme } = useUserTheme();
    const breadcrumbItems = [{ title: 'Dashboard', href: '/admin' }];

  return (
    <ProtectedRoute requiredRole="ADMIN">
       <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <Breadcrumb items={breadcrumbItems} darkMode={userTheme.darkMode} />
            <Dashboard />
       </div>
    </ProtectedRoute>
  );
}