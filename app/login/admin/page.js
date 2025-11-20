// app/login/admin/page.js
import { Suspense } from 'react';
import LoginForm from '../loginForm';

export default function LoginAdminPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm role="ADMIN" />
    </Suspense>
  );
}