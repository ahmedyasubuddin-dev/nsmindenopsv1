import { createClient, createServiceClient } from '@/lib/supabase/server';
import { validateCustomSession } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const params = await context.params;
    const userId = params.id;

    // Prevent deleting yourself
    if (userId === session.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Use service client to delete from both tables
    const serviceClient = createServiceClient();

    // Delete from public.users first
    const { error: profileError } = await serviceClient
      .from('users')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to delete user profile: ' + profileError.message },
        { status: 500 }
      );
    }

    // Delete from auth.users
    try {
      const { error: authError } = await serviceClient.auth.admin.deleteUser(userId);

      if (authError) {
        console.warn('Error deleting auth user (profile already deleted):', authError);
        // Don't fail - profile is already deleted
      }
    } catch (authError) {
      console.warn('Auth user deletion failed:', authError);
      // Don't fail - profile is already deleted
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('User DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update user (for role changes, etc.)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const params = await context.params;
    const userId = params.id;
    const body = await request.json();
    const { role, active } = body;

    const serviceClient = createServiceClient();

    // Update public.users
    const updateData: any = {};
    if (role !== undefined) {
      updateData.role = role;
    }
    if (active !== undefined) {
      updateData.active = active;
    }

    const { error: profileError } = await serviceClient
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to update user: ' + profileError.message },
        { status: 500 }
      );
    }

    // Update auth.users metadata
    if (role !== undefined) {
      try {
        await serviceClient.auth.admin.updateUserById(userId, {
          user_metadata: { role },
        });
      } catch (authError) {
        console.warn('Could not update auth user metadata:', authError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('User PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
