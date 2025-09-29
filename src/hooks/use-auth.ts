
"use client";

import { createContext, useContext } from 'react';
import type { UserRole } from '@/lib/roles';

// This file only defines the types and context for the *application's* auth state,
// which is managed in the layout file. The actual Firebase logic is in layout.tsx.

interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string | null; role: UserRole | null };
  isLoading: boolean;
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
