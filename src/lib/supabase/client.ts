'use client';

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // Debug: Check session on client creation
  client.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
      console.warn('[Supabase Client] Session check error:', error);
    } else if (!session) {
      console.warn('[Supabase Client] No active session found');
    } else {
      console.log('[Supabase Client] Active session found for user:', session.user.id);
    }
  }).catch(err => {
    console.warn('[Supabase Client] Failed to check session:', err);
  });
  
  return client;
}










