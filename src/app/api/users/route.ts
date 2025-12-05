import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { validateCustomSession } from '@/lib/auth-helpers';

// List all users (superuser only)
export async function GET(request: NextRequest) {
  try {
    console.log('[GET /api/users] Validating session...');

    // Validate custom session
    const session = await validateCustomSession(request);

    console.log('[GET /api/users] Session:', session ? `User: ${session.username}, Role: ${session.role}` : 'null');

    if (!session) {
      console.warn('[GET /api/users] No valid session found');
      return NextResponse.json(
        {
          error: 'Unauthorized',
          debug: {
            headers: {
              'x-user-id': request.headers.get('x-user-id'),
              'x-user-role': request.headers.get('x-user-role'),
              'x-session-token': request.headers.get('x-session-token'),
              'cookie': request.cookies.get('ns-session-token')?.value ? 'present' : 'missing'
            }
          }
        },
        { status: 401 }
      );
    }

    // Check if user is superuser
    if (session.role !== 'superuser') {
      console.warn('[GET /api/users] User is not superuser:', session.role);
      return NextResponse.json(
        { error: 'Forbidden - Superuser access required' },
        { status: 403 }
      );
    }

    // Get all users from database using service client
    const serviceClient = createServiceClient();
    const { data: users, error } = await serviceClient
      .from('users')
      .select('id, email, username, display_name, role, active, created_at, last_login_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: users || [],
    });
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new user (superuser only)
// Username = Role (as per requirements)
export async function POST(request: NextRequest) {
  try {
    // Validate custom session
    const session = await validateCustomSession(request);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is superuser
    if (session.role !== 'superuser') {
      return NextResponse.json(
        { error: 'Forbidden - Superuser access required' },
        { status: 403 }
      );
    }

    // Use service client to bypass RLS for user creation
    const serviceClient = createServiceClient();

    const body = await request.json();
    const { username, password, role, email } = body;

    if (!username || !password || !role) {
      return NextResponse.json(
        { error: 'Username, password, and role are required' },
        { status: 400 }
      );
    }

    // Normalize role to match username format
    const normalizedRole = role.toLowerCase().replace(/\s+/g, '_');

    // Username must equal role (as per requirements)
    if (username !== normalizedRole) {
      return NextResponse.json(
        { error: 'Username must match the selected role' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const { data: existingUser } = await serviceClient
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user profile in database first
    const { data: userProfile, error: profileError } = await serviceClient
      .from('users')
      .insert({
        username: username, // Username = role
        role: normalizedRole,
        password_hash: passwordHash,
        email: email || `${username}@nsmindenops.com`,
        active: true,
        display_name: username,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to create user profile: ' + profileError.message },
        { status: 500 }
      );
    }

    // Create corresponding auth user (required for login)
    // Create corresponding auth user (required for login)
    // Use a unique email format: username+timestamp@nsmindenops.com
    // This prevents email conflicts in Supabase Auth
    const uniqueEmail = email || `${username}@nsmindenops.com`;

    try {
      // Check if auth user already exists with this email
      const { data: existingAuthUsers } = await serviceClient.auth.admin.listUsers();
      const existingAuthUser = existingAuthUsers?.users.find((u: any) =>
        u.email === uniqueEmail || u.user_metadata?.username === username
      );

      if (existingAuthUser) {
        // Update existing auth user to match our user profile
        await serviceClient.auth.admin.updateUserById(existingAuthUser.id, {
          password: password,
          email_confirm: true,
          user_metadata: {
            username: username,
            role: normalizedRole,
          },
        });
        console.log('Updated existing auth user for:', username);

        // Update the public.users record to use the existing auth user ID
        await serviceClient
          .from('users')
          .update({ id: existingAuthUser.id })
          .eq('id', userProfile.id);

      } else {
        // Create new auth user
        const { data: newAuthUser, error: createError } = await serviceClient.auth.admin.createUser({
          email: uniqueEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            username: username,
            role: normalizedRole,
          },
        });

        if (createError) {
          console.error('Error creating auth user:', createError);

          // If it's an email conflict, try to find and link the existing user
          if (createError.message?.includes('already') || createError.message?.includes('duplicate') || createError.message?.includes('unique')) {
            const { data: allUsers } = await serviceClient.auth.admin.listUsers();
            const matchingUser = allUsers?.users.find((u: any) =>
              u.email === uniqueEmail || u.user_metadata?.username === username
            );

            if (matchingUser) {
              // Update password and metadata
              await serviceClient.auth.admin.updateUserById(matchingUser.id, {
                password: password,
                email_confirm: true,
                user_metadata: { username: username, role: normalizedRole },
              });

              // Update the public.users record to use the existing auth user ID
              await serviceClient
                .from('users')
                .update({ id: matchingUser.id })
                .eq('id', userProfile.id);

              console.log('Found and linked existing auth user for:', username);
            } else {
              // Can't create auth user, but profile exists
              console.warn('Auth user creation failed, but profile was created. User will need manual auth setup.');
            }
          } else {
            // Other error - log it but don't fail
            console.warn('Auth user creation failed with unexpected error:', createError.message);
          }
        } else if (newAuthUser?.user) {
          console.log('Created new auth user for:', username);

          // Update the public.users record to use the auth user ID
          if (newAuthUser.user.id !== userProfile.id) {
            await serviceClient
              .from('users')
              .update({ id: newAuthUser.user.id })
              .eq('id', userProfile.id);
          }
        }
      }
    } catch (authError: any) {
      console.error('Error in auth user creation/update:', authError);
      // Don't fail the request - user profile is created, they can log in and auth will be created then
      console.warn('User profile created but auth user setup failed. User can still log in - auth will be created automatically.');
    }

    return NextResponse.json({
      data: {
        uid: userProfile.id,
        username: userProfile.username,
        role: userProfile.role,
        email: userProfile.email,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Users POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
