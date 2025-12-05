import { NextRequest } from 'next/server';
import { createServiceClient } from './supabase/server';

export interface CustomSession {
    userId: string;
    username: string;
    role: string;
    email: string;
    timestamp: number;
}

/**
 * Validates a custom session cookie and returns the session data
 */
export async function validateCustomSession(request: NextRequest): Promise<CustomSession | null> {
    try {
        // 1. Check for headers injected by middleware (Most reliable)
        const headerUserId = request.headers.get('x-user-id');
        const headerRole = request.headers.get('x-user-role');
        const headerUsername = request.headers.get('x-user-username');

        console.log('[validateCustomSession] Headers:', {
            'x-user-id': headerUserId,
            'x-user-role': headerRole,
            'x-user-username': headerUsername
        });

        if (headerUserId && headerRole) {
            console.log('[validateCustomSession] Using middleware injected headers');
            return {
                userId: headerUserId,
                username: headerUsername || '',
                role: headerRole,
                email: '', // Not strictly needed for RBAC, but could be added to headers if needed
                timestamp: Date.now(),
            };
        }

        // 2. Fallback: Check custom session cookie
        const authCookie = request.cookies.get('ns-session-token');

        console.log('[validateCustomSession] Cookie exists:', !!authCookie);
        console.log('[validateCustomSession] All cookies:', request.cookies.getAll().map(c => c.name));

        let tokenValue = authCookie?.value;

        // Fallback: Check custom header
        if (!tokenValue) {
            const headerToken = request.headers.get('X-Session-Token');
            if (headerToken) {
                console.log('[validateCustomSession] Found token in X-Session-Token header');
                tokenValue = headerToken;
            }
        }

        if (!tokenValue) {
            console.warn('[validateCustomSession] No auth cookie or header found');
            return null;
        }

        // Decode the session token
        const sessionData = JSON.parse(Buffer.from(tokenValue, 'base64').toString()) as CustomSession;

        console.log('[validateCustomSession] Decoded session:', sessionData.username, sessionData.role);

        // Validate session age (7 days max)
        const sessionAge = Date.now() - sessionData.timestamp;
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        if (sessionAge >= maxAge) {
            console.warn(`Session expired for user: ${sessionData.username}`);
            return null;
        }

        // Verify the user still exists in the database
        const serviceClient = createServiceClient();
        const { data: user, error } = await serviceClient
            .from('users')
            .select('id, username, role, active')
            .eq('id', sessionData.userId)
            .single();

        if (error || !user || !user.active) {
            console.warn(`User not found or inactive: ${sessionData.userId}`, error);
            return null;
        }

        console.log('[validateCustomSession] Session validated successfully for:', sessionData.username);
        // Return the validated session
        return sessionData;
    } catch (error) {
        console.error('Error validating custom session:', error);
        return null;
    }
}
