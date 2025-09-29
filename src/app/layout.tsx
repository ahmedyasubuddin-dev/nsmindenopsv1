
"use client";

import './globals.css';
import { AppLayout } from '@/components/app-layout';
import { Toaster } from "@/components/ui/toaster"
import { AppTitleProvider } from '@/components/app-title-context';
import { usePathname, useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { AuthContext, useAuth } from '@/hooks/use-auth';
import type { UserRole } from '@/lib/roles';
import { getRoleFromEmail } from '@/lib/roles';
import { FirebaseClientProvider } from '@/firebase';

const APP_TITLE = 'SRD: Minden Operations';

function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email: string | null; role: UserRole | null }>({ email: null, role: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userCookie = Cookies.get('auth_user');
    if (userCookie) {
      const role = getRoleFromEmail(userCookie);
      setIsAuthenticated(true);
      setUser({ email: userCookie, role });
    } else {
      setIsAuthenticated(false);
      setUser({ email: null, role: null });
    }
    setIsLoading(false);
  }, []);

  const login = (email: string) => {
    const role = getRoleFromEmail(email);
    Cookies.set('auth_user', email, { expires: 7 });
    setIsAuthenticated(true);
    setUser({ email, role });
  };

  const logout = () => {
    Cookies.remove('auth_user');
    setIsAuthenticated(false);
    setUser({ email: null, role: null });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};


function AppContent({ children }: { children: ReactNode }) {
  const {isAuthenticated, isLoading} = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && pathname === '/login') {
         router.push('/dashboard');
      } else if (!isAuthenticated && pathname !== '/login') {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);
  
  if (isLoading || (!isAuthenticated && pathname !== '/login') || (isAuthenticated && pathname === '/login')) {
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
          <AuthProvider>
              <AppTitleProvider title={APP_TITLE}>
                  <AppContent>
                    {children}
                  </AppContent>
              </AppTitleProvider>
            </AuthProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
