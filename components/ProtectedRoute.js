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
        // Check if user's role is in the required roles
        hasAccess = requiredRole.includes(session.user.role);
        // For ADMIN role, also allow access if the user has store context (store admin)
        if (!hasAccess && requiredRole.includes('ADMIN') && session.user.role === 'ADMIN' && session.user.storeId) {
          hasAccess = true;
        }
      } else {
        hasAccess = !requiredRole || session.user.role === requiredRole;
        // Special handling for ADMIN role - allow store admins who have store context
        if (!hasAccess && requiredRole === 'ADMIN' && session.user.role === 'ADMIN' && session.user.storeId) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        // Redirect to unauthorized page if user doesn't have the required role
        router.push('/unauthorized');
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
    // For ADMIN role, also allow access if the user has store context (store admin)
    if (!hasAccess && requiredRole.includes('ADMIN') && session.user.role === 'ADMIN' && session.user.storeId) {
      hasAccess = true;
    }
  } else {
    hasAccess = !requiredRole || session.user.role === requiredRole;
    // Special handling for ADMIN role - allow store admins who have store context
    if (!hasAccess && requiredRole === 'ADMIN' && session.user.role === 'ADMIN' && session.user.storeId) {
      hasAccess = true;
    }
  }

  if (status === 'unauthenticated' || !hasAccess) {
    return null; // Render nothing while redirecting
  }

  return children;
};

export default ProtectedRoute;