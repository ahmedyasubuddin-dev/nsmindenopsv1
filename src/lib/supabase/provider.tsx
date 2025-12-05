'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from './client';
import type { User } from '@supabase/supabase-js';
import type { UserRole } from '@/lib/roles';

interface CustomUser {
  id: string;
  username: string;
  role: UserRole | null;
  email?: string;
  displayName?: string;
}

interface SupabaseContextState {
  user: CustomUser | null;
  supabaseUser: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  role: UserRole | null;
}

const SupabaseContext = createContext<SupabaseContextState | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('Session check timeout - assuming no user');
        setIsUserLoading(false);
      }
    }, 5000);

    // Read custom session cookie instead of Supabase Auth
    const readCustomSession = () => {
      try {
        // Get the custom session cookie
        const cookies = document.cookie.split(';');
        console.log('[Provider] All cookies:', cookies);
        const sessionCookie = cookies.find(c => c.trim().startsWith('ns-session-token='));

        if (!sessionCookie) {
          console.warn('[SupabaseProvider] No custom session cookie found');
          setIsUserLoading(false);
          return null;
        }

        let sessionToken = sessionCookie.substring(sessionCookie.indexOf('=') + 1);
        // Handle potentially URI-encoded cookies
        if (sessionToken.includes('%')) {
          sessionToken = decodeURIComponent(sessionToken);
        }

        const jsonString = Buffer.from(sessionToken, 'base64').toString('utf-8').trim();
        console.log('[Provider] Decoded JSON string:', jsonString);
        const sessionData = JSON.parse(jsonString);

        console.log('[SupabaseProvider] Custom session found for user:', sessionData.userId);
        console.log('[Provider] Session data:', sessionData);
        console.log('[Provider] Role from session:', sessionData.role);

        return sessionData;
      } catch (error) {
        console.error('[SupabaseProvider] Error reading custom session:', error);
        setIsUserLoading(false);
        return null;
      }
    };

    // Get initial session from custom cookie
    const sessionData = readCustomSession();
    clearTimeout(loadingTimeout);

    if (!isMounted) return;

    if (sessionData?.userId) {
      console.log('[Provider] Creating mock user with role:', sessionData.role);

      // Create a mock Supabase user from our session data
      const mockUser: User = {
        id: sessionData.userId,
        email: sessionData.email,
        user_metadata: {
          username: sessionData.username,
          role: sessionData.role,
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;

      setSupabaseUser(mockUser);
      fetchUserProfile(sessionData.userId);
    } else {
      console.warn('[SupabaseProvider] No session found - user not authenticated');
      setIsUserLoading(false);
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        setSupabaseUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        // Only clear user if we're sure there's no session
        // Don't clear on TOKEN_REFRESHED events
        if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          setSupabaseUser(null);
          setUser(null);
          setRole(null);
          setIsUserLoading(false);
        }
      }
    });

    async function fetchUserProfile(userId: string) {
      try {
        // First, get the auth user to get email (if available)
        const { data: { user: authUser } } = await supabase.auth.getUser();

        // If no auth user, we might still have a custom session user (passed as userId)
        if (!authUser && !userId) {
          setIsUserLoading(false);
          return;
        }

        // Try to fetch existing profile with timeout
        const profilePromise = supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => resolve({ data: null, error: { code: 'TIMEOUT', message: 'Profile fetch timeout' } }), 5000);
        });

        const result = await Promise.race([profilePromise, timeoutPromise]) as any;
        let { data: profile, error } = result;

        if (error?.code === 'TIMEOUT') {
          console.warn('Profile fetch timeout - using auth user data');
          const customUser: CustomUser = {
            id: userId, // Use the ID we tried to fetch with
            username: authUser?.email?.split('@')[0] || 'user',
            role: (authUser?.user_metadata?.role as UserRole) || null,
            email: authUser?.email,
            displayName: authUser?.user_metadata?.display_name,
          };
          setUser(customUser);
          setRole(customUser.role);
          setIsUserLoading(false);
          return;
        }

        // If profile doesn't exist, create it
        if (error && error.code === 'PGRST116') {
          console.log('User profile not found, creating...');

          // Create user profile using authUser data if available, otherwise fallback to userId
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
              id: userId,
              email: authUser?.email || '',
              username: authUser?.email?.split('@')[0] || 'user',
              role: (authUser?.user_metadata?.role as UserRole) || 'tapehead_operator',
              active: true,
              display_name: authUser?.user_metadata?.display_name || authUser?.email?.split('@')[0] || 'User',
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating user profile:', createError);
            // Still set user with basic info from auth or session
            const customUser: CustomUser = {
              id: userId,
              username: authUser?.email?.split('@')[0] || 'user',
              role: (authUser?.user_metadata?.role as UserRole) || null,
              email: authUser?.email,
              displayName: authUser?.user_metadata?.display_name,
            };
            setUser(customUser);
            setRole(customUser.role);
            setIsUserLoading(false);
            return;
          }

          profile = newProfile;
        } else if (error) {
          console.error('Error fetching user profile:', error);
          // Still set user with basic info from auth or session
          const customUser: CustomUser = {
            id: userId,
            username: authUser?.email?.split('@')[0] || 'user',
            role: (authUser?.user_metadata?.role as UserRole) || null,
            email: authUser?.email,
            displayName: authUser?.user_metadata?.display_name,
          };
          setUser(customUser);
          setRole(customUser.role);
          setIsUserLoading(false);
          return;
        }

        if (profile) {
          const customUser: CustomUser = {
            id: profile.id,
            username: profile.username || profile.email,
            role: profile.role as UserRole,
            email: profile.email,
            displayName: profile.display_name,
          };
          setUser(customUser);
          setRole(customUser.role);

          // Update auth user metadata with role for JWT claims
          if (authUser && authUser.user_metadata?.role !== profile.role) {
            supabase.auth.updateUser({
              data: { role: profile.role },
            }).catch(err => {
              console.warn('Failed to update user metadata:', err);
            });
          }
        } else {
          // Fallback to auth user data
          const customUser: CustomUser = {
            id: userId,
            username: authUser?.email?.split('@')[0] || 'user',
            role: (authUser?.user_metadata?.role as UserRole) || null,
            email: authUser?.email,
            displayName: authUser?.user_metadata?.display_name,
          };
          setUser(customUser);
          setRole(customUser.role);
        }
        setIsUserLoading(false);
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
        setUserError(error as Error);
        setIsUserLoading(false);
      }
    }

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SupabaseContext.Provider
      value={{
        user,
        supabaseUser,
        isUserLoading,
        userError,
        role,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}

export function useUser() {
  const { user, isUserLoading, userError, role } = useSupabase();
  return { user, isUserLoading, userError, role };
}

export function useAuth() {
  const supabase = createClient();
  return supabase.auth;
}



