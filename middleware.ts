import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const userRole = token.role;

    // Admin-only subroutes (e.g., user management)
    if (pathname.startsWith('/dashboard/admin/users')) {
      if (userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // General Admin pages (accessible by ADMIN and STAFF for creation/management features)
    if (pathname.startsWith('/dashboard/admin')) {
      if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Staff dashboard
    if (pathname.startsWith('/dashboard/staff')) {
      if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Student dashboard & exam environment
    if (pathname.startsWith('/dashboard/student') || pathname.startsWith('/exam/')) {
      if (userRole !== 'STUDENT' && userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/exam/:path*',
  ],
};
