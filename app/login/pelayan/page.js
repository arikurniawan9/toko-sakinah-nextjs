// app/login/pelayan/page.js
import { Suspense } from 'react';
import LoginForm from '../loginForm';

export default function LoginPelayanPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm role="ATTENDANT" />
    </Suspense>
  );
}