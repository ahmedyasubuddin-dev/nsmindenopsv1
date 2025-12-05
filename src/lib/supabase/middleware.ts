import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasPermission, type Permission, type UserRole } from '@/lib/roles';

export async function updateSession(request: NextRequest) {
  // ALWAYS log to verify middleware is running
  const path = request.nextUrl.pathname;
  console.log(`[MIDDLEWARE] ===== RUNNING for: ${path} =====`);

  try {
    let supabaseResponse = NextResponse.next({
      request,
    });

    // Check for custom session cookie
    const authCookie = request.cookies.get('ns-session-token');
    let user = null;

    if (authCookie?.value) {
      try {
        // Decode custom session token
        const sessionData = JSON.parse(Buffer.from(authCookie.value, 'base64').toString());

        // Validate session (check if not expired - 7 days)
        const sessionAge = Date.now() - sessionData.timestamp;
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

        if (sessionAge < maxAge) {
          user = {
            id: sessionData.userId,
            email: sessionData.email,
            user_metadata: {
              username: sessionData.username,
              role: sessionData.role,
            },
          };
          console.log(`[MIDDLEWARE] Custom session valid for user: ${user.id} (${sessionData.username})`);
        } else {
          console.warn(`[MIDDLEWARE] Session expired (${Math.floor(sessionAge / 1000 / 60 / 60)} hours old)`);
        }
      } catch (error) {
        console.error(`[MIDDLEWARE] Error decoding custom session:`, error);
      }
    }

    // ALWAYS log - critical for debugging
    const cookieNames = request.cookies.getAll().map(c => c.name);
    console.log(`[MIDDLEWARE] Path: ${request.nextUrl.pathname}`);
    console.log(`[MIDDLEWARE] User: ${user?.id || 'none'}`);
    console.log(`[MIDDLEWARE] Cookies found: ${cookieNames.length} - ${cookieNames.join(', ') || 'NONE'}`);
    console.log(`[MIDDLEWARE] Auth cookie exists: ${!!authCookie}, value length: ${authCookie?.value?.length || 0}`);

    // Allow access to login page, API routes, and static files without auth
    const isPublicPath =
      request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/api/auth') ||
      request.nextUrl.pathname === '/';

    if (!user && !isPublicPath) {
      // For API routes, return 401 JSON instead of redirecting
      if (request.nextUrl.pathname.startsWith('/api/')) {
        console.log(`[MIDDLEWARE] ❌ No user found for API route ${request.nextUrl.pathname}, returning 401`);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // no user, redirect to login page
      console.log(`[MIDDLEWARE] ❌ No user found, redirecting to /login from ${request.nextUrl.pathname}`);
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Create response with request headers
    const requestHeaders = new Headers(request.headers);

    // Security: Remove any user-supplied headers to prevent spoofing
    requestHeaders.delete('x-user-id');
    requestHeaders.delete('x-user-role');
    requestHeaders.delete('x-user-username');

    if (user) {
      requestHeaders.set('x-user-id', user.id);
      requestHeaders.set('x-user-role', user.user_metadata.role || '');
      requestHeaders.set('x-user-username', user.user_metadata.username || '');
      console.log(`[MIDDLEWARE] Injecting headers: x-user-role=${user.user_metadata.role}`);
    }

    // Create final response with updated headers
    supabaseResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Copy cookies from original response (if any were set by Supabase client, though we aren't using it much now)
    // But we need to preserve the custom session cookie if we were refreshing it (not implemented yet)

    // Check permissions
    if (user) {
      const userRole = user.user_metadata.role as UserRole;
      const path = request.nextUrl.pathname;

      // Define protected routes and their required permissions
      // Order matters: more specific paths should come first
      const protectedRoutes: { prefix: string; permission: Permission }[] = [
        { prefix: '/admin', permission: 'nav:admin' },
        { prefix: '/report/pregger', permission: 'nav:report:pregger' },
        { prefix: '/report/tapeheads', permission: 'nav:report:tapeheads' },
        { prefix: '/report/gantry', permission: 'nav:report:gantry' },
        { prefix: '/report/films', permission: 'nav:report:films' },
        { prefix: '/report/graphics', permission: 'nav:report:graphics' },
        { prefix: '/review/tapeheads', permission: 'nav:review:tapeheads' },
        { prefix: '/qc', permission: 'nav:qc' },
        { prefix: '/status', permission: 'nav:status' },
        { prefix: '/file-processing', permission: 'nav:file-processing' },
        { prefix: '/analytics/pregger', permission: 'nav:analytics:pregger' },
        { prefix: '/analytics/tapeheads', permission: 'nav:analytics:tapeheads' },
        { prefix: '/analytics/gantry', permission: 'nav:analytics:gantry' },
        { prefix: '/analytics/films', permission: 'nav:analytics:films' },
        { prefix: '/analytics/graphics', permission: 'nav:analytics:graphics' },
        { prefix: '/analytics', permission: 'nav:analytics' },
      ];

      for (const route of protectedRoutes) {
        if (path.startsWith(route.prefix)) {
          if (!hasPermission(userRole, route.permission)) {
            console.log(`[MIDDLEWARE] ⛔ Access denied for user ${user.id} (${userRole}) to ${path}. Missing permission: ${route.permission}`);
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard';
            return NextResponse.redirect(url);
          }
          break; // Stop checking after first match
        }
      }
    }

    console.log(`[MIDDLEWARE] ✅ User authenticated: ${user?.id}, allowing access to ${request.nextUrl.pathname}`);

    return supabaseResponse;
  } catch (error: any) {
    console.error(`[MIDDLEWARE] ❌ ERROR: ${error.message}`, error);
    // Return a response even on error to prevent hanging
    return NextResponse.next({ request });
  }
}

