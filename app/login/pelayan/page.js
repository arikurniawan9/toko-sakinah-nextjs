
// app/(auth)/login/pelayan/page.js
'use client';

import LoginForm from '@/components/LoginForm';

export default function AttendantLoginPage() {
  const attendantIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pastel-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  return (
    <LoginForm 
      role="ATTENDANT"
      title="Pelayan Login"
      icon={attendantIcon}
      redirectUrl="/pelayan"
    />
  );
}
