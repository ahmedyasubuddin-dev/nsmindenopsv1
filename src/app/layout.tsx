
"use client";

import './globals.css';
import { AppLayout } from '@/components/app-layout';
import { Toaster } from "@/components/ui/toaster"
import { AppTitleProvider } from '@/components/app-title-context';
import { FirebaseClientProvider, useUser } from '@/firebase';
import React, { useEffect }from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/icons';

const APP_TITLE = 'SRD: Minden Operations';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
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
    }
  }, [user, isUserLoading, router, pathname]);

  if (isUserLoading || (!user && pathname !== '/login')) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
            <Logo className="size-16 animate-pulse text-primary" />
            <p className="text-muted-foreground">Loading Operations...</p>
        </div>
    );
  }

  if (!user && pathname === '/login') {
    return <>{children}</>;
  }
  
  if (user) {
    return <AppLayout>{children}</AppLayout>;
  }

  return null;
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
