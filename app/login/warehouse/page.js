// app/login/warehouse/page.js
import { Suspense } from 'react';
import LoginForm from '../loginForm';

export default function LoginWarehousePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm role="WAREHOUSE" />
    </Suspense>
  );
}