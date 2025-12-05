import { createServiceClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Use service client for initial user lookup (bypasses RLS)
    // We can't use regular client because user isn't authenticated yet
    const serviceClient = createServiceClient();

    // Find user by username (which equals role)
    const { data: userProfile, error: profileError } = await serviceClient
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('active', true)
      .single();

    // Enhanced error logging
    if (profileError) {
      console.error('Login error - User lookup failed:', {
        username,
        error: profileError.message,
        code: profileError.code,
        details: profileError.details,
      });
      return NextResponse.json(
        { error: 'Invalid username or password', debug: 'User not found in database' },
        { status: 401 }
      );
    }

    if (!userProfile) {
      console.error('Login error - User profile is null:', { username });
      return NextResponse.json(
        { error: 'Invalid username or password', debug: 'User profile is null' },
        { status: 401 }
      );
    }

    // Verify password
    if (!userProfile.password_hash) {
      console.error('Login error - No password hash:', {
        username,
        userId: userProfile.id,
      });
      return NextResponse.json(
        { error: 'User account not properly configured. Please set your password.', debug: 'password_hash is null or empty' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, userProfile.password_hash);
    if (!isValidPassword) {
      console.error('Login error - Password mismatch:', {
        username,
        passwordHashLength: userProfile.password_hash.length,
      });
      return NextResponse.json(
        { error: 'Invalid username or password', debug: 'Password does not match hash' },
        { status: 401 }
      );
    }

    console.log('Password verified successfully for:', username);

    // BYPASS SUPABASE AUTH - Use custom session management
    // Create a simple session token
    const sessionToken = Buffer.from(JSON.stringify({
      userId: userProfile.id,
      username: userProfile.username,
      role: userProfile.role,
      email: userProfile.email,
      timestamp: Date.now(),
    })).toString('base64');

    // Update last login (use service client to bypass RLS)
    await serviceClient
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userProfile.id);

    // Create response with session cookie
    const response = NextResponse.json({
      user: {
        id: userProfile.id,
        username: userProfile.username,
        role: userProfile.role,
        email: userProfile.email || `${username}@nsmindenops.com`,
      },
      profile: userProfile,
      session: {
        access_token: sessionToken,
        user: {
          id: userProfile.id,
          email: userProfile.email,
          user_metadata: {
            username: userProfile.username,
            role: userProfile.role,
          },
        },
      },
    });

    // Set session cookie (mimicking Supabase format)
    response.cookies.set('ns-session-token', sessionToken, {
      path: '/',
      httpOnly: false, // Keep false for now to allow client-side debugging
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log('✓ Custom session created successfully');
    console.log(`Login successful - session cookie set`);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



