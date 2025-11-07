// middleware.js
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  // The callback function receives the token from the session
  function middleware(req) {
    // This function runs for authenticated users only
    const pathname = req.nextUrl.pathname;
    const token = req.nextauth.token;

    // Role-based access control
    if (pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
      // Redirect unauthorized users trying to access admin routes
      const url = req.nextUrl.clone();
      url.pathname = '/';
      return Response.redirect(url);
    }

    if (pathname.startsWith('/kasir') && token?.role !== 'CASHIER' && token?.role !== 'ADMIN') {
      // Cashier routes can be accessed by Cashier or Admin
      const url = req.nextUrl.clone();
      url.pathname = '/';
      return Response.redirect(url);
    }

    if (pathname.startsWith('/pelayan') && token?.role !== 'ATTENDANT' && token?.role !== 'ADMIN') {
      // Pelayan routes can be accessed by Attendant or Admin
      const url = req.nextUrl.clone();
      url.pathname = '/';
      return Response.redirect(url);
    }
  },
  {
    // Specify pages that require authentication
    pages: {
      signIn: '/',
    },
  }
);

// Define which paths the middleware should run for
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login pages)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
};