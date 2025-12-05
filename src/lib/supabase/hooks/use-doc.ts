'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../client';

export type WithId<T> = T & { id: string };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseDocOptions {
  table: string;
  id: string;
  enabled?: boolean;
}

export function useDoc<T = any>(
  options: UseDocOptions | null
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!options || !options.id || options.enabled === false) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    let isMounted = true;
    
    supabase
      .from(options.table)
      .select('*')
      .eq('id', options.id)
      .single()
      .then(({ data: result, error: queryError }) => {
        if (!isMounted) return;
        
        if (queryError) {
          if (queryError.code === 'PGRST116') {
            // Not found
            setData(null);
          } else {
            console.error(`Error fetching ${options.table}:`, queryError);
            setError(queryError as Error);
          }
        } else {
          setData(result as WithId<T>);
          setError(null);
        }
        setIsLoading(false);
      });

    // Set up real-time subscription for instant updates
    const channel = supabase
      .channel(`${options.table}_${options.id}_realtime_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: options.table,
          filter: `id=eq.${options.id}`,
        },
        (payload) => {
          if (!isMounted) return;
          
          if (payload.eventType === 'DELETE') {
            setData(null);
          } else if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setData({ ...payload.new, id: payload.new.id } as WithId<T>);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Real-time subscription active for ${options.table}:${options.id}`);
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [options?.table, options?.id, options?.enabled]);

  return { data, isLoading, error };
}




