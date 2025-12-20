import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { QuizType, QuizSettings } from '@/lib/quizBuilder/types';

// GET - Retrieve user's saved quiz settings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get quiz type from query params (optional)
    const searchParams = request.nextUrl.searchParams;
    const quizType = searchParams.get('quizType') as QuizType | null;

    // Fetch user's quiz defaults from profile using admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('quiz_defaults')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching quiz settings:', profileError);
      // Return empty settings if column doesn't exist yet
      return NextResponse.json({ settings: {} });
    }

    const quizDefaults = profile?.quiz_defaults || {};

    // If specific quiz type requested, return only that
    if (quizType && quizType in quizDefaults) {
      return NextResponse.json({ settings: quizDefaults[quizType] });
    }

    // Return all settings
    return NextResponse.json({ settings: quizDefaults });

  } catch (error) {
    console.error('Quiz settings GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Save user's quiz settings
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { quizType, settings } = body as { quizType: QuizType; settings: QuizSettings };

    if (!quizType || !settings) {
      return NextResponse.json(
        { error: 'Missing quizType or settings' },
        { status: 400 }
      );
    }

    // Get current quiz defaults using admin client
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('quiz_defaults')
      .eq('id', user.id)
      .single();

    // Merge new settings with existing (handle case where column doesn't exist)
    const currentDefaults = profile?.quiz_defaults || {};
    const updatedDefaults = {
      ...currentDefaults,
      [quizType]: settings,
    };

    // Update profile with new quiz defaults using admin client
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ quiz_defaults: updatedDefaults })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error saving quiz settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to save quiz settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz settings saved successfully',
    });

  } catch (error) {
    console.error('Quiz settings POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Clear user's saved settings for a quiz type
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get quiz type from query params
    const searchParams = request.nextUrl.searchParams;
    const quizType = searchParams.get('quizType') as QuizType | null;

    if (!quizType) {
      return NextResponse.json(
        { error: 'Missing quizType parameter' },
        { status: 400 }
      );
    }

    // Get current quiz defaults using admin client
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('quiz_defaults')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching current settings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch current settings' },
        { status: 500 }
      );
    }

    // Remove the specified quiz type from defaults
    const currentDefaults = profile?.quiz_defaults || {};
    const { [quizType]: removed, ...updatedDefaults } = currentDefaults;

    // Update profile using admin client
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ quiz_defaults: updatedDefaults })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error clearing quiz settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to clear quiz settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz settings cleared successfully',
    });

  } catch (error) {
    console.error('Quiz settings DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
