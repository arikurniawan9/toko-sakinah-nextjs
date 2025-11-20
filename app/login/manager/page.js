// app/login/manager/page.js
import { Suspense } from 'react';
import LoginForm from '../loginForm';

export default function LoginManagerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm role="MANAGER" />
    </Suspense>
  );
}