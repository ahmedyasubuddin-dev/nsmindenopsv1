
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

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isUserLoading, role } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) return; // Wait until user is loaded

    if (!user && pathname !== '/login') {
      router.push('/login');
      return;
    }
    
    if (user && pathname === '/login') {
        router.push('/dashboard');
        return;
    }
    
    // Admin route guard
    if (pathname.startsWith('/admin') && !hasPermission(role, 'nav:admin')) {
      router.push('/dashboard'); // Or a dedicated "not-authorized" page
    }

  }, [user, isUserLoading, pathname, router, role]);

  if (pathname === '/login') {
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
