
"use client";

import './globals.css';
import { AppLayout } from '@/components/app-layout';
import { Toaster } from "@/components/ui/toaster"
import { AppTitleProvider } from '@/components/app-title-context';
import { FirebaseClientProvider, useUser } from '@/firebase';
import React, { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import LoginPage from './login/page';
import { hasPermission } from '@/lib/roles';

const APP_TITLE = 'SRD: Minden Operations';

const publicRoutes = ['/login'];

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isUserLoading, role } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) return; // Wait until user is loaded

    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user && !isPublicRoute) {
      router.push('/login');
      return;
    }
    
    if (user && isPublicRoute) {
        router.push('/dashboard');
        return;
    }

    if (user && !isPublicRoute) {
      // Check permissions for the current route
      const routePermissionMap: { [key: string]: any } = {
        '/admin': 'nav:admin',
        '/report/pregger': 'nav:report:pregger',
        '/report/tapeheads': 'nav:report:tapeheads',
        '/report/gantry': 'nav:report:gantry',
        '/report/films': 'nav:report:films',
        '/report/graphics': 'nav:report:graphics',
        '/review/tapeheads': 'nav:review:tapeheads',
        '/qc/inspection': 'nav:qc',
        '/file-processing': 'nav:file-processing',
        '/status/tapeheads': 'nav:status',
        '/analytics/pregger': 'nav:analytics:pregger',
        '/analytics/tapeheads': 'nav:analytics:tapeheads',
        '/analytics/gantry': 'nav:analytics:gantry',
        '/analytics/films': 'nav:analytics:films',
        '/analytics/graphics': 'nav:analytics:graphics',
      };

      // Find the permission required for the current route
      const requiredPermission = Object.keys(routePermissionMap).find(
        (key) => pathname.startsWith(key)
      );
      
      if (requiredPermission && !hasPermission(role, routePermissionMap[requiredPermission])) {
         router.push('/dashboard'); // Or a dedicated "not-authorized" page
      }
    }


  }, [user, isUserLoading, pathname, router, role]);

  if (publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  if (isUserLoading || !user) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div>Loading...</div>
        </div>
    );
  }
  
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
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <AppTitleProvider title={APP_TITLE}>
            <AuthGuard>
              {children}
            </AuthGuard>
          </AppTitleProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
