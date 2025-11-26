// components/ProtectedRoute.js
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated') {
      // Check if user has the required role
      // If requiredRole is an array, check if user's role is included
      let hasAccess = false;
      if (Array.isArray(requiredRole)) {
        hasAccess = requiredRole.includes(session.user.role);
      } else {
        hasAccess = !requiredRole || session.user.role === requiredRole;
      }

      if (!hasAccess) {
        // Redirect to home if user doesn't have the required role
        router.push('/');
      }
    }
  }, [status, session, router, requiredRole]);

  if (status === 'loading' || !isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-purple-500"></div>
      </div>
    );
  }

  // Check if user has access
  let hasAccess = false;
  if (Array.isArray(requiredRole)) {
    hasAccess = requiredRole.includes(session.user.role);
  } else {
    hasAccess = !requiredRole || session.user.role === requiredRole;
  }

  if (status === 'unauthenticated' || !hasAccess) {
    return null; // Render nothing while redirecting
  }

  return children;
};

export default ProtectedRoute;