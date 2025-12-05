import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Log that middleware is being called
  console.log(`[ROOT MIDDLEWARE] Called for: ${request.nextUrl.pathname}`);
  const result = await updateSession(request);
  console.log(`[ROOT MIDDLEWARE] Returning response for: ${request.nextUrl.pathname}`);
  return result;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};










