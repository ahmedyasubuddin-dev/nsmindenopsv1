
"use client";

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { UserRole } from '@/lib/roles';
import { useFirestore } from '@/firebase';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string | null; role: UserRole | null };
  isLoading: boolean;
  login: (email: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
