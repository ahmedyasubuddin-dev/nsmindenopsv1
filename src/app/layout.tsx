
"use client";

import './globals.css';
import { AppLayout } from '@/components/app-layout';
import { Toaster } from "@/components/ui/toaster"
import { AppTitleProvider } from '@/components/app-title-context';
import { usePathname, useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserRole } from '@/lib/roles';
import { getRoleFromEmail } from '@/lib/roles';
import { FirebaseClientProvider, useUser } from '@/firebase';

const APP_TITLE = 'SRD: Minden Operations';

function AppContent({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (!isUserLoading) {
      const isAuthenticated = !!user;
      if (isAuthenticated && pathname === '/login') {
         router.push('/dashboard');
      } else if (!isAuthenticated && pathname !== '/login') {
        router.push('/login');
      }
    }
  }, [user, isUserLoading, pathname, router]);
  
  const isAuthenticated = !!user;

  if (isUserLoading || (!isAuthenticated && pathname !== '/login') || (isAuthenticated && pathname === '/login')) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (pathname === '/login') {
     return <>{children}</>;
  }

  return (
      <AppLayout>
        {children}
      </AppLayout>
  );
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
              <AppContent>
                {children}
              </AppContent>
          </AppTitleProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
