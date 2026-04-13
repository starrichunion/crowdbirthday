// Middleware for CrowdBirthday eGift Model
// Handles session refresh and route protection
//
// Protected routes (require auth):
//   /dashboard, /campaign/:id/egift, /campaign/create
//
// Public routes (no auth required):
//   /, /campaign/new, /campaign/[id], /approval/[token],
//   /auth/login, /api/*, /how-it-works, /legal/*

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Refresh auth session
  const response = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // Check if route requires authentication
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.match(/^\/campaign\/[^/]+\/egift/) ||
    pathname === '/campaign/create';

  if (isProtectedRoute) {
    // Get session from cookies
    const session = request.cookies.get('sb-auth-token');

    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match all request paths except static assets
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
