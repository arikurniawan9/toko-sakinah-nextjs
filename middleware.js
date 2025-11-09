// middleware.js
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const rolePermissions = {
  '/admin': ['ADMIN'],
  '/kasir': ['CASHIER', 'ADMIN'],
  '/pelayan': ['ATTENDANT', 'ADMIN'],
};

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;

    for (const path in rolePermissions) {
      if (pathname.startsWith(path)) {
        const allowedRoles = rolePermissions[path];
        if (!token || !allowedRoles.includes(token.role)) {
          const url = req.nextUrl.clone();
          url.pathname = '/unauthorized'; // Redirect to unauthorized page
          return NextResponse.redirect(url);
        }
        break; // No need to check other paths if a match is found
      }
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: '/',
    },
  }
);

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|unauthorized).*)',
  ],
};