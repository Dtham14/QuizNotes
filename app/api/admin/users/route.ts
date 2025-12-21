import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Create an untyped admin client to avoid strict type checking issues
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const users = (profiles || []).map((p: {
      id: string;
      email: string;
      name: string | null;
      role: string;
      subscription_status: string | null;
      created_at: string;
    }) => ({
      id: p.id,
      email: p.email,
      name: p.name,
      role: p.role,
      subscriptionStatus: p.subscription_status,
      createdAt: p.created_at,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSession();

    if (!user) {
      console.log('PATCH /api/admin/users: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      console.log('PATCH /api/admin/users: User is not admin, role:', user.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json() as { userId: string; role: string };
    const { userId, role } = body;

    console.log('PATCH /api/admin/users: Updating user', userId, 'to role', role);

    if (!userId || !role || !['admin', 'teacher', 'student', 'student-premium'].includes(role)) {
      console.log('PATCH /api/admin/users: Invalid request - userId:', userId, 'role:', role);
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Handle student-premium as a special case
    if (role === 'student-premium') {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          role: 'student',
          subscription_status: 'active'
        })
        .eq('id', userId);

      if (error) {
        console.error('PATCH /api/admin/users: Database error (student-premium):', JSON.stringify(error));
        return NextResponse.json({ error: error.message || 'Database error' }, { status: 500 });
      }
      console.log('PATCH /api/admin/users: Successfully updated to student-premium');
    } else {
      // For regular role changes, also reset subscription status if not student-premium
      const updateData: { role: string; subscription_status: string } = {
        role,
        subscription_status: 'none' // Clear subscription status for all non-premium roles
      };

      console.log('PATCH /api/admin/users: Update data:', updateData);

      const { error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('PATCH /api/admin/users: Database error:', JSON.stringify(error));
        return NextResponse.json({ error: error.message || 'Database error' }, { status: 500 });
      }
      console.log('PATCH /api/admin/users: Successfully updated to', role);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/admin/users: Exception caught:', error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json(
      { error: errorMessage || 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await request.json() as { userId: string };

    if (!userId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Prevent deleting yourself
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Delete profile (this will cascade or the auth user can be deleted separately)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      throw profileError;
    }

    // Also delete the auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Failed to delete auth user:', authError);
      // Profile is already deleted, so we still return success
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 500 }
    );
  }
}
