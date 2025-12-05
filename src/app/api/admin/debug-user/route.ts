import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';

/**
 * Debug endpoint to check user status
 * GET /api/admin/debug-user?username=superuser
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username') || 'superuser';

    const serviceClient = createServiceClient();

    // Get user from database
    const { data: user, error: userError } = await serviceClient
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    // Get auth users
    const { data: { users: authUsers }, error: authError } = await serviceClient.auth.admin.listUsers();

    // Find matching auth user
    const matchingAuthUser = authUsers?.find(u => 
      u.user_metadata?.username === username || 
      u.email?.includes(username)
    );

    // Test password if provided
    const testPassword = searchParams.get('testPassword');
    let passwordMatch = null;
    if (testPassword && user?.password_hash) {
      try {
        passwordMatch = await bcrypt.compare(testPassword, user.password_hash);
      } catch (e) {
        passwordMatch = false;
      }
    }

    return NextResponse.json({
      username,
      databaseUser: user ? {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        active: user.active,
        hasPasswordHash: !!user.password_hash,
        passwordHashLength: user.password_hash?.length || 0,
        passwordMatches: passwordMatch,
      } : null,
      databaseError: userError?.message || null,
      authUser: matchingAuthUser ? {
        id: matchingAuthUser.id,
        email: matchingAuthUser.email,
        username: matchingAuthUser.user_metadata?.username,
        role: matchingAuthUser.user_metadata?.role,
        emailConfirmed: matchingAuthUser.email_confirmed_at !== null,
      } : null,
      authError: authError?.message || null,
      allAuthUsers: authUsers?.map(u => ({
        id: u.id,
        email: u.email,
        username: u.user_metadata?.username,
      })) || [],
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}





