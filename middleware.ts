// Middleware for CrowdBirthday eGift Model
// Handles session refresh only.
//
// Auth is handled at the page level via LINE LIFF (not Supabase Auth),
// so middleware does NOT redirect to /auth/login.

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Refresh Supabase session if present (for API routes using service client)
  const response = await updateSession(request);
  return response;
}

export const config = {
  matcher: [
    // Match all request paths except static assets
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
