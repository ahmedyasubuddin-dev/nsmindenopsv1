'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../client';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseCollectionOptions {
  table: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  enabled?: boolean;
  limit?: number;
  dateRange?: {
    column: string;
    from?: Date | string;
    to?: Date | string;
  };
}

export function useCollection<T = any>(
  options: UseCollectionOptions | null
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!options || options.enabled === false) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    console.log(`🔄 Starting fetch for ${options.table}...`);
    console.log(`Query options:`, {
      table: options.table,
      dateRange: options.dateRange,
      filters: options.filters,
      limit: options.limit,
      orderBy: options.orderBy,
    });
    
    let query = supabase.from(options.table).select('*');

    // Apply date range filter (more efficient than client-side filtering)
    if (options.dateRange) {
      const { column, from, to } = options.dateRange;
      if (from) {
        const fromDate = typeof from === 'string' ? from : from.toISOString();
        console.log(`Applying date filter: ${column} >= ${fromDate}`);
        query = query.gte(column, fromDate);
      }
      if (to) {
        const toDate = typeof to === 'string' ? to : to.toISOString();
        console.log(`Applying date filter: ${column} <= ${toDate}`);
        query = query.lte(column, toDate);
      }
    }

    // Apply filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true,
      });
    }

    // Apply limit (default to 500 for analytics to prevent loading all data)
    if (options.limit) {
      query = query.limit(options.limit);
    } else if (!options.limit && (options.table.includes('_submissions') || options.table.includes('_reports') || options.table.includes('_tasks'))) {
      // Default limit for large tables (analytics) - only if no explicit limit set
      query = query.limit(500);
    }

    // Initial fetch with timeout
    let isMounted = true;
    
    // Set a timeout to prevent infinite loading (increased to 15 seconds for slow queries)
    const fetchTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn(`⚠️ Fetch timeout for ${options.table} - setting loading to false`);
        console.warn(`Query details:`, {
          table: options.table,
          dateRange: options.dateRange,
          filters: options.filters,
          limit: options.limit,
        });
        setIsLoading(false);
        // Set empty data if we haven't received any yet
        setData((prevData) => prevData || []);
        // Set error to indicate timeout
        setError(new Error(`Query timeout after 15 seconds for table: ${options.table}`));
      }
    }, 15000); // 15 second timeout
    
        query
          .then(({ data: result, error: queryError }) => {
            clearTimeout(fetchTimeout);
            if (!isMounted) return;

            if (queryError) {
              console.error(`❌ Error fetching ${options.table}:`, queryError);
              console.error(`Query details:`, {
                table: options.table,
                dateRange: options.dateRange,
                filters: options.filters,
                limit: options.limit,
              });
              
              // Check if it's an RLS/auth error
              if (queryError.code === 'PGRST301' || queryError.message?.includes('permission denied') || queryError.message?.includes('RLS')) {
                console.error(`🔒 RLS/Auth Error: User may not be authenticated. Check session.`);
                setError(new Error(`Authentication required: ${queryError.message}`));
              } else {
                setError(queryError as Error);
              }
              setData([]);
            } else {
              console.log(`✅ Successfully fetched ${options.table}:`, result?.length || 0, 'items');
              setData((result || []) as WithId<T>[]);
              setError(null);
            }
            setIsLoading(false);
          })
          .catch((error) => {
            clearTimeout(fetchTimeout);
            if (!isMounted) return;
            console.error(`❌ Exception fetching ${options.table}:`, error);
            
            // Check if it's an auth/RLS issue
            if (error.message?.includes('permission') || error.message?.includes('RLS') || error.message?.includes('auth')) {
              console.error(`🔒 Possible RLS/Auth Error: ${error.message}`);
              setError(new Error(`Authentication required: ${error.message}`));
            } else {
              setError(error as Error);
            }
            setData([]);
            setIsLoading(false);
          });

    // Set up real-time subscription for instant updates (optional - fails gracefully)
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let subscriptionRetryCount = 0;
    const maxRetries = 2;
    let retryTimeout: NodeJS.Timeout | null = null;

    const setupSubscription = () => {
      try {
        // Remove existing channel if retrying
        if (channel) {
          try {
            supabase.removeChannel(channel);
          } catch (e) {
            // Ignore
          }
        }
        
        channel = supabase
          .channel(`${options.table}_realtime_${Date.now()}_${Math.random()}`)
          .on(
            'postgres_changes',
            {
              event: '*', // INSERT, UPDATE, DELETE
              schema: 'public',
              table: options.table,
            },
            (payload) => {
              if (!isMounted) return;
              
              setData((currentData) => {
                const existing = currentData || [];
                
                if (payload.eventType === 'INSERT') {
                  return [...existing, { ...payload.new, id: payload.new.id } as WithId<T>];
                } else if (payload.eventType === 'UPDATE') {
                  return existing.map(item => 
                    item.id === payload.new.id 
                      ? { ...payload.new, id: payload.new.id } as WithId<T>
                      : item
                  );
                } else if (payload.eventType === 'DELETE') {
                  return existing.filter(item => item.id !== payload.old.id);
                }
                return existing;
              });
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log(`✅ Real-time subscription active for ${options.table}`);
              subscriptionRetryCount = 0; // Reset retry count on success
            } else if (status === 'CHANNEL_ERROR') {
              console.warn(`⚠️ Real-time subscription error for ${options.table} (non-critical - app will continue to work)`);
              // Don't throw error - app continues to work without real-time
              // Optionally retry if we haven't exceeded max retries
              if (subscriptionRetryCount < maxRetries && isMounted) {
                subscriptionRetryCount++;
                retryTimeout = setTimeout(() => {
                  if (isMounted) {
                    setupSubscription();
                  }
                }, 2000 * subscriptionRetryCount); // Exponential backoff
              }
            } else if (status === 'TIMED_OUT') {
              console.warn(`⏱️ Real-time subscription timed out for ${options.table} (non-critical)`);
            } else if (status === 'CLOSED') {
              console.warn(`🔌 Real-time subscription closed for ${options.table} (non-critical)`);
            }
          });
      } catch (error) {
        // Silently fail - real-time is optional
        console.warn(`⚠️ Failed to set up real-time subscription for ${options.table}:`, error);
        console.warn('App will continue to work without real-time updates');
      }
    };

    // Try to set up subscription, but don't fail if it doesn't work
    setupSubscription();

    return () => {
      isMounted = false;
      clearTimeout(fetchTimeout);
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [
    options?.table,
    JSON.stringify(options?.filters),
    JSON.stringify(options?.orderBy),
    JSON.stringify(options?.dateRange),
    options?.limit,
    options?.enabled,
  ]);

  return { data, isLoading, error };
}




