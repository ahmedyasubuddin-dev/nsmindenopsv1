
"use client";

import './globals.css';
import { AppLayout } from '@/components/app-layout';
import { Toaster } from "@/components/ui/toaster"
import { AppTitleProvider } from '@/components/app-title-context';
import { SupabaseProvider, useUser } from '@/lib/supabase/provider';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import LoginPage from './login/page';
import { hasPermission } from '@/lib/roles';
import { PrivacyPolicy } from '@/components/privacy-policy';

const APP_TITLE = 'North Sails Minden Operations Dashboard';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, role, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  
  // Hooks must be called at the top level - move useState here
  const [allowAccess, setAllowAccess] = useState(false);

  useEffect(() => {
    // Don't do any redirects while loading - wait for user state to be determined
    if (isUserLoading) {
      return;
    }
    
    const isLoginPage = pathname === '/login';
    const isReportPage = pathname.startsWith('/report');
    const isAnalyticsPage = pathname.startsWith('/analytics');
    const isReviewPage = pathname.startsWith('/review');
    const isStatusPage = pathname.startsWith('/status');
    const isQcPage = pathname.startsWith('/qc');
    const isFileProcessingPage = pathname.startsWith('/file-processing');
    const isProtectedPage = isReportPage || isAnalyticsPage || isReviewPage || isStatusPage || isQcPage || isFileProcessingPage || pathname === '/dashboard' || pathname === '/admin';

    // If user is logged in and on login page, redirect to dashboard
    if (user && isLoginPage) {
      router.replace('/dashboard');
      return;
    }
    
    // If user is logged in, check permissions
    if (user && !isLoginPage) {
        // Route protection logic
        const routePermissionMap: Record<string, any> = {
            '/admin': 'nav:admin',
            '/analytics': 'nav:analytics',
            '/dashboard': 'nav:dashboard',
            '/file-processing': 'nav:file-processing',
            '/qc': 'nav:qc',
            '/report/pregger': 'nav:report:pregger',
            '/report/tapeheads': 'nav:report:tapeheads',
            '/report/gantry': 'nav:report:gantry',
            '/report/films': 'nav:report:films',
            '/report/graphics': 'nav:report:graphics',
            '/review': 'nav:review:tapeheads',
            '/status': 'nav:status',
        };

        const requiredPermission = Object.keys(routePermissionMap).find(
            key => pathname.startsWith(key)
        );

        if (requiredPermission && !hasPermission(role, routePermissionMap[requiredPermission])) {
            console.warn(`Redirecting: Role '${role}' lacks permission for '${pathname}'`);
            router.replace('/dashboard');
        }
    }

  }, [user, role, isUserLoading, router, pathname]);

  // TEMPORARY: Allow access if loading takes too long (for testing)
  useEffect(() => {
    if (isUserLoading) {
      const timer = setTimeout(() => {
        setAllowAccess(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setAllowAccess(true);
    }
  }, [isUserLoading]);

  // If on login page, show it immediately (don't wait for loading)
  if (pathname === '/login') {
    return <LoginPage />;
  }

  // Show loading only if still loading and haven't allowed access yet
  if (isUserLoading && !allowAccess) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
            <Image src="/images/load-icon.png" alt="Loading" width={64} height={64} className="animate-pulse" />
            <p className="text-muted-foreground">Loading Operations...</p>
        </div>
    );
  }

  // TEMPORARY: Allow access even without user (for testing)
  // This bypasses the auth check so you can test user creation
  // The middleware will also allow access if cookie exists
  const isProtectedPage = pathname.startsWith('/report') || 
                          pathname.startsWith('/analytics') || 
                          pathname.startsWith('/review') || 
                          pathname.startsWith('/status') || 
                          pathname.startsWith('/qc') || 
                          pathname.startsWith('/file-processing') ||
                          pathname === '/dashboard' || 
                          pathname === '/admin';
  
  if (!user && pathname !== '/login' && isProtectedPage) {
    console.warn('⚠️  No user found but allowing access (TEMPORARY - for testing)');
    // Still render the app - components should handle null user gracefully
    // Don't redirect - let the user stay on the page
  }
  
  // Always render the app - middleware handles auth
  return <AppLayout>{children}</AppLayout>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{APP_TITLE}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
         <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className="font-body antialiased">
        <SupabaseProvider>
          <AppTitleProvider title={APP_TITLE}>
            <div className="flex flex-col min-h-screen">
              <main className="flex-grow">
                <AuthGuard>
                  {children}
                </AuthGuard>
              </main>
              <PrivacyPolicy />
            </div>
          </AppTitleProvider>
        </SupabaseProvider>
        <Toaster />
      </body>
    </html>
  );
}
