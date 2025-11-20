// app/login/kasir/page.js
import { Suspense } from 'react';
import LoginForm from '../loginForm';

export default function LoginKasirPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm role="CASHIER" />
    </Suspense>
  );
}