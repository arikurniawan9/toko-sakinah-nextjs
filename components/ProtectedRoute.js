// components/ProtectedRoute.js
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated') {
      // Check if user has the required role
      if (requiredRole && session.user.role !== requiredRole) {
        // Redirect to home if user doesn't have the required role
        router.push('/');
      }
    }
  }, [status, session, router, requiredRole]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-purple-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated' || (requiredRole && session?.user.role !== requiredRole)) {
    return null; // Render nothing while redirecting
  }

  return children;
};

export default ProtectedRoute;