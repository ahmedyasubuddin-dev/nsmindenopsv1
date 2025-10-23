
"use client";

import './globals.css';
import { AppLayout } from '@/components/app-layout';
import { Toaster } from "@/components/ui/toaster"
import { AppTitleProvider } from '@/components/app-title-context';
import { FirebaseClientProvider, useUser } from '@/firebase';
import React, { useEffect }from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/icons';
import LoginPage from './login/page';
import { hasPermission } from '@/lib/roles';
import { PrivacyPolicy } from '@/components/privacy-policy';

const APP_TITLE = 'SRD: Minden Operations';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, role, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait for user state to be determined
    }
    
    const isLoginPage = pathname === '/login';

    if (!user && !isLoginPage) {
      router.replace('/login');
    } else if (user && isLoginPage) {
      router.replace('/dashboard');
    } else if (user && !isLoginPage) {
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

  if (isUserLoading || (!user && pathname !== '/login')) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
            <Logo className="size-16 animate-pulse text-primary" />
            <p className="text-muted-foreground">Loading Operations...</p>
        </div>
    );
  }

  if (!user) {
    return <LoginPage />;
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
            <div className="flex flex-col min-h-screen">
              <main className="flex-grow">
                <AuthGuard>
                  {children}
                </AuthGuard>
              </main>
              <PrivacyPolicy />
            </div>
          </AppTitleProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
