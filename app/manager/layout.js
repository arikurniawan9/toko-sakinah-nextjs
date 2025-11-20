// app/manager/layout.js
'use client';

import AdminLayout from '../admin/layout';

export default function ManagerLayout({ children }) {
  return <AdminLayout>{children}</AdminLayout>;
}
