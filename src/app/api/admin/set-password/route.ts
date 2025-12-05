import { createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';

/**
 * Admin endpoint to set password for a user
 * This is a temporary utility for initial setup
 * POST /api/admin/set-password
 * Body: { username: string, password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Find user
    let { data: user, error: findError } = await serviceClient
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    // If user doesn't exist, create it
    if (findError || !user) {
      console.log(`User '${username}' not found, creating...`);
      
      // Create user with default role
      const defaultRole = username; // Username equals role
      const defaultEmail = `${username}@nsmindenops.com`;
      
      const { data: newUser, error: createError } = await serviceClient
        .from('users')
        .insert({
          username: username,
          role: defaultRole,
          email: defaultEmail,
          display_name: username,
          active: true,
        })
        .select()
        .single();

      if (createError || !newUser) {
        return NextResponse.json(
          { error: `Failed to create user: ${createError?.message || 'Unknown error'}` },
          { status: 500 }
        );
      }

      user = newUser;
      console.log(`Created user '${username}' with ID: ${user.id}`);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user password hash
    const { error: updateError } = await serviceClient
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Update/create auth user
    const authEmail = user.email || `${username}@nsmindenops.com`;
    
    try {
      // Check if auth user exists
      const { data: { users: authUsers } } = await serviceClient.auth.admin.listUsers();
      const existingAuthUser = authUsers.find(u => 
        u.user_metadata?.username === username || u.email === authEmail
      );

      if (existingAuthUser) {
        // Update existing auth user password
        await serviceClient.auth.admin.updateUserById(existingAuthUser.id, {
          password: password,
          user_metadata: {
            username: username,
            role: user.role,
          },
        });
      } else {
        // Create new auth user
        await serviceClient.auth.admin.createUser({
          email: authEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            username: username,
            role: user.role,
          },
        });
      }
    } catch (authError: any) {
      console.warn('Could not update/create auth user:', authError);
      // Continue - password hash is set, user can log in
    }

    return NextResponse.json({
      success: true,
      message: `Password set for user '${username}'`,
    });
  } catch (error) {
    console.error('Set password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

